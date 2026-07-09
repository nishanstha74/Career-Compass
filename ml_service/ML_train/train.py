"""
STEP 2 — Train the Model
--------------------------
Loads resume_data.csv, builds features (via preprocess.py), trains a
regressor (XGBoost, RandomForest, or both) to predict `matched_score`,
evaluates it with multiple metrics, and saves everything needed to run
predictions later.

Run:
    python train.py resume_data.csv
    python train.py resume_data.csv --model xgboost
    python train.py resume_data.csv --model random_forest
    python train.py resume_data.csv --model both        (default)
"""
import argparse
import sys

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import (
    explained_variance_score,
    mean_absolute_error,
    mean_absolute_percentage_error,
    mean_squared_error,
    median_absolute_error,
    r2_score,
)
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor

from preprocess import build_features

RANDOM_STATE = 42


# ----------------------------------------------------------------------
# Model registry — add new models here and they'll automatically be
# picked up by --model both / CLI choices.
# ----------------------------------------------------------------------
def get_model(name: str):
    if name == "xgboost":
        return XGBRegressor(
            n_estimators=300,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=RANDOM_STATE,
        )
    if name == "random_forest":
        return RandomForestRegressor(
            n_estimators=300,
            max_depth=None,
            min_samples_leaf=2,
            n_jobs=-1,
            random_state=RANDOM_STATE,
        )
    raise ValueError(f"Unknown model: {name}")


def evaluate(y_test, preds) -> dict:
    """Compute a broad set of regression metrics."""
    mae = mean_absolute_error(y_test, preds)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    r2 = r2_score(y_test, preds)
    medae = median_absolute_error(y_test, preds)
    evs = explained_variance_score(y_test, preds)

    # MAPE can blow up / error out if y_test has zeros — guard for that.
    try:
        mask = y_test != 0
        mape = (
            mean_absolute_percentage_error(y_test[mask], preds[mask]) * 100
            if mask.any()
            else float("nan")
        )
    except Exception:
        mape = float("nan")

    # Accuracy-within-tolerance: fraction of predictions within 5 / 10
    # points of the true matched_score. Useful, interpretable alongside
    # the pure error metrics above.
    within_5 = float(np.mean(np.abs(y_test - preds) <= 5) * 100)
    within_10 = float(np.mean(np.abs(y_test - preds) <= 10) * 100)

    return {
        "MAE": mae,
        "RMSE": rmse,
        "MedAE": medae,
        "R2": r2,
        "Explained Variance": evs,
        "MAPE (%)": mape,
        "Within ±5 pts (%)": within_5,
        "Within ±10 pts (%)": within_10,
    }


def print_metrics(name: str, metrics: dict):
    print(f"\n=== {name}: evaluation on held-out test set ===")
    for k, v in metrics.items():
        print(f"  {k:22s} {v:.4f}")


def print_feature_importance(name: str, model, feature_names):
    if not hasattr(model, "feature_importances_"):
        return
    print(f"\n=== {name}: feature importance ===")
    importances = model.feature_importances_
    for fname, imp in sorted(zip(feature_names, importances), key=lambda x: -x[1]):
        print(f"  {fname:22s} {imp:.4f}")


def cosine_sim_rowwise(A, B):
    A = A.toarray()
    B = B.toarray()
    num = (A * B).sum(axis=1)
    denom = (np.linalg.norm(A, axis=1) * np.linalg.norm(B, axis=1)) + 1e-9
    return num / denom


