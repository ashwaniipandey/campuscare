import dbConnect from "./mongodb.js";
import Notification from "../models/Notification.js";
import mongoose from "mongoose";

const VALID_NOTIFICATION_TYPES = [
  "referral-request",
  "referral-accepted",
  "referral-declined",
  "appointment-update",
  "appointment-transferred",
  "report-ready",
  "ambulance-update",
  "general",
];

/**
 * Creates an in-app notification safely.
 * @param {string|mongoose.Types.ObjectId} userId - Target recipient User ID
 * @param {Object} options - Notification parameters
 * @param {string} options.type - One of valid enum notification types
 * @param {string} options.title - Short header
 * @param {string} options.message - Notification body
 * @param {string} [options.link=""] - URL to navigate on click
 * @param {boolean} [options.isDemo=false] - Demo flag
 */
export async function createNotification(userId, { type, title, message, link = "", isDemo = false }) {
  if (!userId) {
    console.error("createNotification missing recipient userId:", { title, message, type });
    return null;
  }
  if (!title?.trim() || !message?.trim()) {
    console.error("createNotification missing title or message for user:", userId);
    return null;
  }

  try {
    await dbConnect();

    // Ensure valid ObjectId for recipient
    let recipientObjectId = null;
    if (userId instanceof mongoose.Types.ObjectId) {
      recipientObjectId = userId;
    } else if (typeof userId === "string" && mongoose.Types.ObjectId.isValid(userId)) {
      recipientObjectId = new mongoose.Types.ObjectId(userId);
    } else if (userId?._id && mongoose.Types.ObjectId.isValid(userId._id)) {
      recipientObjectId = new mongoose.Types.ObjectId(userId._id);
    }

    if (!recipientObjectId) {
      console.error("createNotification failed: Invalid ObjectId for userId:", userId);
      return null;
    }

    const resolvedType = VALID_NOTIFICATION_TYPES.includes(type) ? type : "general";

    const doc = await Notification.create({
      user: recipientObjectId,
      type: resolvedType,
      title: title.trim(),
      message: message.trim(),
      link: link ? link.trim() : "",
      isRead: false,
      isDemo: Boolean(isDemo),
      createdAt: new Date(),
    });

    console.log("createNotification created notification:", {
      id: doc._id.toString(),
      user: doc.user.toString(),
      type: doc.type,
      title: doc.title,
    });

    return doc;
  } catch (err) {
    console.error("createNotification execution error:", err);
    return null;
  }
}
