import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Referral from "@/models/Referral";
import Appointment from "@/models/Appointment";
import Availability from "@/models/Availability";
import { createNotification } from "@/lib/notify";

function getDateStringsNext3Days() {
  const dates = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
}

// POST /api/referrals/emergency-leave — staff only
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "staff") {
      return NextResponse.json({ error: "Staff credentials required" }, { status: 403 });
    }

    const { toDoctorId, reason } = await req.json();

    if (!reason?.trim()) {
      return NextResponse.json({ error: "Emergency leave reason is required" }, { status: 400 });
    }

    if (!toDoctorId || !mongoose.Types.ObjectId.isValid(toDoctorId)) {
      return NextResponse.json({ error: "Target clinician must be selected" }, { status: 400 });
    }

    if (toDoctorId.toString() === session.user.id.toString()) {
      return NextResponse.json({ error: "Cannot transfer patients to yourself" }, { status: 400 });
    }

    await dbConnect();

    const toDoctor = await User.findOne({ _id: toDoctorId, role: "staff" });
    if (!toDoctor) {
      return NextResponse.json({ error: "Target doctor not found" }, { status: 404 });
    }

    const targetDates = getDateStringsNext3Days();

    // Find doctor's appointments with status pending or confirmed in the 3-day window
    const appointments = await Appointment.find({
      staff: session.user.id,
      status: { $in: ["pending", "confirmed"] },
      date: { $in: targetDates },
    }).populate("student", "name email");

    const batchId = `leave_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const createdReferrals = [];

    for (const appt of appointments) {
      const refDoc = await Referral.create({
        patient: appt.student?._id || appt.student,
        fromDoctor: session.user.id,
        toDoctor: toDoctor._id,
        appointment: appt._id,
        type: "emergency-leave",
        batchId,
        urgency: "urgent",
        reason: reason.trim(),
        note: `Emergency leave batch transfer (${appt.date} at ${appt.startTime})`,
        status: "pending",
      });
      createdReferrals.push(refDoc);

      // Notify affected student
      if (appt.student?._id || appt.student) {
        await createNotification(appt.student._id || appt.student, {
          type: "appointment-transferred",
          title: "Doctor On Emergency Leave",
          message: `Dr. ${session.user.name || "Your Doctor"} is on emergency leave. Your appointment on ${appt.date} at ${appt.startTime} is pending transfer to Dr. ${toDoctor.name}.`,
          link: "/student/appointments",
        });
      }
    }

    // Set logged in doctor's duty status to off-duty
    await User.findByIdAndUpdate(session.user.id, {
      $set: { dutyStatus: "off-duty" },
    });

    // Delete doctor's unbooked Availability slots for those 3 days
    await Availability.deleteMany({
      staff: session.user.id,
      date: { $in: targetDates },
      isBooked: false,
    });

    // Send ONE summarized notification to receiving doctor
    await createNotification(toDoctor._id, {
      type: "referral-request",
      title: "Emergency Leave Transfer Request",
      message: `Dr. ${session.user.name || "A Clinician"} has an emergency and requests you to take ${appointments.length} patients.`,
      link: "/staff/referrals",
    });

    return NextResponse.json(
      {
        success: true,
        count: appointments.length,
        batchId,
        dates: targetDates,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/referrals/emergency-leave error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
