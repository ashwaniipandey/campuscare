import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Appointment from "@/models/Appointment";
import Report from "@/models/Report";
import AccessLog from "@/models/AccessLog";

// GET /api/patients/lookup?regNo=XYZ (staff and admin only)
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["staff", "admin"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Staff or Administrator credentials required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const rawRegNo = searchParams.get("regNo");

    if (!rawRegNo || !rawRegNo.trim()) {
      return NextResponse.json(
        { error: "Please enter a student registration number" },
        { status: 400 }
      );
    }

    const cleanRegNo = rawRegNo.trim();

    await dbConnect();

    // Exact case-insensitive match for student registration number
    const student = await User.findOne({
      role: "student",
      regNo: { $regex: new RegExp(`^${cleanRegNo}$`, "i") },
    })
      .select("-password")
      .lean();

    if (!student) {
      return NextResponse.json(
        { error: `No student record found with registration number "${cleanRegNo}"` },
        { status: 404 }
      );
    }

    // Write AccessLog entry for student lookup audit trail
    await AccessLog.create({
      staff: session.user.id,
      student: student._id,
      action: "lookup",
    });

    // Fetch all clinical appointments for this student
    const appointments = await Appointment.find({ student: student._id })
      .populate("staff", "name email staffId medicalDepartment designation")
      .sort({ date: -1, startTime: -1 })
      .lean();

    // Fetch all medical reports for this student (file.data is excluded by default)
    const reports = await Report.find({ student: student._id })
      .populate("uploadedBy", "name email staffId medicalDepartment designation")
      .sort({ reportDate: -1, createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        student: {
          _id: student._id.toString(),
          name: student.name,
          email: student.email,
          phone: student.phone || "",
          regNo: student.regNo || "",
          department: student.department || "",
          year: student.year || 1,
          gender: student.gender || "",
          bloodGroup: student.bloodGroup || "",
          emergencyContactName: student.emergencyContactName || "",
          emergencyContactPhone: student.emergencyContactPhone || "",
        },
        appointments,
        reports,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/patients/lookup error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to lookup student patient" },
      { status: 500 }
    );
  }
}
