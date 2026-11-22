/**
 * Clear all demo records from the database.
 * Deletes users with isDemo: true (or @demo.edu), demo appointments, demo emergencies, demo availabilities, demo reports, and demo access logs.
 * Usage: npm run clear:demo
 */

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/campus-health";

const UserSchema = new mongoose.Schema({ email: String, isDemo: Boolean });
const User = mongoose.models.User || mongoose.model("User", UserSchema);

const AppointmentSchema = new mongoose.Schema({ isDemo: Boolean });
const Appointment = mongoose.models.Appointment || mongoose.model("Appointment", AppointmentSchema);

const EmergencySchema = new mongoose.Schema({ isDemo: Boolean });
const Emergency = mongoose.models.Emergency || mongoose.model("Emergency", EmergencySchema);

const AvailabilitySchema = new mongoose.Schema({ isDemo: Boolean });
const Availability = mongoose.models.Availability || mongoose.model("Availability", AvailabilitySchema);

const ReportSchema = new mongoose.Schema({ isDemo: Boolean });
const Report = mongoose.models.Report || mongoose.model("Report", ReportSchema);

const AccessLogSchema = new mongoose.Schema({ isDemo: Boolean });
const AccessLog = mongoose.models.AccessLog || mongoose.model("AccessLog", AccessLogSchema);

const ReviewSchema = new mongoose.Schema({ isDemo: Boolean });
const Review = mongoose.models.Review || mongoose.model("Review", ReviewSchema);

const AmbulanceSchema = new mongoose.Schema({ isDemo: Boolean });
const Ambulance = mongoose.models.Ambulance || mongoose.model("Ambulance", AmbulanceSchema);

const ReferralSchema = new mongoose.Schema({ isDemo: Boolean });
const Referral = mongoose.models.Referral || mongoose.model("Referral", ReferralSchema);

const NotificationSchema = new mongoose.Schema({ isDemo: Boolean });
const Notification = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);

function getDbHost(uri) {
  try {
    const parsed = new URL(uri);
    return parsed.host;
  } catch {
    const withoutScheme = uri.replace(/^mongodb(\+srv)?:\/\//, "");
    const withoutAuth = withoutScheme.replace(/^.*@/, "");
    return withoutAuth.split("/")[0].split("?")[0] || "configured-host";
  }
}

async function main() {
  console.log("Connecting to MongoDB...");
  console.log(`Database host: ${getDbHost(MONGODB_URI)}`);
  await mongoose.connect(MONGODB_URI);

  console.log("Removing demo referrals...");
  const referralResult = await Referral.deleteMany({ isDemo: true });

  console.log("Removing demo notifications...");
  const notifResult = await Notification.deleteMany({ isDemo: true });

  console.log("Removing demo reviews...");
  const reviewResult = await Review.deleteMany({ isDemo: true });

  console.log("Removing demo reports...");
  const reportResult = await Report.deleteMany({ isDemo: true });

  console.log("Removing demo access logs...");
  const logResult = await AccessLog.deleteMany({ isDemo: true });

  console.log("Removing demo appointments...");
  const apptResult = await Appointment.deleteMany({ isDemo: true });

  console.log("Removing demo emergencies...");
  const emgResult = await Emergency.deleteMany({ isDemo: true });

  console.log("Removing demo availabilities...");
  const availResult = await Availability.deleteMany({ isDemo: true });

  console.log("Removing demo ambulances...");
  const ambResult = await Ambulance.deleteMany({ isDemo: true });

  console.log("Removing demo users...");
  const userResult = await User.deleteMany({
    $or: [{ isDemo: true }, { email: { $regex: "@demo\\.edu$", $options: "i" } }],
  });

  console.log(`\n🧹 Demo Data Cleanup Summary:`);
  console.log(`   - Referrals removed:      ${referralResult.deletedCount}`);
  console.log(`   - Notifications removed:  ${notifResult.deletedCount}`);
  console.log(`   - Reviews removed:        ${reviewResult.deletedCount}`);
  console.log(`   - Reports removed:        ${reportResult.deletedCount}`);
  console.log(`   - Access logs removed:    ${logResult.deletedCount}`);
  console.log(`   - Appointments removed:   ${apptResult.deletedCount}`);
  console.log(`   - Emergencies removed:    ${emgResult.deletedCount}`);
  console.log(`   - Availabilities removed: ${availResult.deletedCount}`);
  console.log(`   - Ambulances removed:     ${ambResult.deletedCount}`);
  console.log(`   - Demo users removed:     ${userResult.deletedCount}`);

  await mongoose.disconnect();
  console.log("\nDisconnected from MongoDB. Cleanup complete.");
}

main().catch((err) => {
  console.error("❌ Error clearing demo data:", err);
  process.exit(1);
});
