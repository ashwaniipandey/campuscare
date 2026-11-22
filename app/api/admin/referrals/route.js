import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Referral from "@/models/Referral";
import "@/models/Appointment";
import "@/models/User";

// GET /api/admin/referrals — admin only
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Admin role required" }, { status: 403 });
    }

    await dbConnect();

    const referrals = await Referral.find()
      .populate("patient", "name regNo email phone department")
      .populate("fromDoctor", "name staffId medicalDepartment")
      .populate("toDoctor", "name staffId medicalDepartment")
      .populate("appointment", "date startTime service")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return NextResponse.json({ referrals }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/referrals error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
