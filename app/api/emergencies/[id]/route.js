import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Emergency from "@/models/Emergency";
import mongoose from "mongoose";

// PATCH /api/emergencies/[id] — staff and admin only
// action: "respond" | "resolve"
export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "staff" && session.user.role !== "admin")
      return NextResponse.json({ error: "Staff or admin only" }, { status: 403 });

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ error: `Invalid emergency id: "${id}"` }, { status: 400 });

    const { action } = await req.json();

    if (!["respond", "resolve"].includes(action))
      return NextResponse.json(
        { error: 'action must be "respond" or "resolve"' },
        { status: 400 }
      );

    await dbConnect();

    const emergency = await Emergency.findById(id);
    if (!emergency)
      return NextResponse.json({ error: `Emergency "${id}" not found` }, { status: 404 });

    if (action === "respond") {
      if (emergency.status !== "new")
        return NextResponse.json(
          { error: `Cannot respond to an emergency that is already "${emergency.status}"` },
          { status: 400 }
        );
      emergency.status = "responded";
      emergency.respondedBy = session.user.id;
      emergency.respondedAt = new Date();
      emergency.responseTimeSeconds = Math.round(
        (emergency.respondedAt - emergency.createdAt) / 1000
      );
    } else if (action === "resolve") {
      if (emergency.status === "resolved")
        return NextResponse.json({ error: "Already resolved" }, { status: 400 });
      emergency.status = "resolved";
      emergency.resolvedAt = new Date();
    }

    await emergency.save();

    const populated = await Emergency.findById(id)
      .populate("student", "name email phone")
      .populate("respondedBy", "name")
      .lean();

    return NextResponse.json({ emergency: populated }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/emergencies/[id] error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
