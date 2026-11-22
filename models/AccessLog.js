import mongoose from "mongoose";

const AccessLogSchema = new mongoose.Schema({
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  action: {
    type: String,
    enum: ["lookup", "view-report", "download-report", "upload-report"],
    required: true,
  },
  report: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Report",
    default: null,
  },
  isDemo: {
    type: Boolean,
    default: false,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const AccessLog =
  mongoose.models.AccessLog || mongoose.model("AccessLog", AccessLogSchema);

export default AccessLog;
