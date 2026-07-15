"""
pipeline.py — Resume -> job match pipeline (orchestrator)
-----------------------------------------------------------
  1. pdf_extract.extract_resume_text    (file -> raw text)
  2. categorize.categorize_resume        (raw text -> structured JSON)
  3. matching.match_resume_to_jobs       (structured JSON -> TF-IDF shortlist, cheap pre-filter)
  4. predict.rank_jobs_from_categorized  (shortlist -> final ranked scores, trained ML ensemble)

UNVERIFIED ASSUMPTIONS (flag if wrong):
  - predict.py exposes: rank_jobs_from_categorized(categorized_resume: dict,
    jobs_csv: str, top_k: int) -> list[dict] | pandas.DataFrame. I've only
    ever seen predict.py's docstring header, not its full source in this
    conversation.
  - matching.py's job records are derived from the SAME --jobs CSV
    predict.py uses (see _jobs_csv_to_job_dicts below), keyed by
    job_position_name. Confirm this is right, or tell me the real source
    for matching.py's job list.
"""
import json
import os
from pathlib import Path

import pandas as pd

from pdf_extract import extract_resume_text
from NLP.categorize import categorize_resume
from ML_train.predict import rank_jobs_from_categorized  # ASSUMED signature

# pdf_extract.py's own __main__ block does `from pipeline import RESUME_PATH`
# when run standalone — kept here for that compatibility only.
RESUME_PATH = "mock/CV1.pdf"

TOP_K = 5



def run_pipeline(resume_path: str, top_k: int = 5):
    resume_path = Path(resume_path)

    print(f"Extracting text from {resume_path}...")

    raw_text, method, report = extract_resume_text(str(resume_path))

    if not raw_text:
        raise RuntimeError(f"Could not extract text from {resume_path}")

    print(f"Extraction method : {method}")
    print(f"Quality           : {report}")

    print("\nCategorizing resume...")

    categorized = categorize_resume(raw_text)

    print(f"Categorization method : {categorized['_meta']['method']}")

    print("\nPredicting top matching jobs...")

    final_ranked = rank_jobs_from_categorized(
        categorized,
        top_n=top_k
    )

    return {
        "extraction_method": method,
        "categorization_method": categorized["_meta"]["method"],
        "final_ranked_jobs": final_ranked
    }


def main():

    result = run_pipeline(
        RESUME_PATH,
        top_k=TOP_K
    )

    print("\n========== TOP JOB MATCHES ==========\n")

    print(json.dumps(result["final_ranked_jobs"], indent=4))


if __name__ == "__main__":
    main()