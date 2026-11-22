import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment",
    default: null,
  },
  category: {
    type: String,
    enum: [
      "Blood Test",
      "Urine Test",
      "Typhoid Test",
      "Malaria and Dengue Test",
      "X-Ray",
      "Ultrasound",
      "Skin Report",
      "Prescription",
      "General Checkup",
      "Other",
    ],
    required: true,
  },
  title: {
    type: String,
    required: [true, "Report title is required"],
    trim: true,
  },
  summary: {
    type: String,
    default: "",
    trim: true,
  },
  condition: {
    type: String,
    enum: ["normal", "follow-up-needed", "critical"],
    default: "normal",
  },
  reportDate: {
    type: String,
    required: true,
  },
  file: {
    data: {
      type: Buffer,
      select: false,
    },
    contentType: {
      type: String,
    },
    filename: {
      type: String,
    },
    size: {
      type: Number,
    },
  },
  hasFile: {
    type: Boolean,
    default: false,
  },
  viewedByStudentAt: {
    type: Date,
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

const Report = mongoose.models.Report || mongoose.model("Report", ReportSchema);

export default Report;
