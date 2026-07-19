import express from "express";
import multer from "multer";
import { uploadResume, predictMatch } from "../lib/mlClient.js";
import { protectRoute } from "../middleware/auth.middleware.js"; // keep authentication if desired

const router = express.Router();

// Multer config – keep file in memory, limit 5 MiB, only PDF/DOC/DOCX
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MiB matches FastAPI limit
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "text/plain",
    ];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Only PDF/DOC/DOCX allowed"), false);
  },
});

// POST /api/ml/predict – DEPRECATED: forward the resume to the FastAPI service (fallback)
router.post(
  "/predict",
  protectRoute, // optional – keep JWT protection
  upload.single("file"), // field name must be **file**
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const result = await uploadResume(req.file.buffer, req.file.originalname);
      res.json(result);
    } catch (err) {
      console.error("ML forward error:", err);
      res.status(500).json({ message: err.message || "Internal server error" });
    }
  },
);

// POST /api/ml/match – structured match request (replaces deprecated file upload)
router.post(
  "/match",
  protectRoute,
  async (req, res) => {
    try {
      const { resume_text, job_description, resume_skills, job_skills } = req.body;
      const result = await predictMatch({ resume_text, job_description, resume_skills, job_skills });
      res.json(result);
    } catch (err) {
      console.error("ML match error:", err);
      res.status(500).json({ message: err.message || "Internal server error" });
    }
  }
);


export default router;
