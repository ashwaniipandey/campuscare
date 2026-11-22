import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Report from "@/models/Report";
import AccessLog from "@/models/AccessLog";

// GET /api/reports/[id]/file (owner student, or staff/admin)
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

    const { searchParams } = new URL(req.url);
    const isDownload = searchParams.get("download") === "1";

    await dbConnect();

    // Query report with the binary file buffer explicitly selected
    const report = await Report.findById(id).select("+file.data");
    if (!report || !report.hasFile || !report.file?.data) {
      return NextResponse.json(
        { error: "No document file attachment found for this report" },
        { status: 404 }
      );
    }

    const isStudent = session.user.role === "student";
    const isStaffOrAdmin = ["staff", "admin"].includes(session.user.role);

    // Permission enforcement: Students may ONLY access their own reports
    if (isStudent) {
      if (report.student.toString() !== session.user.id) {
        return NextResponse.json(
          { error: "Forbidden: You are not authorized to view another student's medical file." },
          { status: 403 }
        );
      }

      // Mark report as viewed by the owning student
      if (!report.viewedByStudentAt) {
        await Report.findByIdAndUpdate(id, { viewedByStudentAt: new Date() });
      }
    } else if (isStaffOrAdmin) {
      // For staff and admin access, record audit log entry
      const auditAction = isDownload ? "download-report" : "view-report";
      await AccessLog.create({
        staff: session.user.id,
        student: report.student,
        action: auditAction,
        report: report._id,
      });
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const filename = report.file.filename || "medical-report";
    const contentType = report.file.contentType || "application/octet-stream";
    const dispositionType = isDownload ? "attachment" : "inline";

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Length", String(report.file.size || report.file.data.length));
    headers.set(
      "Content-Disposition",
      `${dispositionType}; filename="${encodeURIComponent(filename)}"`
    );
    // Security headers for sensitive health files
    headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");

    return new NextResponse(report.file.data, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("GET /api/reports/[id]/file error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to stream medical file" },
      { status: 500 }
    );
  }
}
