import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Report from "@/models/Report";

// Disable Next.js route caching - reports need to be real-time
export const dynamic = "force-dynamic";

// GET /api/reports/mine (student only)
export async function GET() {
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

    await dbConnect();

    // Fetch student's reports (file.data is excluded by default schema config)
    const reports = await Report.find({ student: session.user.id })
      .populate("uploadedBy", "name email staffId medicalDepartment designation")
      .sort({ reportDate: -1, createdAt: -1 })
      .lean();

    const unviewedCount = reports.filter((r) => !r.viewedByStudentAt).length;

    return NextResponse.json(
      { reports, unviewedCount },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Pragma": "no-cache",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/reports/mine error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load student reports" },
      { status: 500 }
    );
  }
}
