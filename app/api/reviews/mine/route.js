import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Review from "@/models/Review";

export const dynamic = "force-dynamic";

// GET /api/reviews/mine (student only)
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "student") {
      return NextResponse.json(
        { error: "Forbidden: student role required" },
        { status: 403 }
      );
    }

    await dbConnect();

    const reviews = await Review.find({ student: session.user.id })
      .select("_id appointment doctor rating comment isAnonymous createdAt")
      .lean();

    const formatted = reviews.map((r) => ({
      _id: r._id.toString(),
      appointment: r.appointment.toString(),
      doctor: r.doctor.toString(),
      rating: r.rating,
      comment: r.comment,
      isAnonymous: r.isAnonymous,
      createdAt: r.createdAt,
    }));

    return NextResponse.json(
      { reviews: formatted },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/reviews/mine error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch student reviews" },
      { status: 500 }
    );
  }
}
