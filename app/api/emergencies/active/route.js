import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Emergency from "@/models/Emergency";
import "@/models/Ambulance";

// GET /api/emergencies/active — staff and admin only
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "staff" && session.user.role !== "admin")
      return NextResponse.json({ error: "Staff or admin only" }, { status: 403 });

    await dbConnect();

    const emergencies = await Emergency.find({ status: { $in: ["new", "responded"] } })
      .populate("student", "name email phone")
      .populate("respondedBy", "name")
      .populate("assignedAmbulance", "vehicleNumber driverName driverPhone location status")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ emergencies }, { status: 200 });
  } catch (error) {
    console.error("GET /api/emergencies/active error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
