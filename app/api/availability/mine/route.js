import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Availability from "@/models/Availability";

// GET /api/availability/mine — staff only: return all of this staff's own slots
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "staff" && session.user.role !== "admin") {
      return NextResponse.json({ error: "Only health staff can view their availability" }, { status: 403 });
    }

    await dbConnect();

    const slots = await Availability.find({ staff: session.user.id })
      .sort({ date: 1, startTime: 1 })
      .lean();

    return NextResponse.json({ slots }, { status: 200 });
  } catch (error) {
    console.error("GET /api/availability/mine error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
