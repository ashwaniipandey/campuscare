import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Emergency from "@/models/Emergency";
import "@/models/Ambulance";
import { haversineDistance } from "@/lib/dispatch";

// GET /api/emergencies/mine — student: get their latest emergency
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "student")
      return NextResponse.json({ error: "Students only" }, { status: 403 });

    await dbConnect();

    const emergency = await Emergency.findOne({ student: session.user.id })
      .populate("respondedBy", "name")
      .populate("assignedAmbulance", "vehicleNumber driverName driverPhone location status")
      .sort({ createdAt: -1 })
      .lean();

    if (emergency?.assignedAmbulance) {
      const ambLat = emergency.assignedAmbulance.location?.latitude;
      const ambLon = emergency.assignedAmbulance.location?.longitude;
      const emgLat = emergency.location?.latitude;
      const emgLon = emergency.location?.longitude;
      const distanceKm = haversineDistance(ambLat, ambLon, emgLat, emgLon);
      emergency.assignedAmbulance.distanceKm = distanceKm;
    }

    return NextResponse.json({ emergency }, { status: 200 });
  } catch (error) {
    console.error("GET /api/emergencies/mine error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
