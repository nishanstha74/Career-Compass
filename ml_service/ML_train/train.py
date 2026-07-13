"""
STEP 2 — Train the Model
--------------------------
Loads resume_data.csv, builds features (via preprocess.py), trains a
regressor (XGBoost, RandomForest, or both) to predict `matched_score`,
evaluates it with multiple metrics, and saves everything needed to run
predictions later.

CHANGES vs previous version:
  1. numeric_cols expanded with the new preprocess.py features:
     skill_precision, skill_recall, skill_f1, candidate_years,
     experience_gap, candidate_education_level, required_education_level,
     education_level_diff, education_match, n_certifications, n_languages.
  2. NEW --embeddings flag: swaps TF-IDF cosine similarity for
     Sentence-BERT (all-MiniLM-L6-v2) embedding cosine similarity, which
     the advice flagged as the single biggest lever (+0.05 to +0.10 R2).
     Falls back to TF-IDF if sentence-transformers isn't installed.
  3. NEW --model catboost option (often matches/beats XGBoost with less
     tuning, per the advice).
  4. Added a target-leakage sanity check: prints correlation of every
     engineered feature with matched_score so you can eyeball anything
     suspiciously close to 1.0 (a sign a feature indirectly encodes
     the label).

Run:
    python train.py resume_data.csv
    python train.py resume_data.csv --model xgboost
    python train.py resume_data.csv --model catboost
    python train.py resume_data.csv --model both
    python train.py resume_data.csv --embeddings          (Sentence-BERT similarity)
    python train.py resume_data.csv --tune --n-iter 100
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
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from xgboost import XGBRegressor

from preprocess import build_features

RANDOM_STATE = 42


# ----------------------------------------------------------------------
# Model registry
# ----------------------------------------------------------------------
def get_model(name: str):
    if name == "xgboost":
        return XGBRegressor(
            n_estimators=600,
            max_depth=5,
            learning_rate=0.03,
            subsample=0.8,
            colsample_bytree=0.8,
            min_child_weight=3,
            reg_alpha=0.1,
            reg_lambda=1.0,
            random_state=RANDOM_STATE,
        )
    if name == "random_forest":
        return RandomForestRegressor(
            n_estimators=500,
            max_depth=None,
            min_samples_leaf=2,
            max_features="sqrt",
            n_jobs=-1,
            random_state=RANDOM_STATE,
        )
    if name == "catboost":
        try:
            from catboost import CatBoostRegressor
        except ImportError as e:
            raise ImportError(
                "catboost isn't installed. Run: pip install catboost"
            ) from e
        return CatBoostRegressor(
            iterations=700,
            learning_rate=0.03,
            depth=6,
            random_state=RANDOM_STATE,
            verbose=False,
        )
    raise ValueError(f"Unknown model: {name}")


def get_search_space(name: str):
    if name == "xgboost":
        return {
            "n_estimators": [200, 300, 500, 700, 900],
            "max_depth": [3, 4, 5, 6, 8],
            "learning_rate": [0.01, 0.02, 0.03, 0.05, 0.07, 0.1],
            "subsample": [0.6, 0.7, 0.8, 0.9, 1.0],
            "colsample_bytree": [0.6, 0.7, 0.8, 0.9, 1.0],
            "min_child_weight": [1, 3, 5, 7],
            "reg_alpha": [0, 0.01, 0.1, 1, 5],
            "reg_lambda": [0.5, 1, 1.5, 2, 5],
        }
    if name == "random_forest":
        return {
            "n_estimators": [200, 300, 500, 700, 900],
            "max_depth": [None, 8, 12, 16, 20, 26],
            "min_samples_leaf": [1, 2, 3, 5, 8],
            "min_samples_split": [2, 4, 6, 10],
            "max_features": ["sqrt", "log2", 0.5, 0.7, 1.0],
        }
    if name == "catboost":
        return {
            "iterations": [300, 500, 700, 900],
            "learning_rate": [0.01, 0.02, 0.03, 0.05, 0.08],
            "depth": [4, 5, 6, 7, 8],
            "l2_leaf_reg": [1, 3, 5, 7, 9],
        }
    raise ValueError(f"Unknown model: {name}")


def tune_model(name: str, X_train, y_train, n_iter: int, cv: int = 5):
    base_model = get_model(name)
    search_space = get_search_space(name)

    search = RandomizedSearchCV(
        estimator=base_model,
        param_distributions=search_space,
        n_iter=n_iter,
        scoring="r2",
        cv=cv,
        random_state=RANDOM_STATE,
        n_jobs=-1,
        verbose=1,
    )
    search.fit(X_train, y_train)

    print(f"\n=== {name}: best params from RandomizedSearchCV (n_iter={n_iter}, cv={cv}) ===")
    for k, v in search.best_params_.items():
        print(f"  {k:22s} {v}")
    print(f"  Best CV R2: {search.best_score_:.4f}")

    return search.best_estimator_


def evaluate(y_test, preds) -> dict:
    mae = mean_absolute_error(y_test, preds)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    r2 = r2_score(y_test, preds)
    medae = median_absolute_error(y_test, preds)
    evs = explained_variance_score(y_test, preds)

    try:
        mask = y_test != 0
        mape = (
            mean_absolute_percentage_error(y_test[mask], preds[mask]) * 100
            if mask.any()
            else float("nan")
        )
    except Exception:
        mape = float("nan")

    within_5 = float(np.mean(np.abs(y_test - preds) <= 0.05) * 100)
    within_10 = float(np.mean(np.abs(y_test - preds) <= 0.10) * 100)

    return {
        "MAE": mae,
        "RMSE": rmse,
        "MedAE": medae,
        "R2": r2,
        "Explained Variance": evs,
        "MAPE (%)": mape,
        "Within ±0.05 (%)": within_5,
        "Within ±0.10 (%)": within_10,
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
    if hasattr(A, "toarray"):
        A = A.toarray()
    if hasattr(B, "toarray"):
        B = B.toarray()
    num = (A * B).sum(axis=1)
    denom = (np.linalg.norm(A, axis=1) * np.linalg.norm(B, axis=1)) + 1e-9
    return num / denom


def check_target_leakage(feats: pd.DataFrame, numeric_cols, y):
    """Prints correlation of every engineered numeric feature with the
    target. A correlation near ±1.0 is a red flag that the feature
    indirectly encodes matched_score rather than being genuinely
    predictive signal."""
    print("\n=== target-leakage check (correlation with matched_score) ===")
    y_series = pd.Series(y, index=feats.index)
    for col in numeric_cols:
        corr = feats[col].corr(y_series)
        flag = "  <-- check this" if abs(corr) > 0.9 else ""
        print(f"  {col:26s} {corr:6.3f}{flag}")


def get_text_similarity(resume_train, resume_test, job_train, job_test, use_embeddings: bool):
    """Returns (text_sim_train, text_sim_test) as (-1,1) arrays, plus the
    fitted encoder (vectorizer or embedding model) so it can be saved."""
    if use_embeddings:
        try:
            from sentence_transformers import SentenceTransformer
        except ImportError:
            print("sentence-transformers not installed (pip install sentence-transformers) "
                  "— falling back to TF-IDF.")
            use_embeddings = False

    if use_embeddings:
        print("Encoding text with Sentence-BERT (all-MiniLM-L6-v2)...")
        encoder = SentenceTransformer("all-MiniLM-L6-v2")
        r_train_emb = encoder.encode(list(resume_train), show_progress_bar=True)
        j_train_emb = encoder.encode(list(job_train), show_progress_bar=True)
        r_test_emb = encoder.encode(list(resume_test), show_progress_bar=True)
        j_test_emb = encoder.encode(list(job_test), show_progress_bar=True)

        sim_train = cosine_sim_rowwise(r_train_emb, j_train_emb).reshape(-1, 1)
        sim_test = cosine_sim_rowwise(r_test_emb, j_test_emb).reshape(-1, 1)
        return sim_train, sim_test, encoder, "embeddings"

    print("Fitting shared TF-IDF vectorizer on resume+job text...")
    text_vectorizer = TfidfVectorizer(
        max_features=600,
        stop_words="english",
        ngram_range=(1, 2),
        sublinear_tf=True,
        min_df=2,
    )
    combined_train_text = np.concatenate([resume_train, job_train])
    text_vectorizer.fit(combined_train_text)

    resume_tfidf_train = text_vectorizer.transform(resume_train)
    resume_tfidf_test = text_vectorizer.transform(resume_test)
    job_tfidf_train = text_vectorizer.transform(job_train)
    job_tfidf_test = text_vectorizer.transform(job_test)

    sim_train = cosine_sim_rowwise(resume_tfidf_train, job_tfidf_train).reshape(-1, 1)
    sim_test = cosine_sim_rowwise(resume_tfidf_test, job_tfidf_test).reshape(-1, 1)
    return sim_train, sim_test, text_vectorizer, "tfidf"


def main(csv_path: str, model_choice: str, tune: bool, n_iter: int, use_embeddings: bool):
    print(f"Loading {csv_path} ...")
    df = pd.read_csv(csv_path)
    df.columns = [c.replace("\ufeff", "") for c in df.columns]
    print(f"  {df.shape[0]} rows, {df.shape[1]} columns")

    feats = build_features(df)
    y = df["matched_score"].values

    print("\n=== target (matched_score) distribution ===")
    print(pd.Series(y).describe())

    numeric_cols = [
        "skill_overlap_ratio",
        "skill_jaccard",
        "n_skill_matches",
        "missing_required_skills",
        "skill_precision",
        "skill_recall",
        "skill_f1",
        "n_candidate_skills",
        "n_required_skills",
        "n_positions_held",
        "required_min_years",
        "candidate_years",
        "experience_gap",
        "candidate_education_level",
        "required_education_level",
        "education_level_diff",
        "education_match",
        "n_certifications",
        "has_certification",
        "n_languages",
        "has_languages",
        "has_career_objective",
    ]

    check_target_leakage(feats, numeric_cols, y)

    X_numeric = feats[numeric_cols].values
    resume_text = feats["resume_text"].values
    job_text = feats["job_text"].values

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

    text_sim_train, text_sim_test, encoder, encoder_kind = get_text_similarity(
        resume_train, resume_test, job_train, job_test, use_embeddings
    )

    all_sim = np.concatenate([text_sim_train.ravel(), text_sim_test.ravel()])
    print(f"  text_similarity ({encoder_kind}) stats: min={all_sim.min():.4f} "
          f"max={all_sim.max():.4f} mean={all_sim.mean():.4f} std={all_sim.std():.4f}")

    X_train = np.hstack([X_num_train, text_sim_train])
    X_test = np.hstack([X_num_test, text_sim_test])
    feature_names = numeric_cols + ["text_similarity"]

    model_names = (
        ["xgboost", "random_forest"] if model_choice == "both" else [model_choice]
    )

    results = {}
    trained_models = {}
    for name in model_names:
        if tune:
            print(f"\nTuning {name} regressor with RandomizedSearchCV...")
            model = tune_model(name, X_train, y_train, n_iter=n_iter)
        else:
            print(f"\nTraining {name} regressor...")
            model = get_model(name)
            model.fit(X_train, y_train)

        preds = model.predict(X_test)

        metrics = evaluate(y_test, preds)
        print_metrics(name, metrics)
        print_feature_importance(name, model, feature_names)

        results[name] = metrics
        trained_models[name] = model

    if len(trained_models) > 1:
        blend_preds = np.mean(
            [trained_models[n].predict(X_test) for n in trained_models], axis=0
        )
        blend_metrics = evaluate(y_test, blend_preds)
        print_metrics("blend (avg of models)", blend_metrics)
        results["blend"] = blend_metrics

    if len(results) > 1:
        print("\n=== Model comparison ===")
        metric_keys = next(iter(results.values())).keys()
        header = f"  {'Metric':22s}" + "".join(f"{name:>16s}" for name in results)
        print(header)
        for mk in metric_keys:
            row = f"  {mk:22s}" + "".join(f"{results[name][mk]:16.4f}" for name in results)
            print(row)
        best_name = max(results, key=lambda n: results[n]["R2"])
        print(f"\nBest model by R2: {best_name}")
    else:
        best_name = model_names[0]

    save_name = best_name if best_name in trained_models else max(
        trained_models, key=lambda n: results[n]["R2"]
    )
    best_model = trained_models[save_name]
    joblib.dump(best_model, "model.joblib")
    joblib.dump(encoder, "text_vectorizer.joblib")
    joblib.dump(feature_names, "feature_names.joblib")
    joblib.dump(encoder_kind, "encoder_kind.joblib")

    for name, model in trained_models.items():
        joblib.dump(model, f"model_{name}.joblib")

    print(f"\nSaved: model.joblib (best single model = {save_name}), "
          f"text_vectorizer.joblib ({encoder_kind}), feature_names.joblib")
    if best_name == "blend":
        print("Note: the blend beat any single model — consider averaging saved "
              "per-model predictions in predict.py for the best real-world results.")
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
        choices=["xgboost", "random_forest", "catboost", "both"],
        default="both",
        help="Which model(s) to train (default: both)",
    )
    parser.add_argument("--tune", action="store_true", help="Run RandomizedSearchCV.")
    parser.add_argument("--n-iter", type=int, default=30, help="Search iterations for --tune.")
    parser.add_argument(
        "--embeddings",
        action="store_true",
        help="Use Sentence-BERT embeddings instead of TF-IDF for text similarity "
             "(requires: pip install sentence-transformers).",
    )
    args = parser.parse_args()
    main(args.csv_path, args.model, args.tune, args.n_iter, args.embeddings)