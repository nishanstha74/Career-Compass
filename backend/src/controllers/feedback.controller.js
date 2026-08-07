import Feedback from "../models/Feedback.js";


export const submitFeedback = async (req, res) => {
  try {
    const { name = "", email = "", subject = "Feedback", message } = req.body;
    if (!message || typeof message !== "string" || message.trim().length < 5) {
      return res.status(400).json({ success: false, message: "Message must be at least 5 characters." });
    }

    const feedback = new Feedback({ name, email, subject, message: message.trim() });
    await feedback.save();



    return res.status(201).json({ success: true, message: "Feedback submitted successfully." });
  } catch (err) {
    console.error("Feedback submission error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
