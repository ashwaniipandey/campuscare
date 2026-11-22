import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Ambulance from "@/models/Ambulance";
import Emergency from "@/models/Emergency";
import User from "@/models/User";
import { createNotification } from "@/lib/notify";

// POST /api/ambulance/requests/[id]/accept — atomic claim of searching emergency
export async function POST(req, { params }) {
  try {
    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid emergency ID" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ambulance") {
      return NextResponse.json({ error: "Ambulance driver only" }, { status: 403 });
    }

    await dbConnect();

    const ambulance = await Ambulance.findOne({ user: session.user.id });
    if (!ambulance) {
      return NextResponse.json({ error: "Ambulance record not found" }, { status: 404 });
    }

    if (ambulance.status !== "available") {
      return NextResponse.json(
        { error: "Your ambulance must be Available to accept a pickup." },
        { status: 400 }
      );
    }

    // Atomic claim: only succeeds if assignedAmbulance is null and status is 'searching'
    const emergency = await Emergency.findOneAndUpdate(
      {
        _id: id,
        assignedAmbulance: null,
        ambulanceStatus: "searching",
      },
      {
        $set: {
          assignedAmbulance: ambulance._id,
          ambulanceStatus: "accepted",
          ambulanceAcceptedAt: new Date(),
        },
      },
      { new: true }
    ).populate("student", "name phone email regNo department");

    if (!emergency) {
      return NextResponse.json(
        { error: "This pickup was already taken by another ambulance" },
        { status: 409 }
      );
    }

    // Update ambulance status to busy
    ambulance.status = "busy";
    await ambulance.save();

    // Notify student about ambulance acceptance
    if (emergency.student?._id || emergency.student) {
      await createNotification(emergency.student._id || emergency.student, {
        type: "ambulance-update",
        title: "Ambulance Dispatched",
        message: `Ambulance ${ambulance.vehicleNumber} (Driver: ${ambulance.driverName}) has accepted your emergency request and is en route.`,
        link: "/student/dashboard",
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Emergency pickup claimed successfully",
        emergency,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/ambulance/requests/[id]/accept error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
