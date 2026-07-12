"""
diagnose_job_baseline.py
-------------------------
Checks how much of matched_score's variance is explained just by KNOWING
WHICH JOB a row belongs to (ignoring the resume entirely) — i.e. a naive
"predict this job's average score" baseline.

If this baseline's R2 is close to what your trained models achieve, it
means the models aren't learning much about individual resume-job fit
beyond "this job tends to score around X" — a structural ceiling from
having only ~28 unique jobs repeated across ~9500 rows, not a modeling
problem you can tune your way out of.

Run:
    python diagnose_job_baseline.py
"""
import numpy as np
import pandas as pd
from sklearn.metrics import r2_score, mean_absolute_error
from sklearn.model_selection import train_test_split

RANDOM_STATE = 42
CSV_PATH = "D:/PROJECT/Career-Compass/ml_service/dataset/resume_data.csv"


def main():
    df = pd.read_csv(CSV_PATH)
    df.columns = [c.replace("\ufeff", "") for c in df.columns]

    # Same job-identity key your pipeline.py uses to dedupe jobs
    job_key = df["job_position_name"].astype(str) + "||" + df["experiencere_requirement"].astype(str)
    y = df["matched_score"].values

    n_unique_jobs = job_key.nunique()
    print(f"Total rows: {len(df)}")
    print(f"Unique jobs (by title + experience requirement): {n_unique_jobs}")
    print(f"Average rows per job: {len(df) / n_unique_jobs:.1f}")

    # Split the same way train.py does, so this is a fair comparison
    idx_train, idx_test = train_test_split(
        np.arange(len(df)), test_size=0.2, random_state=RANDOM_STATE
    )

    job_key_train = job_key.iloc[idx_train]
    job_key_test = job_key.iloc[idx_test]
    y_train = y[idx_train]
    y_test = y[idx_test]

    # Baseline: predict each job's mean matched_score from the TRAINING set.
    # For jobs unseen in training (shouldn't happen with only 28 jobs, but
    # just in case), fall back to the global training mean.
    job_means = pd.Series(y_train, index=job_key_train.values).groupby(level=0).mean()
    global_mean = y_train.mean()

    preds = job_key_test.map(job_means).fillna(global_mean).values

    baseline_r2 = r2_score(y_test, preds)
    baseline_mae = mean_absolute_error(y_test, preds)

    print(f"\n=== 'Predict this job's average score' baseline ===")
    print(f"  R2:  {baseline_r2:.4f}")
    print(f"  MAE: {baseline_mae:.4f}")
    print(f"\nCompare this to your trained models' R2 (~0.47-0.51).")
    print("If the baseline R2 is close to your model's R2, most of what your")
    print("model is 'learning' is just which job each row belongs to — not")
    print("genuine resume-specific matching quality. That's a data ceiling,")
    print("not something more hyperparameter tuning will fix.")


if __name__ == "__main__":
    main()