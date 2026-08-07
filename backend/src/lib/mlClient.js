// mlClient.js - communicates with the ML FastAPI service using the native fetch API (Node >=18)

/**
 * Normalizes FastAPI ML responses into the schema required by MainOverview.jsx
 */
function normalizeMLResponse(data, targetRole = "") {
  return {
    parsedResume: data.parsedResume || data.parsed_resume || {
      name: data.name || "Candidate Name",
      email: data.email || null,
      skills: data.skills || [],
      experience: data.experience || [],
      education: data.education || [],
    },
    ats_evaluation: data.ats_evaluation || data.ats || {
      ats_score: data.ats_score || data.score || 0,
      section_scores: data.section_scores || {},
      recommendations: data.recommendations || [],
      missing_keywords: data.missing_keywords || [],
    },
    skillGap: data.skillGap || data.skill_gap || {
      matched: data.matched_skills || [],
      missing: data.missing_skills || [],
    },
    skillHeatmap: data.skillHeatmap || data.skill_heatmap || data.category_breakdown || [],
    careerPredictions: data.careerPredictions || data.career_predictions || [
      { role: targetRole || "Target Role", confidence: data.confidence || 80, color: "bg-indigo-600" },
    ],
    roadmap: data.roadmap || data.learning_roadmap || [],
  };
}

/**
 * Upload a resume file and target role to the ML service and obtain the analysis result.
 * @param {Buffer|Uint8Array} fileBuffer - The binary content of the resume.
 * @param {string} filename - Original filename.
 * @param {string} mimeType - File MIME type (e.g. application/pdf).
 * @param {string} targetRole - User's target job role.
 * @returns {Promise<Object>} Normalized JSON response for the frontend.
 */
export async function uploadResume(fileBuffer, filename, mimeType = "application/pdf", targetRole = "") {
  const baseUrl = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
  const endpoint = `${baseUrl}/predict`;

  const formData = new FormData();
  const blob = new Blob([fileBuffer], { type: mimeType });
  
  formData.append("file", blob, filename);
  if (targetRole) {
    formData.append("target_role", targetRole);
  }

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ML service request failed (${response.status}): ${errText}`);
  }

  const rawData = await response.json();
  return normalizeMLResponse(rawData, targetRole);
}

/**
 * Send structured match request to the ML service.
 * @param {Object} payload - { resume_text, job_description, resume_skills, job_skills }
 * @returns {Promise<Object>} JSON response with match_score etc.
 */
export async function predictMatch(payload) {
  const baseUrl = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
  const endpoint = `${baseUrl}/predict/match`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ML match request failed (${response.status}): ${errText}`);
  }

  return response.json();
}