import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Availability from "@/models/Availability";
import mongoose from "mongoose";

// DELETE /api/availability/[id] — staff only: delete own unbooked slot
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "staff" && session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Only health staff can delete availability slots" },
        { status: 403 }
      );
    }

    // ✅ FIX 1: params is a Promise in Next.js 15/16 — must be awaited
    const { id } = await params;

    // ✅ FIX 2: validate the id before hitting MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: `Invalid slot id: "${id}"` },
        { status: 400 }
      );
    }

    await dbConnect();

    const slot = await Availability.findById(id);

    if (!slot) {
      return NextResponse.json(
        { error: `Availability slot "${id}" not found` },
        { status: 404 }
      );
    }

    // ✅ FIX 3: compare as strings explicitly
    if (slot.staff.toString() !== session.user.id.toString()) {
      return NextResponse.json(
        { error: "You can only delete your own availability slots" },
        { status: 403 }
      );
    }

    if (slot.isBooked) {
      return NextResponse.json(
        { error: "Cannot delete a booked slot. Cancel the appointment first." },
        { status: 400 }
      );
    }

    await Availability.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Availability slot deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/availability/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
