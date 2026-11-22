import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Ambulance from "@/models/Ambulance";

// GET /api/ambulance/me — ambulance driver profile
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

    const ambulance = await Ambulance.findOne({ user: session.user.id })
      .populate("user", "name email phone")
      .lean();

    if (!ambulance) {
      return NextResponse.json(
        { error: "Ambulance profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ambulance }, { status: 200 });
  } catch (error) {
    console.error("GET /api/ambulance/me error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
