import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Referral from "@/models/Referral";
import Appointment from "@/models/Appointment";
import User from "@/models/User";
import { createNotification } from "@/lib/notify";

// POST /api/referrals/batch/[batchId]/respond — receiving doctor accepts or declines all pending in a batch
export async function POST(req, { params }) {
  try {
    const { batchId } = await params;
    if (!batchId) {
      return NextResponse.json({ error: "Batch ID required" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "staff") {
      return NextResponse.json({ error: "Staff credentials required" }, { status: 403 });
    }

    const { action, responseNote } = await req.json();
    if (!["accept", "decline"].includes(action)) {
      return NextResponse.json({ error: "Action must be accept or decline" }, { status: 400 });
    }

    await dbConnect();

    const pendingBatch = await Referral.find({
      batchId,
      toDoctor: session.user.id,
      status: "pending",
    })
      .populate("patient", "name")
      .populate("fromDoctor", "name")
      .populate("toDoctor", "name medicalDepartment");

    if (pendingBatch.length === 0) {
      return NextResponse.json(
        { error: "No pending referrals found for this batch" },
        { status: 404 }
      );
    }

    const now = new Date();
    let updatedCount = 0;

    for (const ref of pendingBatch) {
      if (action === "accept") {
        ref.status = "accepted";
        ref.respondedAt = now;
        ref.responseNote = responseNote?.trim() || "";
        await ref.save();

        if (ref.appointment) {
          const appt = await Appointment.findById(ref.appointment);
          if (appt) {
            appt.staff = ref.toDoctor._id;
            appt.department = ref.toDoctor.medicalDepartment || appt.department;
            appt.referredFrom = ref.fromDoctor._id;
            appt.referralId = ref._id;
            await appt.save();

            await createNotification(ref.patient._id, {
              type: "appointment-transferred",
              title: "Appointment Transferred",
              message: `Your appointment on ${appt.date} at ${appt.startTime} was transferred to Dr. ${ref.toDoctor.name}.`,
              link: "/student/appointments",
            });
          }
        }
      } else if (action === "decline") {
        ref.status = "declined";
        ref.respondedAt = now;
        ref.responseNote = responseNote?.trim() || "";
        await ref.save();

        if (ref.type === "emergency-leave") {
          await createNotification(ref.patient._id, {
            type: "appointment-update",
            title: "Doctor Transfer Update",
            message: `Dr. ${ref.toDoctor.name} was unable to accept your appointment transfer.`,
            link: "/student/appointments",
          });
        }
      }
      updatedCount++;
    }

    // Send single summary notification to referring doctor
    const referringDoctorId = pendingBatch[0]?.fromDoctor?._id;
    if (referringDoctorId) {
      await createNotification(referringDoctorId, {
        type: action === "accept" ? "referral-accepted" : "referral-declined",
        title: `Batch Transfer ${action === "accept" ? "Accepted" : "Declined"}`,
        message: `Dr. ${session.user.name || "Clinician"} ${action}ed all ${updatedCount} referrals in batch ${batchId}.`,
        link: "/staff/referrals",
      });
    }

    return NextResponse.json(
      { success: true, count: updatedCount, action, batchId },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/referrals/batch/[batchId]/respond error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
