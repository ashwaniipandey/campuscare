import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User is required"],
  },
  type: {
    type: String,
    enum: [
      "referral-request",
      "referral-accepted",
      "referral-declined",
      "appointment-update",
      "appointment-transferred",
      "report-ready",
      "ambulance-update",
      "general",
    ],
    required: [true, "Notification type is required"],
  },
  title: {
    type: String,
    required: [true, "Notification title is required"],
    trim: true,
  },
  message: {
    type: String,
    required: [true, "Notification message is required"],
    trim: true,
  },
  link: {
    type: String,
    default: "",
    trim: true,
  },
  isRead: {
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

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);

export default Notification;
