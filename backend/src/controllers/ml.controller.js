import { processResumeAnalysis } from '../lib/mlClient.js';

export const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Resume file (PDF or Word document) is required.' });
    }

    const targetRole = req.body.targetRole || 'Software Engineer';

    const analysisResult = await processResumeAnalysis(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      targetRole
    );

    return res.status(200).json(analysisResult);
  } catch (error) {
    console.error('Error in analyzeResume controller:', error);
    return res.status(500).json({
      error: 'An error occurred while analyzing the resume.',
      details: error.message,
    });
  }
};