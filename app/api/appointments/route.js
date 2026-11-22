import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import Availability from "@/models/Availability";
import "@/models/Referral";
import { createNotification } from "@/lib/notify";

// POST /api/appointments — student only: book a slot
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "student") {
      return NextResponse.json({ error: "Only students can book appointments" }, { status: 403 });
    }

    const { availabilityId, reason, type, department, service, doctorId } = await req.json();

    if (!availabilityId) {
      return NextResponse.json({ error: "Availability slot ID is required" }, { status: 400 });
    }

    await dbConnect();

    // Validate that the slot belongs to the chosen doctor if doctorId is provided
    if (doctorId) {
      const targetSlot = await Availability.findById(availabilityId);
      if (!targetSlot) {
        return NextResponse.json({ error: "Availability slot not found" }, { status: 404 });
      }
      if (targetSlot.staff.toString() !== doctorId.toString()) {
        return NextResponse.json(
          { error: "The chosen slot does not belong to the selected doctor." },
          { status: 400 }
        );
      }
    }

    // Find the slot and lock it atomically
    const slot = await Availability.findOneAndUpdate(
      {
        _id: availabilityId,
        isBooked: false,
        ...(doctorId ? { staff: doctorId } : {}),
      },
      { isBooked: true },
      { new: true }
    );

    if (!slot) {
      return NextResponse.json(
        { error: "This slot is no longer available. Please choose another." },
        { status: 409 }
      );
    }

    // Create the appointment
    const appointment = await Appointment.create({
      student: session.user.id,
      staff: slot.staff,
      availability: slot._id,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      reason: reason || "",
      type: type || "general",
      department: department || "",
      service: service || "",
      status: "pending",
    });

    const populated = await Appointment.findById(appointment._id)
      .populate("staff", "name email staffId medicalDepartment designation qualification")
      .populate("student", "name email phone regNo department year")
      .lean();

    // Notify doctor about new booking
    await createNotification(slot.staff, {
      type: "appointment-update",
      title: "New Appointment Booked",
      message: `${session.user.name || "A student"} booked an appointment on ${slot.date} at ${slot.startTime}.`,
      link: "/staff/appointments",
    });

    return NextResponse.json(
      { message: "Appointment booked successfully", appointment: populated },
      { status: 201 }
    );
  } catch (error) {
    // Handle unique constraint violation (double booking race condition)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "This slot was just booked by someone else. Please choose another." },
        { status: 409 }
      );
    }
    console.error("POST /api/appointments error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

// GET /api/appointments — students get their own; staff get ones assigned to them
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    let query = {};
    if (session.user.role === "student") {
      query = { student: session.user.id };
    } else if (session.user.role === "staff") {
      query = { staff: session.user.id };
    } else if (session.user.role === "admin") {
      query = {}; // admins see all
    }

    const appointments = await Appointment.find(query)
      .populate("student", "name email phone regNo department year")
      .populate("staff", "name email staffId medicalDepartment designation qualification")
      .populate("referredFrom", "name medicalDepartment")
      .populate("referralId", "status fromDoctor toDoctor")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ appointments }, { status: 200 });
  } catch (error) {
    console.error("GET /api/appointments error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
