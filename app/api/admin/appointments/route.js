import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Appointment from "@/models/Appointment";

// GET /api/admin/appointments — admin only (supports ?status= and ?date=)
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Admin role required" }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const date = searchParams.get("date");

    const query = {};

    if (status && ["pending", "confirmed", "completed", "cancelled"].includes(status.toLowerCase())) {
      query.status = status.toLowerCase();
    }

    if (date && date.trim()) {
      query.date = date.trim();
    }

    const appointments = await Appointment.find(query)
      .populate("student", "name email phone")
      .populate("staff", "name email")
      .sort({ date: -1, startTime: -1 })
      .lean();

    return NextResponse.json({ appointments }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/appointments error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
