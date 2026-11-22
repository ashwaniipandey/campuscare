import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  role: {
    type: String,
    enum: ["student", "staff", "admin", "ambulance"],
    default: "student",
  },
  phone: {
    type: String,
    default: "",
    trim: true,
  },
  // Student-specific fields
  regNo: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    trim: true,
  },
  department: {
    type: String,
    enum: ["CSE", "ECE", "ME", "Civil", "MBA", "Other", ""],
    default: "",
    trim: true,
  },
  year: {
    type: Number,
    min: 1,
    max: 5,
  },
  gender: {
    type: String,
    default: "",
    trim: true,
  },
  bloodGroup: {
    type: String,
    default: "",
    trim: true,
  },
  emergencyContactName: {
    type: String,
    default: "",
    trim: true,
  },
  emergencyContactPhone: {
    type: String,
    default: "",
    trim: true,
  },
  // Staff-specific fields
  staffId: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    trim: true,
  },
  medicalDepartment: {
    type: String,
    enum: [
      "General Medicine",
      "Dermatology (Skin)",
      "Pathology Lab",
      "Radiology (X-Ray)",
      "Counseling",
      "Dental",
      "ENT",
      "Emergency",
      "Other",
      "",
    ],
    default: "",
    trim: true,
  },
  designation: {
    type: String,
    default: "",
    trim: true,
  },
  qualification: {
    type: String,
    default: "",
    trim: true,
  },
  dutyStatus: {
    type: String,
    enum: ["available", "busy", "off-duty"],
    default: "available",
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

// Prevent model overwrite in development
const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
