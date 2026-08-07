"""
jooble_integration.py — Integration with Jooble REST API
-------------------------------------------------------
Fetches job postings matching a given title/keywords and combines their 
descriptions into a structured corpus for TF-IDF ATS evaluation.
"""

import os
import re
import requests
from typing import Optional


def _clean_html_text(raw_text: str) -> str:
    """Utility to strip HTML tags and normalize whitespace from Jooble snippets."""
    if not raw_text:
        return ""
    # Strip HTML tags
    clean_text = re.sub(r"<[^>]+>", " ", raw_text)
    # Collapse multiple spaces and line breaks
    return " ".join(clean_text.split())


def fetch_job_description_from_jooble(
    job_title: str, 
    location: str = "", 
    max_results: int = 3
) -> Optional[str]:
    """
    Queries Jooble API for job postings matching `job_title` and aggregates 
    their text snippets into a single job description string.

    :param job_title: Job title or keywords (e.g., "Software Engineer")
    :param location: Optional geographic location constraint
    :param max_results: Number of top job listings to aggregate for corpus building
    :return: Aggregated job description string or None if API fails/no jobs found
    """
    api_key = os.getenv("JOOBLE_API_KEY")
    if not api_key:
        print("Warning: JOOBLE_API_KEY environment variable is missing.")
        return None

    url = f"https://jooble.org/api/{api_key}"
    headers = {"Content-Type": "application/json"}
    
    payload = {
        "keywords": job_title,
        "location": location,
        "page": 1
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=5)
        
        if response.status_code != 200:
            print(f"Jooble API returned status code {response.status_code}")
            return None

        data = response.json()
        jobs = data.get("jobs", [])

        if not jobs:
            print(f"No job listings returned from Jooble for keywords: '{job_title}'")
            return None

        # Aggregate job title, snippet, and location details into a rich context string
        aggregated_descriptions = []
        for job in jobs[:max_results]:
            title = job.get("title", "")
            snippet = job.get("snippet", "")
            company = job.get("company", "")
            
            clean_snippet = _clean_html_text(snippet)
            if clean_snippet:
                aggregated_descriptions.append(
                    f"Job Title: {title}\nCompany: {company}\nRequirements & Description: {clean_snippet}"
                )

        if not aggregated_descriptions:
            return None

        return "\n\n".join(aggregated_descriptions)

    except requests.exceptions.Timeout:
        print("Error: Jooble API request timed out (5s limit).")
        return None
    except requests.exceptions.RequestException as e:
        print(f"Error connecting to Jooble API: {str(e)}")
        return None