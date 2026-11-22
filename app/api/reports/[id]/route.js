import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Report from "@/models/Report";

// GET /api/reports/[id] (owner student or staff/admin)
export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
    }

    await dbConnect();

    // Query report without binary data
    const report = await Report.findById(id)
      .populate("uploadedBy", "name email staffId medicalDepartment designation")
      .populate("student", "name email regNo department year")
      .lean();

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const isStudent = session.user.role === "student";
    const isStaffOrAdmin = ["staff", "admin"].includes(session.user.role);

    // Permission enforcement
    if (isStudent && report.student?._id?.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to view this report." },
        { status: 403 }
      );
    }

    if (!isStudent && !isStaffOrAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Mark as viewed if owner student
    if (isStudent && !report.viewedByStudentAt) {
      await Report.findByIdAndUpdate(id, { viewedByStudentAt: new Date() });
      report.viewedByStudentAt = new Date();
    }

    return NextResponse.json({ report }, { status: 200 });
  } catch (error) {
    console.error("GET /api/reports/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load report" },
      { status: 500 }
    );
  }
}
