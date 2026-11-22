import mongoose from "mongoose";

const ReferralSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Patient is required"],
  },
  fromDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Referring doctor is required"],
  },
  toDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Target doctor is required"],
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment",
    default: null,
  },
  emergency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Emergency",
    default: null,
  },
  type: {
    type: String,
    enum: ["single", "emergency-leave"],
    default: "single",
  },
  batchId: {
    type: String,
    default: "",
    trim: true,
  },
  urgency: {
    type: String,
    enum: ["routine", "urgent", "emergency"],
    default: "routine",
  },
  reason: {
    type: String,
    required: [true, "Referral reason is required"],
    trim: true,
  },
  note: {
    type: String,
    default: "",
    trim: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "declined", "cancelled"],
    default: "pending",
  },
  respondedAt: {
    type: Date,
    default: null,
  },
  responseNote: {
    type: String,
    default: "",
    trim: true,
  },
  isDemo: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Referral =
  mongoose.models.Referral || mongoose.model("Referral", ReferralSchema);

export default Referral;
