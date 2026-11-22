import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import Availability from "@/models/Availability";
import mongoose from "mongoose";
import { createNotification } from "@/lib/notify";

// PATCH /api/appointments/[id]
// Student: cancel their own pending/confirmed appointment → slot freed
// Staff:   confirm, complete (with visitNotes), or cancel an appointment assigned to them
export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // params is a Promise in Next.js 15/16 — must be awaited
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: `Invalid appointment id: "${id}"` },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { status: newStatus, visitNotes } = body;

    if (!newStatus) {
      return NextResponse.json(
        { error: "New status is required in request body" },
        { status: 400 }
      );
    }

    await dbConnect();

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return NextResponse.json(
        { error: `Appointment "${id}" not found` },
        { status: 404 }
      );
    }

    const { role, id: userId } = session.user;

    // ─── STUDENT ────────────────────────────────────────────────────────────
    if (role === "student") {
      if (appointment.student.toString() !== userId.toString()) {
        return NextResponse.json(
          { error: "You can only cancel your own appointments" },
          { status: 403 }
        );
      }
      if (newStatus !== "cancelled") {
        return NextResponse.json(
          { error: "Students can only cancel appointments" },
          { status: 403 }
        );
      }
      if (["completed", "cancelled"].includes(appointment.status)) {
        return NextResponse.json(
          {
            error: `Cannot cancel an appointment that is already ${appointment.status}`,
          },
          { status: 400 }
        );
      }

      appointment.status = "cancelled";
      await appointment.save();

      await Availability.findByIdAndUpdate(appointment.availability, {
        isBooked: false,
      });

      // Notify doctor about student cancellation
      await createNotification(appointment.staff, {
        type: "appointment-update",
        title: "Appointment Cancelled by Student",
        message: `${session.user.name || "Student"} cancelled the appointment on ${appointment.date} at ${appointment.startTime}.`,
        link: "/staff/appointments",
      });

      return NextResponse.json(
        {
          message: "Appointment cancelled. Slot is now available again.",
          appointment,
        },
        { status: 200 }
      );
    }

    // ─── STAFF / ADMIN ───────────────────────────────────────────────────────
    if (role === "staff" || role === "admin") {
      if (
        role === "staff" &&
        appointment.staff.toString() !== userId.toString()
      ) {
        return NextResponse.json(
          {
            error: `Access denied — this appointment belongs to staff "${appointment.staff}", not "${userId}"`,
          },
          { status: 403 }
        );
      }

      const allowedStatuses = ["confirmed", "cancelled", "completed"];
      if (!allowedStatuses.includes(newStatus)) {
        return NextResponse.json(
          {
            error: `Staff can only set status to: ${allowedStatuses.join(", ")}`,
          },
          { status: 400 }
        );
      }

      appointment.status = newStatus;

      // Phase 4: save visit notes and timestamp when marking completed
      if (newStatus === "completed") {
        appointment.visitNotes = visitNotes?.trim() || "";
        appointment.completedAt = new Date();
      }

      await appointment.save();

      // Free slot if cancelled
      if (newStatus === "cancelled") {
        await Availability.findByIdAndUpdate(appointment.availability, {
          isBooked: false,
        });
      }

      // Notify student about staff status update
      await createNotification(appointment.student, {
        type: "appointment-update",
        title: `Appointment ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
        message: `Your appointment on ${appointment.date} at ${appointment.startTime} was marked ${newStatus} by Dr. ${session.user.name || "Staff"}.`,
        link: "/student/appointments",
      });

      return NextResponse.json(
        { message: `Appointment ${newStatus} successfully`, appointment },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error) {
    console.error("PATCH /api/appointments/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
