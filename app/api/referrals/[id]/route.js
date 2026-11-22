import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Referral from "@/models/Referral";
import Appointment from "@/models/Appointment";
import User from "@/models/User";
import { createNotification } from "@/lib/notify";

// PATCH /api/referrals/[id] — accept, decline, or cancel
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid referral ID" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "staff") {
      return NextResponse.json({ error: "Staff credentials required" }, { status: 403 });
    }

    const { action, responseNote } = await req.json();
    if (!["accept", "decline", "cancel"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be accept, decline, or cancel." },
        { status: 400 }
      );
    }

    await dbConnect();

    const referral = await Referral.findById(id)
      .populate("patient", "name phone email regNo")
      .populate("fromDoctor", "name staffId medicalDepartment")
      .populate("toDoctor", "name staffId medicalDepartment");

    if (!referral) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 });
    }

    // Cancel action: only the referring doctor (fromDoctor) can cancel their pending referral
    if (action === "cancel") {
      if (referral.fromDoctor?._id?.toString() !== session.user.id.toString()) {
        return NextResponse.json(
          { error: "Only the referring clinician can cancel this referral." },
          { status: 403 }
        );
      }
      if (referral.status !== "pending") {
        return NextResponse.json(
          { error: `Cannot cancel referral that is already ${referral.status}.` },
          { status: 400 }
        );
      }

      referral.status = "cancelled";
      await referral.save();
      return NextResponse.json({ success: true, action: "cancel", referral }, { status: 200 });
    }

    // Accept / Decline action: only the receiving doctor (toDoctor)
    if (referral.toDoctor?._id?.toString() !== session.user.id.toString()) {
      return NextResponse.json(
        { error: "Only the designated receiving clinician can accept or decline this referral." },
        { status: 403 }
      );
    }

    if (referral.status !== "pending") {
      return NextResponse.json(
        { error: `This referral has already been ${referral.status}.` },
        { status: 400 }
      );
    }

    if (action === "accept") {
      referral.status = "accepted";
      referral.respondedAt = new Date();
      referral.responseNote = responseNote?.trim() || "";
      await referral.save();

      // If referral has an appointment, transfer it to receiving doctor
      if (referral.appointment) {
        const appt = await Appointment.findById(referral.appointment);
        if (appt) {
          appt.staff = referral.toDoctor._id;
          appt.department = referral.toDoctor.medicalDepartment || appt.department;
          appt.referredFrom = referral.fromDoctor._id;
          appt.referralId = referral._id;
          await appt.save();

          // Notify student
          await createNotification(referral.patient._id, {
            type: "appointment-transferred",
            title: "Appointment Transferred",
            message: `Your appointment on ${appt.date} at ${appt.startTime} was successfully transferred from Dr. ${referral.fromDoctor.name} to Dr. ${referral.toDoctor.name}.`,
            link: "/student/appointments",
          });
        }
      } else {
        // Without an existing appointment, prompt student to book
        await createNotification(referral.patient._id, {
          type: "referral-accepted",
          title: "Referral Consultation Accepted",
          message: `Dr. ${referral.toDoctor.name} (${referral.toDoctor.medicalDepartment || "Specialist"}) accepted your referral. Please book an appointment slot.`,
          link: "/student/book",
        });
      }

      // Notify referring doctor
      await createNotification(referral.fromDoctor._id, {
        type: "referral-accepted",
        title: "Referral Accepted",
        message: `Dr. ${referral.toDoctor.name} accepted your referral for ${referral.patient.name}.`,
        link: "/staff/referrals",
      });

      return NextResponse.json({ success: true, action: "accept", referral }, { status: 200 });
    }

    if (action === "decline") {
      referral.status = "declined";
      referral.respondedAt = new Date();
      referral.responseNote = responseNote?.trim() || "";
      await referral.save();

      // Notify referring doctor
      await createNotification(referral.fromDoctor._id, {
        type: "referral-declined",
        title: "Referral Declined",
        message: `Dr. ${referral.toDoctor.name} declined your referral for ${referral.patient.name}${
          responseNote ? `: "${responseNote.trim()}"` : ""
        }.`,
        link: "/staff/referrals",
      });

      // If emergency-leave referral, also notify the student
      if (referral.type === "emergency-leave") {
        await createNotification(referral.patient._id, {
          type: "appointment-update",
          title: "Doctor Transfer Update",
          message: `Dr. ${referral.toDoctor.name} was unable to accept your appointment transfer. Campus Health administration has been alerted to reschedule you.`,
          link: "/student/appointments",
        });
      }

      return NextResponse.json({ success: true, action: "decline", referral }, { status: 200 });
    }

    return NextResponse.json({ error: "Unhandled action" }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/referrals/[id] error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
