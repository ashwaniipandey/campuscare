import mongoose from "mongoose";

const AmbulanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  vehicleNumber: {
    type: String,
    required: [true, "Vehicle number is required"],
    unique: true,
    uppercase: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ["basic", "advanced"],
    default: "basic",
  },
  driverName: {
    type: String,
    required: [true, "Driver name is required"],
    trim: true,
  },
  driverPhone: {
    type: String,
    required: [true, "Driver phone number is required"],
    trim: true,
  },
  status: {
    type: String,
    enum: ["available", "busy", "offline"],
    default: "offline",
  },
  location: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    updatedAt: { type: Date, default: null },
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

const Ambulance =
  mongoose.models.Ambulance || mongoose.model("Ambulance", AmbulanceSchema);

export default Ambulance;
