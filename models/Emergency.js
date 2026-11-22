import mongoose from "mongoose";

const EmergencySchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["medical", "mental-health", "injury", "other"],
    default: "medical",
  },
  description: {
    type: String,
    default: "",
    trim: true,
  },
  location: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    address: { type: String, default: "" },
    manualLocation: { type: String, default: "" },
  },
  status: {
    type: String,
    enum: ["new", "responded", "resolved"],
    default: "new",
  },
  needsAmbulance: {
    type: Boolean,
    default: false,
  },
  ambulanceStatus: {
    type: String,
    enum: ["none", "searching", "accepted", "picked-up", "completed"],
    default: "none",
  },
  assignedAmbulance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ambulance",
    default: null,
  },
  ambulanceAcceptedAt: { type: Date, default: null },
  pickedUpAt: { type: Date, default: null },
  ambulanceCompletedAt: { type: Date, default: null },
  dispatchStartedAt: { type: Date, default: null },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  respondedAt: { type: Date, default: null },
  resolvedAt: { type: Date, default: null },
  responseTimeSeconds: { type: Number, default: null },
  isDemo: {
    type: Boolean,
    default: false,
  },
  createdAt: { type: Date, default: Date.now },
});

const Emergency =
  mongoose.models.Emergency || mongoose.model("Emergency", EmergencySchema);

export default Emergency;
