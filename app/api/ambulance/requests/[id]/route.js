import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Ambulance from "@/models/Ambulance";
import Emergency from "@/models/Emergency";
import User from "@/models/User";
import { createNotification } from "@/lib/notify";

// PATCH /api/ambulance/requests/[id] — update pickup progress ('picked-up' or 'completed')
export async function PATCH(req, { params }) {
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

    const { action } = await req.json();
    if (!["picked-up", "completed"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'picked-up' or 'completed'." },
        { status: 400 }
      );
    }

    await dbConnect();

    const ambulance = await Ambulance.findOne({ user: session.user.id });
    if (!ambulance) {
      return NextResponse.json({ error: "Ambulance record not found" }, { status: 404 });
    }

    const emergency = await Emergency.findOne({
      _id: id,
      assignedAmbulance: ambulance._id,
    }).populate("student", "name phone email regNo department");

    if (!emergency) {
      return NextResponse.json(
        { error: "Emergency pickup not found or not assigned to your ambulance." },
        { status: 404 }
      );
    }

    if (action === "picked-up") {
      emergency.ambulanceStatus = "picked-up";
      emergency.pickedUpAt = new Date();
      await emergency.save();

      // Notify student
      if (emergency.student?._id || emergency.student) {
        await createNotification(emergency.student._id || emergency.student, {
          type: "ambulance-update",
          title: "Ambulance Picked Up",
          message: `Ambulance ${ambulance.vehicleNumber} has picked you up and is en route to the campus medical clinic.`,
          link: "/student/dashboard",
        });
      }
    } else if (action === "completed") {
      emergency.ambulanceStatus = "completed";
      emergency.ambulanceCompletedAt = new Date();
      await emergency.save();

      // Ambulance goes back to available
      ambulance.status = "available";
      await ambulance.save();

      // Notify student
      if (emergency.student?._id || emergency.student) {
        await createNotification(emergency.student._id || emergency.student, {
          type: "ambulance-update",
          title: "Ambulance Transfer Completed",
          message: `Ambulance transfer completed at campus medical center. Handover done.`,
          link: "/student/dashboard",
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        action,
        emergency,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/ambulance/requests/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
