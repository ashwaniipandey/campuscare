import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import Review from "@/models/Review";

export const dynamic = "force-dynamic";

function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// GET /api/staff/performance (staff only, own data)
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "staff") {
      return NextResponse.json(
        { error: "Forbidden: staff role required" },
        { status: 403 }
      );
    }

    await dbConnect();

    const staffId = new mongoose.Types.ObjectId(session.user.id);
    const todayStr = getTodayStr();

    // 14 days dates range
    const days14 = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      days14.push({ date: dateStr, label, count: 0 });
    }
    const fourteenDaysAgoStr = days14[0].date;

    // 7 days ago
    const d7 = new Date();
    d7.setDate(d7.getDate() - 6);
    const sevenDaysAgoStr = `${d7.getFullYear()}-${String(d7.getMonth() + 1).padStart(2, "0")}-${String(d7.getDate()).padStart(2, "0")}`;

    // Completed appointments for this doctor
    const completedAppointments = await Appointment.find({
      staff: staffId,
      status: "completed",
    })
      .select("date service department reason")
      .lean();

    const totalSeen = completedAppointments.length;
    let todayCount = 0;
    let thisWeekCount = 0;
    const serviceCounts = {};

    const dateCountMap = {};
    completedAppointments.forEach((a) => {
      if (a.date === todayStr) {
        todayCount++;
      }
      if (a.date >= sevenDaysAgoStr) {
        thisWeekCount++;
      }
      if (a.date >= fourteenDaysAgoStr) {
        dateCountMap[a.date] = (dateCountMap[a.date] || 0) + 1;
      }

      const sName = a.service || a.department || "Consultation";
      serviceCounts[sName] = (serviceCounts[sName] || 0) + 1;
    });

    const patientsPerDay = days14.map((day) => ({
      date: day.date,
      label: day.label,
      patients: dateCountMap[day.date] || 0,
    }));

    // Average patients per working day (active days in last 14 days with > 0 visits, or total last 14 days / 10 weekdays)
    const activeWorkingDays = patientsPerDay.filter((p) => p.patients > 0).length;
    const totalLast14Days = patientsPerDay.reduce((acc, p) => acc + p.patients, 0);
    const avgPatientsPerWorkingDay =
      activeWorkingDays > 0 ? Number((totalLast14Days / activeWorkingDays).toFixed(1)) : 0;

    // Service breakdown
    const serviceBreakdown = Object.entries(serviceCounts)
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count);

    // Reviews for this doctor
    const reviews = await Review.find({ doctor: staffId })
      .populate("student", "name")
      .sort({ createdAt: -1 })
      .lean();

    const reviewCount = reviews.length;
    let ratingSum = 0;
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    reviews.forEach((r) => {
      ratingSum += r.rating;
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating] += 1;
      }
    });

    const avgRating = reviewCount > 0 ? Number((ratingSum / reviewCount).toFixed(1)) : 0;

    // Latest 10 reviews
    const recentReviews = reviews.slice(0, 10).map((r) => {
      let displayName = "Student";
      if (r.isAnonymous) {
        displayName = "Anonymous";
      } else if (r.student?.name) {
        displayName = r.student.name.split(" ")[0] || "Student";
      }

      return {
        _id: r._id.toString(),
        rating: r.rating,
        comment: r.comment || "",
        studentName: displayName,
        isAnonymous: Boolean(r.isAnonymous),
        createdAt: r.createdAt,
      };
    });

    return NextResponse.json(
      {
        todayCount,
        thisWeekCount,
        totalSeen,
        patientsPerDay,
        avgPatientsPerWorkingDay,
        avgRating,
        reviewCount,
        distribution,
        serviceBreakdown,
        recentReviews,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/staff/performance error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load staff performance data" },
      { status: 500 }
    );
  }
}
