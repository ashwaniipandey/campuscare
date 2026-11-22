import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";

// DELETE /api/admin/users/[id] — admin only
// Admin cannot delete their own account or other admins
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Admin role required" }, { status: 403 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: `Invalid user id: "${id}"` }, { status: 400 });
    }

    if (id.toString() === session.user.id.toString()) {
      return NextResponse.json(
        { error: "Action blocked: You cannot delete your own administrative account." },
        { status: 400 }
      );
    }

    await dbConnect();

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ error: `User "${id}" not found` }, { status: 404 });
    }

    if (targetUser.role === "admin") {
      return NextResponse.json(
        { error: "Security restriction: Administrator accounts cannot be deleted directly." },
        { status: 403 }
      );
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json(
      { message: `User "${targetUser.name}" (${targetUser.email}) removed successfully.` },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/admin/users/[id] error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
