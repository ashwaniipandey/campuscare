import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Appointment from "@/models/Appointment";
import Review from "@/models/Review";

export const dynamic = "force-dynamic";

// GET /api/admin/doctors-performance (admin only)
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: admin role required" },
        { status: 403 }
      );
    }

    await dbConnect();

    // 7 days ago date string
    const d7 = new Date();
    d7.setDate(d7.getDate() - 6);
    const sevenDaysAgoStr = `${d7.getFullYear()}-${String(d7.getMonth() + 1).padStart(2, "0")}-${String(d7.getDate()).padStart(2, "0")}`;

    // 1. Fetch all doctors
    const doctors = await User.find({ role: "staff" })
      .select("_id name staffId medicalDepartment designation qualification dutyStatus email phone")
      .lean();

    // 2. Aggregate total completed appointments per doctor
    const totalCompleted = await Appointment.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: "$staff", count: { $sum: 1 } } },
    ]);
    const totalCompletedMap = {};
    totalCompleted.forEach((tc) => {
      if (tc._id) totalCompletedMap[tc._id.toString()] = tc.count;
    });

    // 3. Aggregate last 7 days completed appointments per doctor
    const recentCompleted = await Appointment.aggregate([
      { $match: { status: "completed", date: { $gte: sevenDaysAgoStr } } },
      { $group: { _id: "$staff", count: { $sum: 1 } } },
    ]);
    const recentCompletedMap = {};
    recentCompleted.forEach((rc) => {
      if (rc._id) recentCompletedMap[rc._id.toString()] = rc.count;
    });

    // 4. Aggregate reviews per doctor
    const reviewsAgg = await Review.aggregate([
      {
        $group: {
          _id: "$doctor",
          avgRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]);
    const reviewsMap = {};
    reviewsAgg.forEach((r) => {
      if (r._id) {
        reviewsMap[r._id.toString()] = {
          avgRating: Number(r.avgRating.toFixed(1)),
          reviewCount: r.reviewCount,
        };
      }
    });

    // Assemble result
    const doctorsPerformance = doctors.map((doc) => {
      const idStr = doc._id.toString();
      const reviewStats = reviewsMap[idStr] || { avgRating: 0, reviewCount: 0 };

      return {
        _id: idStr,
        staffId: doc.staffId || null,
        name: doc.name,
        medicalDepartment: doc.medicalDepartment || "General Medicine",
        designation: doc.designation || "Healthcare Professional",
        dutyStatus: doc.dutyStatus || "available",
        email: doc.email || "",
        phone: doc.phone || "",
        patientsSeenTotal: totalCompletedMap[idStr] || 0,
        patientsSeenLast7Days: recentCompletedMap[idStr] || 0,
        averageRating: reviewStats.avgRating,
        reviewCount: reviewStats.reviewCount,
      };
    });

    return NextResponse.json(
      { doctors: doctorsPerformance },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/admin/doctors-performance error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load doctors performance" },
      { status: 500 }
    );
  }
}
