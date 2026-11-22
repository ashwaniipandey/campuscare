import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Appointment from "@/models/Appointment";

// GET /api/staff/stats — staff only
// Returns appointment counts for the logged-in staff member
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "staff" && session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Only health staff can view their stats" },
        { status: 403 }
      );
    }

    await dbConnect();

    const staffId = session.user.id;
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Fetch all appointments for this staff member
    const all = await Appointment.find({ staff: staffId }).lean();

    const today = all.filter((a) => a.date === todayStr);
    const upcoming = all.filter((a) => a.date > todayStr && a.status !== "cancelled");

    const counts = {
      today: today.length,
      pending: all.filter((a) => a.status === "pending").length,
      confirmed: all.filter((a) => a.status === "confirmed").length,
      completed: all.filter((a) => a.status === "completed").length,
      cancelled: all.filter((a) => a.status === "cancelled").length,
      upcoming: upcoming.length,
    };

    // Return today's full appointments (populated) + upcoming (populated)
    const todayPopulated = await Appointment.find({
      staff: staffId,
      date: todayStr,
    })
      .populate("student", "name email phone regNo department year")
      .sort({ startTime: 1 })
      .lean();

    const upcomingPopulated = await Appointment.find({
      staff: staffId,
      date: { $gt: todayStr },
      status: { $ne: "cancelled" },
    })
      .populate("student", "name email phone regNo department year")
      .sort({ date: 1, startTime: 1 })
      .limit(20)
      .lean();

    return NextResponse.json(
      { counts, today: todayPopulated, upcoming: upcomingPopulated },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/staff/stats error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
