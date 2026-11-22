import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Availability from "@/models/Availability";
import User from "@/models/User";

function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid doctor ID" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date") || getTodayStr();

    await dbConnect();

    // Verify doctor exists
    const doctor = await User.findById(id).select("_id name staffId medicalDepartment dutyStatus").lean();
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Query unbooked availability slots for this doctor on the specified date
    const slots = await Availability.find({
      staff: id,
      date: dateStr,
      isBooked: false,
    })
      .sort({ startTime: 1 })
      .lean();

    return NextResponse.json(
      {
        doctor: {
          _id: doctor._id.toString(),
          name: doctor.name,
          staffId: doctor.staffId,
          medicalDepartment: doctor.medicalDepartment,
          dutyStatus: doctor.dutyStatus || "available",
        },
        date: dateStr,
        slots,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/doctors/[id]/slots error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load doctor slots" },
      { status: 500 }
    );
  }
}
