export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Notification from "@/models/Notification";

// GET /api/notifications — own latest 30 notifications + unreadCount
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const userObjectId = new mongoose.Types.ObjectId(session.user.id);

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ user: userObjectId })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),
      Notification.countDocuments({ user: userObjectId, isRead: false }),
    ]);

    const res = NextResponse.json({ notifications, unreadCount }, { status: 200 });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.headers.set("Pragma", "no-cache");
    return res;
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
