# -*- coding: utf-8 -*-
"""train.py

Resume-to-Job Matching Model Training Script
"""

import os
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from sklearn.svm import SVR
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor

MODEL_DIR = "../models"
DATASET_PATH = "../dataset/resume_data_last_dance.csv"

os.makedirs(MODEL_DIR, exist_ok=True)

# 1. Load Dataset & Clean Headers
df = pd.read_csv(DATASET_PATH)
df.columns = df.columns.str.strip().str.replace('\ufeff', '', regex=False)

# 2. Define Separate Feature Groups
resume_cols = [
    "career_objective",
    "skills",
    "educational_institution_name",
    "degree_names",
    "educational_results",
    "result_types",
    "major_field_of_studies",
    "related_skils_in_job",
    "positions",
    "responsibilities",
    "extra_curricular_activity_types",
    "role_positions",
    "languages",
    "proficiency_levels",
    "certification_providers",
    "certification_skills",
]

job_cols = [
    "job_position_name",
    "educationaL_requirements",
    "experiencere_requirement",
    "age_requirement",
    "responsibilities.1",
    "skills_required",
]

target_col = "matched_score"

# 3. Clean Missing Values Across Text Columns
all_feature_cols = resume_cols + job_cols
df[all_feature_cols] = df[all_feature_cols].replace(
    ["N/A", "NA", "None", "none", "null", "NULL", "", "nan"], np.nan
)
df[all_feature_cols] = df[all_feature_cols].replace(r".*N/A.*", np.nan, regex=True)
df[all_feature_cols] = df[all_feature_cols].fillna("")

# 4. Construct Pairwise Input (RESUME vs JOB)
resume_text = df[resume_cols].astype(str).agg(" ".join, axis=1)
job_text = df[job_cols].astype(str).agg(" ".join, axis=1)

X = pd.DataFrame({
    "text": "RESUME: " + resume_text + " | JOB: " + job_text
})
y = df[target_col].astype(float)

# 5. Train-Test Split
X_train, X_test, y_train, y_test = train_test_split(
    X["text"], y, test_size=0.20, random_state=42
)

print(f"Training Samples: {len(X_train)} | Test Samples: {len(X_test)}")

# Helper Evaluation Function
def evaluate_and_save(pipeline, model_name, filename):
    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    print(f"\n========== {model_name} Results ==========")
    print(f"MAE : {mae:.4f}")
    print(f"RMSE: {rmse:.4f}")
    print(f"R2  : {r2:.4f}")
    
    save_path = os.path.join(MODEL_DIR, filename)
    joblib.dump(pipeline, save_path)
    print(f"Saved {model_name} model to {save_path}")


# 6. Train Models

# --- SVR ---
svr_pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(
        max_features=20000,
        ngram_range=(1, 2),
        stop_words="english",
        sublinear_tf=True
    )),
    ("model", SVR(kernel="rbf", C=10, gamma="scale", epsilon=0.05))
])
evaluate_and_save(svr_pipeline, "SVR", "svr_model.joblib")

# --- Random Forest ---
rf_pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(
        max_features=20000,
        ngram_range=(1, 2),
        stop_words="english",
        sublinear_tf=True
    )),
    ("model", RandomForestRegressor(
        n_estimators=300,
        max_depth=30,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    ))
])
evaluate_and_save(rf_pipeline, "Random Forest", "random_forest_model.joblib")

# --- XGBoost ---
xgb_pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(
        max_features=20000,
        ngram_range=(1, 2),
        stop_words="english",
        sublinear_tf=True
    )),
    ("model", XGBRegressor(
        n_estimators=500,
        learning_rate=0.05,
        max_depth=8,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="reg:squarederror",
        random_state=42
    ))
])
evaluate_and_save(xgb_pipeline, "XGBoost", "xgboost_model.joblib")