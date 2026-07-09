"""
STEP 2 — Train the Model
--------------------------
Loads resume_data.csv, builds features (via preprocess.py), trains an
XGBoost regressor to predict `matched_score`, evaluates it, and saves
everything needed to run predictions later.

Run:
    python train.py resume_data.csv
"""
import sys

import joblib
import numpy as np
import pandas as pd
from scipy.sparse import hstack
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor

from preprocess import build_features

RANDOM_STATE = 42


def main(csv_path: str):
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
    # We fit TWO separate vectorizers (one for resumes, one for jobs) on the
    # TRAINING set only, then transform both train and test with them.
    print("Fitting TF-IDF vectorizers...")
    resume_vectorizer = TfidfVectorizer(max_features=300, stop_words="english")
    job_vectorizer = TfidfVectorizer(max_features=300, stop_words="english")

    resume_tfidf_train = resume_vectorizer.fit_transform(resume_train)
    resume_tfidf_test = resume_vectorizer.transform(resume_test)

    job_tfidf_train = job_vectorizer.fit_transform(job_train)
    job_tfidf_test = job_vectorizer.transform(job_test)

    # Cosine similarity between each resume's TF-IDF vector and its job's TF-IDF
    # vector — this is a single number per row summarizing textual closeness.
    def cosine_sim_rowwise(A, B):
        A = A.toarray()
        B = B.toarray()
        num = (A * B).sum(axis=1)
        denom = (np.linalg.norm(A, axis=1) * np.linalg.norm(B, axis=1)) + 1e-9
        return num / denom

    text_sim_train = cosine_sim_rowwise(resume_tfidf_train, job_tfidf_train).reshape(-1, 1)
    text_sim_test = cosine_sim_rowwise(resume_tfidf_test, job_tfidf_test).reshape(-1, 1)

    # ---- 5. Combine numeric features + text similarity into final X ----
    X_train = np.hstack([X_num_train, text_sim_train])
    X_test = np.hstack([X_num_test, text_sim_test])
    feature_names = numeric_cols + ["text_similarity"]

    # ---- 6. Train the model ----
    print("Training XGBoost regressor...")
    model = XGBRegressor(
        n_estimators=300,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=RANDOM_STATE,
    )
    model.fit(X_train, y_train)

    # ---- 7. Evaluate ----
    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    r2 = r2_score(y_test, preds)

    print("\n=== Evaluation on held-out test set ===")
    print(f"  MAE  : {mae:.4f}  (average error in matched_score units)")
    print(f"  RMSE : {rmse:.4f}")
    print(f"  R2   : {r2:.4f}  (1.0 = perfect, 0.0 = no better than guessing the mean)")

    print("\n=== Feature importance ===")
    importances = model.feature_importances_
    for name, imp in sorted(zip(feature_names, importances), key=lambda x: -x[1]):
        print(f"  {name:22s} {imp:.4f}")

    # ---- 8. Save everything needed to predict on new data later ----
    joblib.dump(model, "model.joblib")
    joblib.dump(resume_vectorizer, "resume_vectorizer.joblib")
    joblib.dump(job_vectorizer, "job_vectorizer.joblib")
    joblib.dump(feature_names, "feature_names.joblib")
    print("\nSaved: model.joblib, resume_vectorizer.joblib, job_vectorizer.joblib, feature_names.joblib")


if __name__ == "__main__":
    csv_path = sys.argv[1] if len(sys.argv) > 1 else "resume_data.csv"
    main(csv_path)
