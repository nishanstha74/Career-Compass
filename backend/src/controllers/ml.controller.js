import { uploadResume, predictMatch } from "../lib/mlClient.js";
/**
 * Predict / analyze uploaded resume file via ML service
 */
export const predictResume = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }
    const result = await uploadResume(req.file.buffer, req.file.originalname);
  } catch (err) {
    console.error("ML forward error:", err);
    res
      .status(500)
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
};
/**
 * Structured job match calculation via ML service
 */
export const matchJob = async (req, res) => {
  try {
    const { resume_text, job_description, resume_skills, job_skills } =
      req.body;
    if (!resume_text || !job_description) {
      return res
        .status(400)
        .json({
          success: false,
          message: "resume_text and job_description are required",
        });
    }
    const result = await predictMatch({
      resume_text,
      job_description,
      resume_skills,
      job_skills,
    });
    res.status(200).json(result);
  } catch (err) {
    console.error("ML match error:", err);
    res
      .status(500)
      .json({
        success: false,
        message: err.message || "Internal server error",
      });
  }
};
