import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Ambulance from "@/models/Ambulance";
import User from "@/models/User";

// PATCH /api/admin/ambulances/[id] — update ambulance details
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ambulance ID" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Admin role required" }, { status: 403 });
    }

    const body = await req.json();
    const { vehicleNumber, type, driverName, driverPhone, status, password } = body;

    await dbConnect();

    const ambulance = await Ambulance.findById(id);
    if (!ambulance) {
      return NextResponse.json({ error: "Ambulance not found" }, { status: 404 });
    }

    if (vehicleNumber) {
      const cleanVehicle = String(vehicleNumber).toUpperCase().trim();
      const duplicate = await Ambulance.findOne({
        vehicleNumber: cleanVehicle,
        _id: { $ne: id },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: `Vehicle number ${cleanVehicle} is already in use.` },
          { status: 409 }
        );
      }
      ambulance.vehicleNumber = cleanVehicle;
    }

    if (type && ["basic", "advanced"].includes(type)) {
      ambulance.type = type;
    }

    if (status && ["available", "busy", "offline"].includes(status)) {
      ambulance.status = status;
    }

    if (driverName) {
      ambulance.driverName = driverName.trim();
    }

    if (driverPhone) {
      const cleanPhone = String(driverPhone).replace(/[\s\-]/g, "");
      if (/^\d{10}$/.test(cleanPhone)) {
        ambulance.driverPhone = cleanPhone;
      }
    }

    await ambulance.save();

    // Also sync User record if driverName, driverPhone or password changed
    const userUpdates = {};
    if (driverName) userUpdates.name = driverName.trim();
    if (driverPhone) userUpdates.phone = String(driverPhone).replace(/[\s\-]/g, "");
    if (password && password.length >= 6) {
      userUpdates.password = await bcrypt.hash(password, 10);
    }

    if (Object.keys(userUpdates).length > 0 && ambulance.user) {
      await User.findByIdAndUpdate(ambulance.user, { $set: userUpdates });
    }

    const updated = await Ambulance.findById(id)
      .populate("user", "name email phone role")
      .lean();

    return NextResponse.json({ ambulance: updated }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/admin/ambulances/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/ambulances/[id] — remove ambulance & associated driver user
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ambulance ID" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Admin role required" }, { status: 403 });
    }

    await dbConnect();

    const ambulance = await Ambulance.findById(id);
    if (!ambulance) {
      return NextResponse.json({ error: "Ambulance not found" }, { status: 404 });
    }

    // Delete associated User
    if (ambulance.user) {
      await User.findByIdAndDelete(ambulance.user);
    }

    await Ambulance.findByIdAndDelete(id);

    return NextResponse.json(
      { success: true, message: "Ambulance deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/admin/ambulances/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
