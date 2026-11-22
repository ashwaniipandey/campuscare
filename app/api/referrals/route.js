export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Referral from "@/models/Referral";
import Appointment from "@/models/Appointment";
import Emergency from "@/models/Emergency";
import { createNotification } from "@/lib/notify";

// POST /api/referrals — staff only creates a referral
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "staff") {
      return NextResponse.json({ error: "Staff credentials required" }, { status: 403 });
    }

    const body = await req.json();
    const { patientId, regNo, toDoctorId, urgency, reason, note, appointmentId, emergencyId } = body;

    if (!reason?.trim()) {
      return NextResponse.json({ error: "Referral reason is required" }, { status: 400 });
    }

    if (!toDoctorId || !mongoose.Types.ObjectId.isValid(toDoctorId)) {
      return NextResponse.json({ error: "A valid target doctor must be selected" }, { status: 400 });
    }

    if (toDoctorId.toString() === session.user.id.toString()) {
      return NextResponse.json(
        { error: "Cannot refer a patient to yourself. Please select another clinician." },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify target doctor
    const toDoctor = await User.findOne({ _id: toDoctorId, role: "staff" });
    if (!toDoctor) {
      return NextResponse.json({ error: "Target clinician not found" }, { status: 404 });
    }

    // Resolve patient
    let patient = null;
    if (patientId && mongoose.Types.ObjectId.isValid(patientId)) {
      patient = await User.findById(patientId);
    } else if (regNo) {
      patient = await User.findOne({
        regNo: { $regex: new RegExp(`^${regNo.trim()}$`, "i") },
        role: "student",
      });
    }

    if (!patient) {
      return NextResponse.json({ error: "Student patient not found" }, { status: 404 });
    }

    const validUrgency = ["routine", "urgent", "emergency"].includes(urgency) ? urgency : "routine";

    const referral = await Referral.create({
      patient: new mongoose.Types.ObjectId(patient._id),
      fromDoctor: new mongoose.Types.ObjectId(session.user.id),
      toDoctor: new mongoose.Types.ObjectId(toDoctor._id),
      appointment: appointmentId && mongoose.Types.ObjectId.isValid(appointmentId) ? new mongoose.Types.ObjectId(appointmentId) : null,
      emergency: emergencyId && mongoose.Types.ObjectId.isValid(emergencyId) ? new mongoose.Types.ObjectId(emergencyId) : null,
      type: "single",
      urgency: validUrgency,
      reason: reason.trim(),
      note: note?.trim() || "",
      status: "pending",
    });

    console.log("POST /api/referrals created and verified document:", {
      id: referral._id.toString(),
      patient: referral.patient.toString(),
      fromDoctor: referral.fromDoctor.toString(),
      toDoctor: referral.toDoctor.toString(),
      status: referral.status,
      urgency: referral.urgency,
      reason: referral.reason,
    });

    const populated = await Referral.findById(referral._id)
      .populate("patient", "name regNo phone email")
      .populate("fromDoctor", "name staffId medicalDepartment")
      .populate("toDoctor", "name staffId medicalDepartment")
      .populate("appointment", "date startTime service")
      .lean();

    // Notify target doctor
    await createNotification(toDoctor._id, {
      type: "referral-request",
      title: `New Referral: ${patient.name}`,
      message: `Dr. ${session.user.name || "Clinician"} referred ${patient.name} (${validUrgency}) for ${reason.trim()}.`,
      link: "/staff/referrals",
    });

    // Notify student
    await createNotification(patient._id, {
      type: "general",
      title: "Doctor Referral Created",
      message: `Dr. ${session.user.name || "Clinician"} referred your care to Dr. ${toDoctor.name} (${toDoctor.medicalDepartment || "Specialist"}).`,
      link: "/student/appointments",
    });

    return NextResponse.json({ referral: populated }, { status: 201 });
  } catch (error) {
    console.error("POST /api/referrals error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
