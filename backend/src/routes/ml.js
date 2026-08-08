import express from "express";
import multer from "multer";
import { predictResume, matchJob } from "../controllers/ml.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Multer config – keep file in memory, limit 5 MiB
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MiB matches FastAPI limit
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/webp",
      "text/plain",
    ];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Only PDF/DOC/DOCX/Images/TXT allowed"), false);
  },
});

// POST /api/ml/predict – Forward uploaded resume file to the FastAPI service
router.post("/predict", protectRoute, upload.single("file"), predictResume);

// POST /api/ml/match – Structured match request
router.post("/match", protectRoute, matchJob);

export default router;
