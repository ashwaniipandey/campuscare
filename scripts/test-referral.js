/**
 * Test referral and notification end-to-end flow.
 * Usage: node scripts/test-referral.js
 */

import mongoose from "mongoose";
import dbConnect from "../lib/mongodb.js";
import User from "../models/User.js";
import Referral from "../models/Referral.js";
import Notification from "../models/Notification.js";
import { createNotification } from "../lib/notify.js";

if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/campus-health";
}

async function runTest() {
  console.log("=== Testing Referral & Notification Flow ===");
  await dbConnect();

  // 1. Find Staff 1 and Staff 2
  const staff1 = await User.findOne({ email: "staff1@demo.edu" });
  const staff2 = await User.findOne({ email: "staff2@demo.edu" });
  const student = await User.findOne({ role: "student" });

  if (!staff1 || !staff2 || !student) {
    throw new Error(`Prerequisite users not found. staff1=${!!staff1}, staff2=${!!staff2}, student=${!!student}`);
  }

  console.log(`Staff 1 (Referring): ${staff1.name} (${staff1._id})`);
  console.log(`Staff 2 (Receiving): ${staff2.name} (${staff2._id})`);
  console.log(`Student (Patient):   ${student.name} (${student._id})`);

  const testReason = `Automated verification test ${Date.now()}`;

  // 2. Create test referral from staff1 to staff2
  const createdReferral = await Referral.create({
    patient: new mongoose.Types.ObjectId(student._id),
    fromDoctor: new mongoose.Types.ObjectId(staff1._id),
    toDoctor: new mongoose.Types.ObjectId(staff2._id),
    urgency: "urgent",
    reason: testReason,
    note: "Test handover notes for end-to-end verification",
    status: "pending",
    type: "single",
    isDemo: true,
  });

  console.log("\n1. Created Referral document:");
  console.log({
    _id: createdReferral._id.toString(),
    patient: createdReferral.patient.toString(),
    fromDoctor: createdReferral.fromDoctor.toString(),
    toDoctor: createdReferral.toDoctor.toString(),
    status: createdReferral.status,
    urgency: createdReferral.urgency,
  });

  // 3. Create notification for staff2 using createNotification helper
  const createdNotif = await createNotification(staff2._id, {
    type: "referral-request",
    title: `New Referral: ${student.name}`,
    message: `Dr. ${staff1.name} referred ${student.name} for ${testReason}.`,
    link: "/staff/referrals",
    isDemo: true,
  });

  console.log("\n2. Created Notification via helper:");
  console.log({
    _id: createdNotif?._id?.toString(),
    user: createdNotif?.user?.toString(),
    type: createdNotif?.type,
    title: createdNotif?.title,
  });

  // 4. Test exact query used in GET /api/referrals/incoming
  const incomingQuery = { toDoctor: new mongoose.Types.ObjectId(staff2._id) };
  const incomingResults = await Referral.find(incomingQuery)
    .populate("patient", "name regNo")
    .populate("fromDoctor", "name staffId")
    .populate("toDoctor", "name staffId")
    .sort({ createdAt: -1 })
    .lean();

  const foundReferral = incomingResults.find((r) => r._id.toString() === createdReferral._id.toString());
  console.log(`\n3. Incoming referrals for Staff 2 count: ${incomingResults.length}`);
  console.log(`   Found newly created referral in incoming query? ${Boolean(foundReferral)}`);
  if (foundReferral) {
    console.log(`   Referral Details: Patient=${foundReferral.patient?.name}, From=${foundReferral.fromDoctor?.name}, Status=${foundReferral.status}`);
  }

  // 5. Test exact query used in GET /api/notifications
  const notifQuery = { user: new mongoose.Types.ObjectId(staff2._id) };
  const notifResults = await Notification.find(notifQuery)
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();
  const unreadCount = await Notification.countDocuments({ user: new mongoose.Types.ObjectId(staff2._id), isRead: false });

  const foundNotif = notifResults.find((n) => n._id.toString() === createdNotif?._id?.toString());
  console.log(`\n4. Notifications for Staff 2 count: ${notifResults.length}, Unread count: ${unreadCount}`);
  console.log(`   Found newly created notification in query? ${Boolean(foundNotif)}`);
  if (foundNotif) {
    console.log(`   Notification Details: Title="${foundNotif.title}", Type=${foundNotif.type}, isRead=${foundNotif.isRead}`);
  }

  // 6. Cleanup test records
  console.log("\n5. Cleaning up test records...");
  await Referral.deleteOne({ _id: createdReferral._id });
  if (createdNotif?._id) {
    await Notification.deleteOne({ _id: createdNotif._id });
  }
  console.log("   Cleanup finished.");

  // Validation checks
  if (!foundReferral) {
    throw new Error("FAILED: Created referral was NOT found by the incoming query!");
  }
  if (!foundNotif) {
    throw new Error("FAILED: Created notification was NOT found by the notification query!");
  }

  console.log("\n✅ ALL TESTS PASSED: Referral was saved with ObjectId and returned by incoming query, and Notification was created and returned with unread count.");
}

runTest()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("\n❌ TEST ERROR:", err);
    try { await mongoose.disconnect(); } catch (_) {}
    process.exit(1);
  });
