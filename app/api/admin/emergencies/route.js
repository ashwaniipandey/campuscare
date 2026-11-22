import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Emergency from "@/models/Emergency";
import "@/models/Ambulance";

// GET /api/admin/emergencies — admin only
// Returns all emergencies populated with student, responder, ambulance and response time
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Admin role required" }, { status: 403 });
    }

    await dbConnect();

    const emergencies = await Emergency.find()
      .populate("student", "name email phone")
      .populate("respondedBy", "name email")
      .populate("assignedAmbulance", "vehicleNumber driverName driverPhone status location")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ emergencies }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/emergencies error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
