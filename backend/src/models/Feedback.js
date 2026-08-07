import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  email: { type: String, default: "" }, // optional – you can extend later
  subject: { type: String, default: "Feedback" }, // not used now but kept for flexibility
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Feedback", feedbackSchema);
