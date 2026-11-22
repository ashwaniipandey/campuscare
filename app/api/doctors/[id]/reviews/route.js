import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Review from "@/models/Review";

export const dynamic = "force-dynamic";

// GET /api/doctors/[id]/reviews (any logged-in user)
export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid doctor ID" }, { status: 400 });
    }

    await dbConnect();

    const doctorObjectId = new mongoose.Types.ObjectId(id);

    // Distribution and overall aggregates
    const reviews = await Review.find({ doctor: doctorObjectId })
      .populate("student", "name")
      .sort({ createdAt: -1 })
      .lean();

    const reviewCount = reviews.length;
    let sum = 0;
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    reviews.forEach((r) => {
      sum += r.rating;
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating] += 1;
      }
    });

    const averageRating = reviewCount > 0 ? Number((sum / reviewCount).toFixed(1)) : 0;

    // Latest 20 reviews
    const latest20 = reviews.slice(0, 20).map((r) => {
      let displayName = "Student";
      if (r.isAnonymous) {
        displayName = "Anonymous";
      } else if (r.student?.name) {
        // Show first name only
        displayName = r.student.name.split(" ")[0] || "Student";
      }

      return {
        _id: r._id.toString(),
        rating: r.rating,
        comment: r.comment || "",
        studentName: displayName,
        isAnonymous: Boolean(r.isAnonymous),
        createdAt: r.createdAt,
      };
    });

    return NextResponse.json(
      {
        averageRating,
        reviewCount,
        distribution,
        reviews: latest20,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/doctors/[id]/reviews error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load doctor reviews" },
      { status: 500 }
    );
  }
}
