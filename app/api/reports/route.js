import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Report from "@/models/Report";
import AccessLog from "@/models/AccessLog";
import { createNotification } from "@/lib/notify";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
];

const ALLOWED_CATEGORIES = [
  "Blood Test",
  "Urine Test",
  "Typhoid Test",
  "Malaria and Dengue Test",
  "X-Ray",
  "Ultrasound",
  "Skin Report",
  "Prescription",
  "General Checkup",
  "Other",
];

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB

function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// POST /api/reports (staff only)
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "staff") {
      return NextResponse.json(
        { error: "Forbidden: Staff credentials required to upload reports" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const studentId = formData.get("studentId");
    const regNo = formData.get("regNo");
    const category = formData.get("category");
    const title = formData.get("title");
    const summary = formData.get("summary") || "";
    const condition = formData.get("condition") || "normal";
    const reportDate = formData.get("reportDate") || getTodayStr();
    const appointmentId = formData.get("appointmentId") || null;
    const file = formData.get("file");

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Report title is required" }, { status: 400 });
    }

    if (!category || !ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: "Please select a valid report category" },
        { status: 400 }
      );
    }

    const validConditions = ["normal", "follow-up-needed", "critical"];
    if (!validConditions.includes(condition)) {
      return NextResponse.json(
        { error: "Condition must be normal, follow-up-needed, or critical" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Resolve target student
    let student = null;
    if (studentId) {
      student = await User.findById(studentId);
    } else if (regNo) {
      student = await User.findOne({
        role: "student",
        regNo: { $regex: new RegExp(`^${regNo.trim()}$`, "i") },
      });
    }

    if (!student || student.role !== "student") {
      return NextResponse.json(
        { error: "Target student patient not found. Please provide a valid student or registration number." },
        { status: 404 }
      );
    }

    // Process optional file attachment
    let filePayload = undefined;
    let hasFile = false;

    if (file && typeof file === "object" && typeof file.arrayBuffer === "function" && file.size > 0) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "File size exceeds the 4 MB limit. Please upload a smaller file." },
          { status: 400 }
        );
      }

      const fileType = file.type || "";
      const isAllowedMime = ALLOWED_MIME_TYPES.includes(fileType.toLowerCase());
      const isAllowedExt = /\.(pdf|jpe?g|png)$/i.test(file.name || "");

      if (!isAllowedMime && !isAllowedExt) {
        return NextResponse.json(
          { error: "Invalid file format. Only PDF, JPG, and PNG files are allowed." },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      filePayload = {
        data: buffer,
        contentType: file.type || (file.name?.endsWith(".pdf") ? "application/pdf" : "image/jpeg"),
        filename: file.name || "medical-report",
        size: file.size,
      };
      hasFile = true;
    }

    // Save Report to MongoDB
    const newReport = await Report.create({
      student: student._id,
      uploadedBy: session.user.id,
      appointment: appointmentId || null,
      category,
      title: title.trim(),
      summary: summary.trim(),
      condition,
      reportDate,
      file: filePayload,
      hasFile,
    });

    // Write AccessLog entry for upload audit
    await AccessLog.create({
      staff: session.user.id,
      student: student._id,
      action: "upload-report",
      report: newReport._id,
    });

    // Notify student about new report
    await createNotification(student._id, {
      type: "report-ready",
      title: "New Medical Report Available",
      message: `Your ${category} report ("${newReport.title}") was uploaded by ${session.user.name || "Campus Health Staff"}.`,
      link: "/student/reports",
    });

    return NextResponse.json(
      {
        message: "Medical report uploaded successfully",
        report: {
          _id: newReport._id.toString(),
          title: newReport.title,
          category: newReport.category,
          condition: newReport.condition,
          reportDate: newReport.reportDate,
          hasFile: newReport.hasFile,
          createdAt: newReport.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/reports error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload report" },
      { status: 500 }
    );
  }
}
