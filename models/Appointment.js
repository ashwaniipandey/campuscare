import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  availability: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Availability",
    required: true,
    unique: true, // one booking per slot
  },
  date: {
    type: String,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    default: "",
    trim: true,
  },
  department: {
    type: String,
    default: "",
    trim: true,
  },
  service: {
    type: String,
    default: "",
    trim: true,
  },
  type: {
    type: String,
    enum: ["general", "counseling", "emergency-followup"],
    default: "general",
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled", "completed"],
    default: "pending",
  },
  visitNotes: {
    type: String,
    default: "",
    trim: true,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  referredFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  referralId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Referral",
    default: null,
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

const Appointment =
  mongoose.models.Appointment ||
  mongoose.model("Appointment", AppointmentSchema);

export default Appointment;
