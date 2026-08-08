// mlClient.js - communicates with the ML FastAPI service using the native fetch API (Node >=18)
// If using an older Node version, install a fetch polyfill such as 'node-fetch' and import it.

/**
 * Upload a resume file to the ML service and obtain the analysis result.
 * @param {Buffer|Uint8Array} fileBuffer - The binary content of the resume.
 * @param {string} filename - Original filename (used by the service for MIME detection).
 * @returns {Promise<Object>} The JSON response from the ML service.
 */
export async function uploadResume(fileBuffer, filename) {
  // Base URL can be overridden via environment variable
  const baseUrl = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
  const endpoint = `${baseUrl}/predict`;

  // Node's global fetch (v18+) supports the FormData API.
  const formData = new FormData();
  // Convert Buffer/Uint8Array to a Blob for FormData.
  const blob = new Blob([fileBuffer]);
  formData.append("file", blob, filename);

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(
      `ML service request failed (${response.status}): ${errText}`,
    );
  }

  return response.json();
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
