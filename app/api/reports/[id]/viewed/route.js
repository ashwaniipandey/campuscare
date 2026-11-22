import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Report from "@/models/Report";

// POST /api/reports/[id]/viewed  (student only)
// Marks a report as viewed by the owning student if not already viewed.
export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "student") {
      return NextResponse.json(
        { error: "Forbidden: Student access only" },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
    }

    await dbConnect();

    const report = await Report.findById(id).select("student viewedByStudentAt");
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Students can only mark their own reports as viewed
    if (report.student.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to access this report." },
        { status: 403 }
      );
    }

    // Only update if not already viewed
    if (!report.viewedByStudentAt) {
      const now = new Date();
      await Report.findByIdAndUpdate(id, { viewedByStudentAt: now });
      return NextResponse.json({ marked: true, viewedAt: now.toISOString() }, { status: 200 });
    }

    // Already viewed — return current timestamp
    return NextResponse.json(
      { marked: false, viewedAt: report.viewedByStudentAt.toISOString() },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/reports/[id]/viewed error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to mark report as viewed" },
      { status: 500 }
    );
  }
}
