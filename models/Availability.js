import mongoose from "mongoose";

const AvailabilitySchema = new mongoose.Schema({
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  startTime: {
    type: String, // HH:MM (e.g. "10:00")
    required: true,
  },
  endTime: {
    type: String, // HH:MM (e.g. "10:30")
    required: true,
  },
  isBooked: {
    type: Boolean,
    default: false,
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

// Prevent duplicate slot for the same staff at the exact same date & startTime
AvailabilitySchema.index({ staff: 1, date: 1, startTime: 1 }, { unique: true });

const Availability =
  mongoose.models.Availability ||
  mongoose.model("Availability", AvailabilitySchema);

export default Availability;
