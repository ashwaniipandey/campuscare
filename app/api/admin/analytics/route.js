import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import Emergency from "@/models/Emergency";

// GET /api/admin/analytics — admin only
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

    // 14 days date series
    const last14Days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      last14Days.push({ iso, label });
    }

    const fourteenDaysAgoDate = new Date();
    fourteenDaysAgoDate.setDate(fourteenDaysAgoDate.getDate() - 14);
    const fourteenDaysAgoIso = fourteenDaysAgoDate.toISOString().split("T")[0];

    const [allAppointments, allEmergencies] = await Promise.all([
      Appointment.find().select("date status type createdAt").lean(),
      Emergency.find()
        .select("type status responseTimeSeconds needsAmbulance ambulanceStatus ambulanceAcceptedAt dispatchStartedAt createdAt")
        .lean(),
    ]);

    // a) appointments per day for the last 14 days
    const appointmentsPerDay = last14Days.map(({ iso, label }) => {
      const count = allAppointments.filter((a) => a.date === iso).length;
      return { date: iso, label, count };
    });

    // b) appointments by status
    const statusMap = {
      pending: { name: "Pending", color: "#f59e0b" },
      confirmed: { name: "Confirmed", color: "#0d9488" },
      completed: { name: "Completed", color: "#10b981" },
      cancelled: { name: "Cancelled", color: "#ef4444" },
    };
    const appointmentsByStatus = Object.keys(statusMap).map((key) => {
      const count = allAppointments.filter((a) => a.status === key).length;
      return {
        name: statusMap[key].name,
        status: key,
        value: count,
        color: statusMap[key].color,
      };
    });

    // c) emergencies by type
    const emergencyTypes = [
      { type: "medical", label: "Medical Crisis", color: "#dc2626" },
      { type: "injury", label: "Physical Injury", color: "#ea580c" },
      { type: "mental-health", label: "Mental Health", color: "#0284c7" },
      { type: "other", label: "Other Hazard", color: "#64748b" },
    ];
    const emergenciesByType = emergencyTypes.map((t) => {
      const count = allEmergencies.filter((e) => e.type === t.type).length;
      return {
        type: t.type,
        label: t.label,
        count,
        color: t.color,
      };
    });

    // d) emergencies per day for the last 14 days
    const emergenciesPerDay = last14Days.map(({ iso, label }) => {
      const count = allEmergencies.filter((e) => {
        const emgIso = new Date(e.createdAt).toISOString().split("T")[0];
        return emgIso === iso;
      }).length;
      return { date: iso, label, count };
    });

    // e) average response time per day for the last 14 days
    const responseTimePerDay = last14Days.map(({ iso, label }) => {
      const dayEmergencies = allEmergencies.filter((e) => {
        const emgIso = new Date(e.createdAt).toISOString().split("T")[0];
        return (
          emgIso === iso &&
          typeof e.responseTimeSeconds === "number" &&
          e.responseTimeSeconds >= 0
        );
      });
      const avgSeconds =
        dayEmergencies.length > 0
          ? Math.round(
              dayEmergencies.reduce((sum, e) => sum + e.responseTimeSeconds, 0) /
                dayEmergencies.length
            )
          : 0;
      return { date: iso, label, avgSeconds, count: dayEmergencies.length };
    });

    // f) busiest weekday for appointments
    const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const weekdayCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    allAppointments.forEach((a) => {
      if (a.date) {
        const [y, m, d] = a.date.split("-");
        const dt = new Date(y, m - 1, d);
        if (!isNaN(dt.getDay())) {
          weekdayCounts[dt.getDay()]++;
        }
      }
    });

    let busiestDayIndex = 1;
    let maxDayCount = -1;
    Object.keys(weekdayCounts).forEach((key) => {
      if (weekdayCounts[key] > maxDayCount) {
        maxDayCount = weekdayCounts[key];
        busiestDayIndex = Number(key);
      }
    });

    const weekdayBreakdown = [1, 2, 3, 4, 5, 6, 0].map((dayIdx) => ({
      day: weekdayNames[dayIdx].slice(0, 3),
      fullDay: weekdayNames[dayIdx],
      count: weekdayCounts[dayIdx],
    }));

    // g) average ambulance acceptance time
    const ambulanceAcceptedEmergencies = allEmergencies.filter(
      (e) => e.ambulanceAcceptedAt && e.dispatchStartedAt
    );
    const avgAmbulanceAcceptanceSeconds =
      ambulanceAcceptedEmergencies.length > 0
        ? Math.round(
            ambulanceAcceptedEmergencies.reduce((sum, e) => {
              const diffSec = Math.max(
                0,
                (new Date(e.ambulanceAcceptedAt).getTime() - new Date(e.dispatchStartedAt).getTime()) / 1000
              );
              return sum + diffSec;
            }, 0) / ambulanceAcceptedEmergencies.length
          )
        : null;
    const totalAmbulanceDispatches = allEmergencies.filter((e) => e.needsAmbulance).length;

    return NextResponse.json(
      {
        appointmentsPerDay,
        appointmentsByStatus,
        emergenciesByType,
        emergenciesPerDay,
        responseTimePerDay,
        busiestWeekday: {
          day: weekdayNames[busiestDayIndex],
          count: maxDayCount,
        },
        weekdayBreakdown,
        avgAmbulanceAcceptanceSeconds,
        totalAmbulanceDispatches,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/admin/analytics error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
