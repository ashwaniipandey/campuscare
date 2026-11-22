import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Ambulance from "@/models/Ambulance";

// PATCH /api/ambulance/status — update available, busy, or offline status
export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ambulance") {
      return NextResponse.json({ error: "Ambulance driver only" }, { status: 403 });
    }

    const { status } = await req.json();
    if (!["available", "busy", "offline"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be available, busy, or offline." },
        { status: 400 }
      );
    }

    await dbConnect();

    const ambulance = await Ambulance.findOneAndUpdate(
      { user: session.user.id },
      { $set: { status } },
      { new: true }
    );

    if (!ambulance) {
      return NextResponse.json(
        { error: "Ambulance profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, status: ambulance.status, ambulance }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/ambulance/status error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
