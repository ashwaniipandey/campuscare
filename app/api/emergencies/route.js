import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Emergency from "@/models/Emergency";

// POST /api/emergencies — student only
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "student")
      return NextResponse.json(
        { error: "Only students can trigger an emergency SOS" },
        { status: 403 }
      );

    await dbConnect();

    // Block duplicate active emergency
    const existing = await Emergency.findOne({
      student: session.user.id,
      status: { $in: ["new", "responded"] },
    });
    if (existing)
      return NextResponse.json(
        {
          error: "You already have an active emergency in progress. Please wait for it to be resolved.",
          existingId: existing._id,
        },
        { status: 409 }
      );

    const { type, description, location, needsAmbulance } = await req.json();

    const willNeedAmbulance = Boolean(needsAmbulance);

    const emergency = await Emergency.create({
      student: session.user.id,
      type: type || "medical",
      description: description?.trim() || "",
      location: {
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        address: location?.address || "",
        manualLocation: location?.manualLocation || "",
      },
      needsAmbulance: willNeedAmbulance,
      ambulanceStatus: willNeedAmbulance ? "searching" : "none",
      dispatchStartedAt: willNeedAmbulance ? new Date() : null,
    });

    return NextResponse.json({ emergency }, { status: 201 });
  } catch (error) {
    console.error("POST /api/emergencies error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
