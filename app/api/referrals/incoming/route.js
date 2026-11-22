export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Referral from "@/models/Referral";
import Appointment from "@/models/Appointment";
import "@/models/User";
import "@/models/Emergency";

// GET /api/referrals/incoming — staff only
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "staff") {
      return NextResponse.json({ error: "Staff credentials required" }, { status: 403 });
    }

    await dbConnect();

    const doctorId = new mongoose.Types.ObjectId(session.user.id);

    const referrals = await Referral.find({ toDoctor: doctorId })
      .populate("patient", "name regNo phone email bloodGroup department year")
      .populate("fromDoctor", "name staffId medicalDepartment phone email designation")
      .populate("toDoctor", "name staffId medicalDepartment phone email designation")
      .populate("appointment", "date startTime endTime service status type reason")
      .populate("emergency", "type description status")
      .sort({ createdAt: -1 })
      .lean();

    // Check conflict flag for incoming referrals with appointments (safe checks)
    const decorated = await Promise.all(
      referrals.map(async (ref) => {
        let conflict = false;
        if (ref?.appointment?.date && ref?.appointment?.startTime && ref.status === "pending") {
          try {
            const conflictingAppt = await Appointment.findOne({
              staff: doctorId,
              date: ref.appointment.date,
              startTime: ref.appointment.startTime,
              status: { $in: ["pending", "confirmed", "completed"] },
              _id: { $ne: ref.appointment._id },
            }).lean();
            if (conflictingAppt) conflict = true;
          } catch (chkErr) {
            console.error("Conflict check query error:", chkErr);
          }
        }
        return { ...ref, conflict };
      })
    );

    const res = NextResponse.json({ referrals: decorated }, { status: 200 });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.headers.set("Pragma", "no-cache");
    return res;
  } catch (error) {
    console.error("GET /api/referrals/incoming error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
