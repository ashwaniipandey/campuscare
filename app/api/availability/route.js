import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Availability from "@/models/Availability";

// POST /api/availability — staff only: add a free slot
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "staff" && session.user.role !== "admin") {
      return NextResponse.json({ error: "Only health staff can add availability slots" }, { status: 403 });
    }

    const { date, startTime, endTime } = await req.json();

    if (!date || !startTime || !endTime) {
      return NextResponse.json({ error: "Date, start time, and end time are required" }, { status: 400 });
    }

    // Validate date is not in the past
    const today = new Date().toISOString().split("T")[0];
    if (date < today) {
      return NextResponse.json({ error: "Cannot add availability for a past date" }, { status: 400 });
    }

    // Validate startTime < endTime
    if (startTime >= endTime) {
      return NextResponse.json({ error: "Start time must be before end time" }, { status: 400 });
    }

    await dbConnect();

    // Check for duplicate slot (same staff, date, startTime)
    const existing = await Availability.findOne({
      staff: session.user.id,
      date,
      startTime,
    });

    if (existing) {
      return NextResponse.json(
        { error: "You already have a slot at this date and start time" },
        { status: 409 }
      );
    }

    const slot = await Availability.create({
      staff: session.user.id,
      date,
      startTime,
      endTime,
    });

    return NextResponse.json({ message: "Availability slot added", slot }, { status: 201 });
  } catch (error) {
    console.error("POST /api/availability error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

// GET /api/availability — all roles: upcoming unbooked slots, with staff name, optional ?date= filter
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const dateFilter = searchParams.get("date");
    const today = new Date().toISOString().split("T")[0];

    const query = {
      isBooked: false,
      date: dateFilter ? dateFilter : { $gte: today },
    };

    const slots = await Availability.find(query)
      .populate("staff", "name email staffId medicalDepartment designation qualification")
      .sort({ date: 1, startTime: 1 })
      .lean();

    return NextResponse.json({ slots }, { status: 200 });
  } catch (error) {
    console.error("GET /api/availability error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
