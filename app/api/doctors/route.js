import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Availability from "@/models/Availability";
import Review from "@/models/Review";
import { getDepartmentByKey, getDepartmentByName } from "@/lib/departments";

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

function formatNextSlotLabel(dateStr, timeStr) {
  const today = getTodayStr();
  const d = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(d.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

  if (dateStr === today) {
    return `Today at ${timeStr}`;
  } else if (dateStr === tomorrowStr) {
    return `Tomorrow at ${timeStr}`;
  } else {
    try {
      const parsed = new Date(dateStr + "T00:00:00");
      const dayName = parsed.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      return `${dayName} at ${timeStr}`;
    } catch {
      return `${dateStr} at ${timeStr}`;
    }
  }
}

// GET /api/doctors?department=KEY
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const departmentKey = searchParams.get("department");

    await dbConnect();

    let dept = null;
    let query = { role: "staff" };

    if (departmentKey) {
      dept = getDepartmentByKey(departmentKey) || getDepartmentByName(departmentKey);
      if (dept) {
        query.medicalDepartment = dept.name;
      }
    }

    const todayStr = getTodayStr();
    const currentHHMM = getCurrentHHMM();

    const doctors = await User.find(query)
      .select("_id name staffId designation qualification dutyStatus medicalDepartment email phone")
      .lean();

    // Aggregate reviews for all doctors
    const doctorIds = doctors.map((d) => d._id);
    const reviewStats = await Review.aggregate([
      { $match: { doctor: { $in: doctorIds } } },
      {
        $group: {
          _id: "$doctor",
          avgRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    const statsMap = {};
    reviewStats.forEach((s) => {
      statsMap[s._id.toString()] = {
        avgRating: Number(s.avgRating.toFixed(1)),
        reviewCount: s.reviewCount,
      };
    });

    // For each doctor, compute availability label, next slot, and review stats
    const doctorsWithAvailability = await Promise.all(
      doctors.map(async (doc) => {
        const dutyStatus = doc.dutyStatus || "available";

        // Query unbooked slots from today onwards
        const unbookedSlots = await Availability.find({
          staff: doc._id,
          isBooked: false,
          date: { $gte: todayStr },
        })
          .sort({ date: 1, startTime: 1 })
          .lean();

        let availabilityLabel = "no-slots";
        let nextSlotInfo = null;

        // Check if an unbooked slot today covers the current time
        const slotCoveringNow = unbookedSlots.find(
          (s) => s.date === todayStr && s.startTime <= currentHHMM && s.endTime >= currentHHMM
        );

        if (dutyStatus === "off-duty") {
          availabilityLabel = "off-duty";
        } else if (slotCoveringNow && dutyStatus === "available") {
          availabilityLabel = "available-now";
          nextSlotInfo = {
            date: slotCoveringNow.date,
            startTime: slotCoveringNow.startTime,
            endTime: slotCoveringNow.endTime,
            label: "Available right now",
          };
        } else {
          // Look for next unbooked slot
          const upcomingSlot = unbookedSlots.find((s) => {
            if (s.date === todayStr) {
              return s.endTime > currentHHMM;
            }
            return s.date > todayStr;
          });

          if (upcomingSlot) {
            availabilityLabel = "next-slot";
            nextSlotInfo = {
              date: upcomingSlot.date,
              startTime: upcomingSlot.startTime,
              endTime: upcomingSlot.endTime,
              label: formatNextSlotLabel(upcomingSlot.date, upcomingSlot.startTime),
            };
          } else {
            availabilityLabel = "no-slots";
          }
        }

        const idStr = doc._id.toString();
        const docRatingStats = statsMap[idStr] || { avgRating: 0, reviewCount: 0 };

        return {
          _id: idStr,
          name: doc.name,
          staffId: doc.staffId || null,
          designation: doc.designation || "Healthcare Professional",
          qualification: doc.qualification || "",
          medicalDepartment: doc.medicalDepartment || "",
          dutyStatus,
          availabilityLabel,
          nextSlot: nextSlotInfo,
          avgRating: docRatingStats.avgRating,
          reviewCount: docRatingStats.reviewCount,
        };
      })
    );

    return NextResponse.json(
      {
        department: dept ? dept.name : "All Departments",
        doctors: doctorsWithAvailability,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/doctors error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load doctors" },
      { status: 500 }
    );
  }
}
