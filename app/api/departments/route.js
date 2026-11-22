import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Availability from "@/models/Availability";
import { DEPARTMENTS } from "@/lib/departments";

function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentHHMM() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

// GET /api/departments - Return all departments with doctor counts & available right now
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const todayStr = getTodayStr();
    const currentHHMM = getCurrentHHMM();

    // Fetch all active staff
    const staffList = await User.find({ role: "staff" })
      .select("_id name medicalDepartment dutyStatus")
      .lean();

    // Fetch all unbooked slots for today
    const todayUnbookedSlots = await Availability.find({
      date: todayStr,
      isBooked: false,
    })
      .select("staff startTime endTime")
      .lean();

    // Map departments with real-time stats
    const departmentsWithStats = DEPARTMENTS.map((dept) => {
      const deptDoctors = staffList.filter(
        (doc) =>
          doc.medicalDepartment &&
          doc.medicalDepartment.toLowerCase() === dept.name.toLowerCase()
      );

      const doctorCount = deptDoctors.length;

      // Doctor is available right now if:
      // dutyStatus === "available" AND has an unbooked slot today where startTime <= currentHHMM && endTime >= currentHHMM
      // (or if dutyStatus === "available" and has any unbooked slot today)
      let availableNowCount = 0;
      for (const doc of deptDoctors) {
        if (doc.dutyStatus === "available" || !doc.dutyStatus) {
          const docSlotsToday = todayUnbookedSlots.filter(
            (s) => s.staff?.toString() === doc._id.toString()
          );

          // Check if slot covers current time or has upcoming slot today
          const activeNow = docSlotsToday.some(
            (s) => s.startTime <= currentHHMM && s.endTime >= currentHHMM
          );

          // If there is an active slot right now, or if during clinic hours doc has open slots today
          if (activeNow || docSlotsToday.length > 0) {
            availableNowCount++;
          }
        }
      }

      return {
        ...dept,
        doctorCount,
        availableNowCount,
      };
    });

    return NextResponse.json(
      { departments: departmentsWithStats },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/departments error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load departments" },
      { status: 500 }
    );
  }
}
