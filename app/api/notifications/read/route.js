export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Notification from "@/models/Notification";

// PATCH /api/notifications/read — mark one or all as read
export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, all } = body;

    await dbConnect();

    const userObjectId = new mongoose.Types.ObjectId(session.user.id);

    if (all) {
      await Notification.updateMany(
        { user: userObjectId, isRead: false },
        { $set: { isRead: true } }
      );
      return NextResponse.json({ success: true, markedAll: true }, { status: 200 });
    }

    if (id) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 });
      }

      await Notification.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(id), user: userObjectId },
        { $set: { isRead: true } }
      );

      return NextResponse.json({ success: true, id }, { status: 200 });
    }

    return NextResponse.json(
      { error: "Provide either id or all: true" },
      { status: 400 }
    );
  } catch (error) {
    console.error("PATCH /api/notifications/read error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
