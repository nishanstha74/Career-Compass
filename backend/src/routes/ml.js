import express from "express";
import multer from "multer";
import { uploadResume, predictMatch } from "../lib/mlClient.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Multer config – keep file in memory, limit 5 MiB
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MiB
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "text/plain",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG."
        ),
        false
      );
    }
  },
});

/**
 * Helper to process file upload and trigger full ML analysis
 */
const handleResumeUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No resume file uploaded." });
    }

    // Multer populates req.body alongside req.file for multipart requests
    const targetRole = req.body.targetRole || req.body.target_role || "";

    const result = await uploadResume(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      targetRole
    );

    return res.json(result);
  } catch (err) {
    console.error("ML resume processing error:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
};

// POST /api/ml/predict & POST /api/ml/analyze
router.post("/predict", protectRoute, upload.single("file"), handleResumeUpload);
router.post("/analyze", protectRoute, upload.single("file"), handleResumeUpload);

/**
 * POST /api/ml/match – structured match request
 */
router.post("/match", protectRoute, async (req, res) => {
  try {
    const { resume_text, job_description, resume_skills, job_skills } = req.body;
    const result = await predictMatch({
      resume_text,
      job_description,
      resume_skills,
      job_skills,
    });
    return res.json(result);
  } catch (err) {
    console.error("ML match error:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
});

export default router;