/**
 * Seed or update the administrative account using credentials from .env.local
 * Usage: npm run seed:admin
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_NAME = process.env.ADMIN_NAME;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.toLowerCase().trim() : "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!MONGODB_URI) {
  console.error("❌ Error: Missing MONGODB_URI environment variable.");
  process.exit(1);
}

if (!ADMIN_EMAIL) {
  console.error("❌ Error: Missing ADMIN_EMAIL environment variable.");
  process.exit(1);
}

if (!ADMIN_PASSWORD) {
  console.error("❌ Error: Missing ADMIN_PASSWORD environment variable.");
  process.exit(1);
}

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

const UserSchema = new mongoose.Schema({
  name: { type: String, required: false },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, default: "student" },
  phone: { type: String, default: "" },
  isDemo: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function main() {
  console.log("Connecting to MongoDB...");
  console.log(`Database host: ${getDbHost(MONGODB_URI)}`);
  await mongoose.connect(MONGODB_URI);

  console.log(`Hashing admin credentials for ${ADMIN_EMAIL}...`);
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = await User.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: "admin",
      phone: "555-019-9000",
      isDemo: false,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`\n✅ Administrator Account Ready:`);
  console.log(`   ID:       ${admin._id}`);
  console.log(`   Name:     ${admin.name}`);
  console.log(`   Email:    ${admin.email}`);
  console.log(`   Role:     ${admin.role}`);
  console.log(`   Password: [Configured from ADMIN_PASSWORD]`);

  await mongoose.disconnect();
  console.log("\nDisconnected from MongoDB. Done.");
}

main().catch((err) => {
  console.error("❌ Error seeding admin user:", err);
  process.exit(1);
});
