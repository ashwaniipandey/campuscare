import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Appointment from "@/models/Appointment";
import Emergency from "@/models/Emergency";

// GET /api/admin/stats — admin only
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Admin role required" }, { status: 403 });
    }

    await dbConnect();

    const todayStr = new Date().toISOString().split("T")[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Run parallel count & aggregations
    const [
      totalUsers,
      totalStudents,
      totalStaff,
      totalAdmins,
      allAppointments,
      allEmergencies,
      recentRespondedEmergencies,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "staff" }),
      User.countDocuments({ role: "admin" }),
      Appointment.find().select("status date").lean(),
      Emergency.find().select("status responseTimeSeconds createdAt").lean(),
      Emergency.find({
        status: { $in: ["responded", "resolved"] },
        responseTimeSeconds: { $ne: null },
        createdAt: { $gte: sevenDaysAgo },
      })
        .select("responseTimeSeconds")
        .lean(),
    ]);

    // Appointments by status
    const apptCounts = {
      total: allAppointments.length,
      today: allAppointments.filter((a) => a.date === todayStr).length,
      pending: allAppointments.filter((a) => a.status === "pending").length,
      confirmed: allAppointments.filter((a) => a.status === "confirmed").length,
      completed: allAppointments.filter((a) => a.status === "completed").length,
      cancelled: allAppointments.filter((a) => a.status === "cancelled").length,
    };

    // Emergencies by status
    const emgCounts = {
      total: allEmergencies.length,
      new: allEmergencies.filter((e) => e.status === "new").length,
      responded: allEmergencies.filter((e) => e.status === "responded").length,
      resolved: allEmergencies.filter((e) => e.status === "resolved").length,
      active: allEmergencies.filter((e) => e.status === "new" || e.status === "responded").length,
    };

    // Overall average response time in seconds
    const withResponseTime = allEmergencies.filter(
      (e) => typeof e.responseTimeSeconds === "number" && e.responseTimeSeconds >= 0
    );
    const avgResponseTime =
      withResponseTime.length > 0
        ? Math.round(
            withResponseTime.reduce((sum, e) => sum + e.responseTimeSeconds, 0) /
              withResponseTime.length
          )
        : 0;

    // Last 7 days average response time
    const avgResponseTime7Days =
      recentRespondedEmergencies.length > 0
        ? Math.round(
            recentRespondedEmergencies.reduce((sum, e) => sum + e.responseTimeSeconds, 0) /
              recentRespondedEmergencies.length
          )
        : avgResponseTime;

    return NextResponse.json(
      {
        users: {
          total: totalUsers,
          student: totalStudents,
          staff: totalStaff,
          admin: totalAdmins,
        },
        appointments: apptCounts,
        emergencies: emgCounts,
        avgResponseTime,
        avgResponseTime7Days,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
