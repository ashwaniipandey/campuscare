import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import AccessLog from "@/models/AccessLog";

// GET /api/admin/access-logs (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Administrator role required" },
        { status: 403 }
      );
    }

    await dbConnect();

    // Fetch latest 200 audit access entries
    const logs = await AccessLog.find()
      .populate("staff", "name email staffId role")
      .populate("student", "name email regNo department year")
      .populate("report", "title category condition")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return NextResponse.json({ logs }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/access-logs error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve access audit logs" },
      { status: 500 }
    );
  }
}
