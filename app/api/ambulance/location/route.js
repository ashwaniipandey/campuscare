import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Ambulance from "@/models/Ambulance";

// PATCH /api/ambulance/location — update ambulance live GPS coords
export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ambulance") {
      return NextResponse.json({ error: "Ambulance driver only" }, { status: 403 });
    }

    const { latitude, longitude } = await req.json();

    if (latitude == null || longitude == null || isNaN(Number(latitude)) || isNaN(Number(longitude))) {
      return NextResponse.json(
        { error: "Valid latitude and longitude are required." },
        { status: 400 }
      );
    }

    await dbConnect();

    const ambulance = await Ambulance.findOneAndUpdate(
      { user: session.user.id },
      {
        $set: {
          location: {
            latitude: Number(latitude),
            longitude: Number(longitude),
            updatedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!ambulance) {
      return NextResponse.json(
        { error: "Ambulance profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, location: ambulance.location },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/ambulance/location error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