def main(csv_path: str, model_choice: str):
    # ---- 1. Load raw data ----
    print(f"Loading {csv_path} ...")
    df = pd.read_csv(csv_path)
    df.columns = [c.replace("\ufeff", "") for c in df.columns]
    print(f"  {df.shape[0]} rows, {df.shape[1]} columns")

    # ---- 2. Build engineered features ----
    feats = build_features(df)
    y = df["matched_score"].values

    numeric_cols = [
        "skill_overlap_ratio",
        "n_candidate_skills",
        "n_required_skills",
        "n_positions_held",
        "required_min_years",
        "has_career_objective",
        "has_certification",
        "has_languages",
    ]
    X_numeric = feats[numeric_cols].values
    resume_text = feats["resume_text"].values
    job_text = feats["job_text"].values

    # ---- 3. Train/test split FIRST (before fitting TF-IDF, to avoid leakage) ----
    (
        X_num_train, X_num_test,
        resume_train, resume_test,
        job_train, job_test,
        y_train, y_test,
    ) = train_test_split(
        X_numeric, resume_text, job_text, y,
        test_size=0.2, random_state=RANDOM_STATE,
    )
    print(f"  Train: {len(y_train)} rows | Test: {len(y_test)} rows")

    # ---- 4. TF-IDF text features ----
    print("Fitting TF-IDF vectorizers...")
    resume_vectorizer = TfidfVectorizer(max_features=300, stop_words="english")
    job_vectorizer = TfidfVectorizer(max_features=300, stop_words="english")

    resume_tfidf_train = resume_vectorizer.fit_transform(resume_train)
    resume_tfidf_test = resume_vectorizer.transform(resume_test)

    job_tfidf_train = job_vectorizer.fit_transform(job_train)
    job_tfidf_test = job_vectorizer.transform(job_test)

    text_sim_train = cosine_sim_rowwise(resume_tfidf_train, job_tfidf_train).reshape(-1, 1)
    text_sim_test = cosine_sim_rowwise(resume_tfidf_test, job_tfidf_test).reshape(-1, 1)

    # ---- 5. Combine numeric features + text similarity into final X ----
    X_train = np.hstack([X_num_train, text_sim_train])
    X_test = np.hstack([X_num_test, text_sim_test])
    feature_names = numeric_cols + ["text_similarity"]

    # ---- 6. Train + evaluate the requested model(s) ----
    model_names = ["xgboost", "random_forest"] if model_choice == "both" else [model_choice]

    results = {}
    trained_models = {}
    for name in model_names:
        print(f"\nTraining {name} regressor...")
        model = get_model(name)
        model.fit(X_train, y_train)
        preds = model.predict(X_test)

        metrics = evaluate(y_test, preds)
        print_metrics(name, metrics)
        print_feature_importance(name, model, feature_names)

        results[name] = metrics
        trained_models[name] = model

    # ---- 7. Compare models (if more than one was trained) ----
    if len(results) > 1:
        print("\n=== Model comparison (lower MAE/RMSE/MAPE = better, higher R2/EVS/Within-X% = better) ===")
        metric_keys = next(iter(results.values())).keys()
        header = f"  {'Metric':22s}" + "".join(f"{name:>16s}" for name in results)
        print(header)
        for mk in metric_keys:
            row = f"  {mk:22s}" + "".join(f"{results[name][mk]:16.4f}" for name in results)
            print(row)

        # Pick the best model by R2 (highest wins) and report it.
        best_name = max(results, key=lambda n: results[n]["R2"])
        print(f"\nBest model by R2: {best_name}")
    else:
        best_name = model_names[0]

    # ---- 8. Save everything needed to predict on new data later ----
    best_model = trained_models[best_name]
    joblib.dump(best_model, "model.joblib")
    joblib.dump(resume_vectorizer, "resume_vectorizer.joblib")
    joblib.dump(job_vectorizer, "job_vectorizer.joblib")
    joblib.dump(feature_names, "feature_names.joblib")

    # Also save every trained model individually (e.g. model_xgboost.joblib,
    # model_random_forest.joblib) in case you want to compare/swap later.
    for name, model in trained_models.items():
        joblib.dump(model, f"model_{name}.joblib")

    print(f"\nSaved: model.joblib (best = {best_name}), resume_vectorizer.joblib, "
          f"job_vectorizer.joblib, feature_names.joblib")
    if len(trained_models) > 1:
        extra = ", ".join(f"model_{n}.joblib" for n in trained_models)
        print(f"Also saved individual models: {extra}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train a resume/job matched_score regressor.")
    parser.add_argument(
        "csv_path",
        nargs="?",
        default="D:/PROJECT/Career-Compass/ml_service/dataset/resume_data.csv",
        help="Path to resume_data.csv",
    )
    parser.add_argument(
        "--model",
        choices=["xgboost", "random_forest", "both"],
        default="both",
        help="Which model(s) to train (default: both)",
    )
    args = parser.parse_args()
    main(args.csv_path, args.model)