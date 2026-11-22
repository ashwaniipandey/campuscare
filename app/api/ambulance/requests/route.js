import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Ambulance from "@/models/Ambulance";
import Emergency from "@/models/Emergency";
import User from "@/models/User";
import { isAmbulanceEligible, haversineDistance, getDispatchRadiusKm } from "@/lib/dispatch";

// GET /api/ambulance/requests — ambulance driver only
// Returns:
// a) "open": searching emergencies eligible for this ambulance
// b) "taken": emergencies from last 3 min this ambulance was eligible for / searching, but taken by another ambulance
// c) "mine": active emergency currently assigned to this ambulance
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ambulance") {
      return NextResponse.json({ error: "Ambulance driver only" }, { status: 403 });
    }

    await dbConnect();

    const ambulance = await Ambulance.findOne({ user: session.user.id }).lean();
    if (!ambulance) {
      return NextResponse.json({ error: "Ambulance record not found" }, { status: 404 });
    }

    // 1. "mine": active emergency assigned to this ambulance
    const rawMine = await Emergency.findOne({
      assignedAmbulance: ambulance._id,
      ambulanceStatus: { $in: ["accepted", "picked-up"] },
      status: { $ne: "resolved" },
    })
      .populate("student", "name phone email regNo department")
      .lean();

    let mine = null;
    if (rawMine) {
      const ambLat = ambulance.location?.latitude;
      const ambLon = ambulance.location?.longitude;
      const emgLat = rawMine.location?.latitude;
      const emgLon = rawMine.location?.longitude;
      const dist = haversineDistance(ambLat, ambLon, emgLat, emgLon);

      mine = {
        _id: rawMine._id,
        studentName: rawMine.student?.name || "Student",
        studentPhone: rawMine.student?.phone || "",
        studentRegNo: rawMine.student?.regNo || "",
        studentDepartment: rawMine.student?.department || "",
        type: rawMine.type,
        description: rawMine.description,
        location: rawMine.location,
        distanceKm: dist,
        status: rawMine.status,
        ambulanceStatus: rawMine.ambulanceStatus,
        ambulanceAcceptedAt: rawMine.ambulanceAcceptedAt,
        pickedUpAt: rawMine.pickedUpAt,
        dispatchStartedAt: rawMine.dispatchStartedAt,
        createdAt: rawMine.createdAt,
      };
    }

    // 2. "open": emergencies searching that this ambulance is eligible for
    let open = [];
    if (ambulance.status === "available" && !mine) {
      const searchingEmergencies = await Emergency.find({
        needsAmbulance: true,
        ambulanceStatus: "searching",
        status: { $ne: "resolved" },
        assignedAmbulance: null,
      })
        .populate("student", "name")
        .sort({ dispatchStartedAt: -1, createdAt: -1 })
        .lean();

      for (const emg of searchingEmergencies) {
        if (isAmbulanceEligible(ambulance, emg)) {
          const startMs = new Date(emg.dispatchStartedAt || emg.createdAt).getTime();
          const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
          const ambLat = ambulance.location?.latitude;
          const ambLon = ambulance.location?.longitude;
          const emgLat = emg.location?.latitude;
          const emgLon = emg.location?.longitude;
          const dist = haversineDistance(ambLat, ambLon, emgLat, emgLon);

          open.push({
            _id: emg._id,
            studentFirstName: emg.student?.name ? emg.student.name.split(" ")[0] : "Student",
            type: emg.type,
            description: emg.description,
            location: emg.location,
            distanceKm: dist,
            secondsWaiting: elapsedSeconds,
            dispatchStartedAt: emg.dispatchStartedAt || emg.createdAt,
            currentRadiusKm: getDispatchRadiusKm(emg.dispatchStartedAt || emg.createdAt),
          });
        }
      }
    }

    // 3. "taken": emergencies from the last 3 minutes that another ambulance accepted
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
    const takenEmergencies = await Emergency.find({
      needsAmbulance: true,
      ambulanceStatus: { $in: ["accepted", "picked-up", "completed"] },
      assignedAmbulance: { $ne: ambulance._id, $nin: [null, undefined] },
      ambulanceAcceptedAt: { $gte: threeMinutesAgo },
    })
      .populate("assignedAmbulance", "vehicleNumber driverName")
      .sort({ ambulanceAcceptedAt: -1 })
      .limit(10)
      .lean();

    const taken = takenEmergencies.map((e) => ({
      _id: e._id,
      type: e.type,
      description: e.description,
      vehicleNumber: e.assignedAmbulance?.vehicleNumber || "Another Ambulance",
      driverName: e.assignedAmbulance?.driverName || "",
      acceptedAt: e.ambulanceAcceptedAt,
    }));

    return NextResponse.json({ open, taken, mine }, { status: 200 });
  } catch (error) {
    console.error("GET /api/ambulance/requests error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
