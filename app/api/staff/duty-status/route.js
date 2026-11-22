import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

// PATCH /api/staff/duty-status - Staff updates own live duty status
export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "staff") {
      return NextResponse.json(
        { error: "Forbidden: Staff credentials required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { dutyStatus } = body;

    const validStatuses = ["available", "busy", "off-duty"];
    if (!dutyStatus || !validStatuses.includes(dutyStatus)) {
      return NextResponse.json(
        { error: "Invalid duty status. Must be available, busy, or off-duty." },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { dutyStatus },
      { new: true }
    ).select("_id name dutyStatus staffId medicalDepartment");

    if (!user) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Duty status updated successfully",
        dutyStatus: user.dutyStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/staff/duty-status error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update duty status" },
      { status: 500 }
    );
  }
}
