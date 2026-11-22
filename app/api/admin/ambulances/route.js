import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Ambulance from "@/models/Ambulance";
import User from "@/models/User";

// GET /api/admin/ambulances — list all ambulances
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Admin role required" }, { status: 403 });
    }

    await dbConnect();

    const ambulances = await Ambulance.find()
      .populate("user", "name email phone role")
      .sort({ vehicleNumber: 1 })
      .lean();

    return NextResponse.json({ ambulances }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/ambulances error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/ambulances — create new ambulance vehicle & driver login
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Admin role required" }, { status: 403 });
    }

    const body = await req.json();
    const { driverName, email, password, phone, vehicleNumber, type } = body;

    if (!driverName || !email || !password || !vehicleNumber) {
      return NextResponse.json(
        { error: "Driver name, email, password, and vehicle number are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const cleanPhone = phone ? String(phone).replace(/[\s\-]/g, "") : "";
    if (!cleanPhone || !/^\d{10}$/.test(cleanPhone)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit phone number" },
        { status: 400 }
      );
    }

    const cleanVehicle = String(vehicleNumber).toUpperCase().trim();
    const normalizedEmail = email.toLowerCase().trim();

    await dbConnect();

    // Check duplicate email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: "A user account with this email already exists" },
        { status: 409 }
      );
    }

    // Check duplicate vehicle number
    const existingVehicle = await Ambulance.findOne({ vehicleNumber: cleanVehicle });
    if (existingVehicle) {
      return NextResponse.json(
        { error: `Vehicle number ${cleanVehicle} is already registered` },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user account with role "ambulance"
    const user = await User.create({
      name: driverName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: cleanPhone,
      role: "ambulance",
    });

    // Create ambulance record
    const ambulance = await Ambulance.create({
      user: user._id,
      vehicleNumber: cleanVehicle,
      type: type === "advanced" ? "advanced" : "basic",
      driverName: driverName.trim(),
      driverPhone: cleanPhone,
      status: "offline",
    });

    const populated = await Ambulance.findById(ambulance._id)
      .populate("user", "name email phone role")
      .lean();

    return NextResponse.json({ ambulance: populated }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/ambulances error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
