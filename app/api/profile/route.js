import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

// GET /api/profile - Fetch current logged-in user's profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(session.user.id).select("-password").lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load profile" },
      { status: 500 }
    );
  }
}

// PATCH /api/profile - Update current logged-in user's profile
export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      phone,
      regNo, // Only allowed if user has no regNo yet
      department,
      year,
      gender,
      bloodGroup,
      emergencyContactName,
      emergencyContactPhone,
      medicalDepartment,
      designation,
      qualification,
    } = body;

    await dbConnect();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update name
    if (name && typeof name === "string") {
      user.name = name.trim();
    }

    // Validate and update phone
    if (phone !== undefined) {
      const cleanPhone = String(phone).replace(/[\s\-]/g, "");
      if (cleanPhone) {
        if (!/^\d{10}$/.test(cleanPhone)) {
          return NextResponse.json(
            { error: "Phone number must be exactly 10 digits" },
            { status: 400 }
          );
        }
        user.phone = cleanPhone;
      }
    }

    // Role-specific updates
    if (user.role === "student") {
      // If student previously had no regNo and is providing one now, validate and set it
      if (!user.regNo && regNo) {
        const cleanRegNo = String(regNo).trim().toUpperCase();
        if (!/^[A-Z0-9]+$/i.test(cleanRegNo)) {
          return NextResponse.json(
            { error: "Registration number must be alphanumeric (letters and numbers only)" },
            { status: 400 }
          );
        }
        const existing = await User.findOne({ regNo: cleanRegNo, _id: { $ne: user._id } });
        if (existing) {
          return NextResponse.json(
            { error: "An account with this registration number already exists" },
            { status: 409 }
          );
        }
        user.regNo = cleanRegNo;
      }

      if (department !== undefined) {
        user.department = String(department).trim();
      }
      if (year !== undefined) {
        const pYear = parseInt(year, 10);
        if (!isNaN(pYear) && pYear >= 1 && pYear <= 5) {
          user.year = pYear;
        }
      }
      if (gender !== undefined) user.gender = String(gender).trim();
      if (bloodGroup !== undefined) user.bloodGroup = String(bloodGroup).trim();
      if (emergencyContactName !== undefined) user.emergencyContactName = String(emergencyContactName).trim();
      if (emergencyContactPhone !== undefined) user.emergencyContactPhone = String(emergencyContactPhone).trim();
    } else if (user.role === "staff") {
      if (medicalDepartment !== undefined) {
        user.medicalDepartment = String(medicalDepartment).trim();
      }
      if (designation !== undefined) {
        user.designation = String(designation).trim();
      }
      if (qualification !== undefined) {
        user.qualification = String(qualification).trim();
      }
    }

    await user.save();

    const sanitizedUser = await User.findById(user._id).select("-password").lean();

    return NextResponse.json(
      {
        message: "Profile updated successfully",
        user: sanitizedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/profile error:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A unique constraint conflict occurred while updating profile" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
