import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Review from "@/models/Review";
import Appointment from "@/models/Appointment";

// POST /api/reviews (student only)
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "student") {
      return NextResponse.json(
        { error: "Forbidden: only students can submit reviews" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { appointmentId, rating, comment, isAnonymous } = body;

    if (!appointmentId || !mongoose.isValidObjectId(appointmentId)) {
      return NextResponse.json(
        { error: "Valid appointmentId is required" },
        { status: 400 }
      );
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json(
        { error: "Rating must be a number between 1 and 5" },
        { status: 400 }
      );
    }

    const trimmedComment = typeof comment === "string" ? comment.trim() : "";
    if (trimmedComment.length > 500) {
      return NextResponse.json(
        { error: "Comment cannot exceed 500 characters" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify appointment belongs to this student
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      student: session.user.id,
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found or does not belong to you" },
        { status: 404 }
      );
    }

    if (appointment.status !== "completed") {
      return NextResponse.json(
        { error: "Reviews can only be submitted for completed visits" },
        { status: 400 }
      );
    }

    if (!appointment.staff) {
      return NextResponse.json(
        { error: "This appointment does not have an assigned clinician" },
        { status: 400 }
      );
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({ appointment: appointmentId });
    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this appointment" },
        { status: 409 }
      );
    }

    const review = await Review.create({
      student: session.user.id,
      doctor: appointment.staff,
      appointment: appointment._id,
      rating: Math.round(numRating),
      comment: trimmedComment,
      isAnonymous: Boolean(isAnonymous),
      isDemo: false,
    });

    return NextResponse.json(
      {
        message: "Review submitted successfully",
        review: {
          _id: review._id.toString(),
          appointment: review.appointment.toString(),
          rating: review.rating,
          comment: review.comment,
          isAnonymous: review.isAnonymous,
          createdAt: review.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/reviews error:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A review for this appointment already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to submit review" },
      { status: 500 }
    );
  }
}
