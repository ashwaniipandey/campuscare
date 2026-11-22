import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { generateNextStaffId } from "@/lib/generateStaffId";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      password,
      role,
      phone,
      // Student fields
      regNo,
      department,
      year,
      gender,
      bloodGroup,
      emergencyContactName,
      emergencyContactPhone,
      // Staff fields
      medicalDepartment,
      designation,
      qualification,
    } = body;

    // Validate common required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Role validation: only allow 'student' or 'staff' from public signup
    let assignedRole = "student";
    if (role === "staff") {
      assignedRole = "staff";
    } else if (role === "student" || !role) {
      assignedRole = "student";
    } else {
      return NextResponse.json(
        { error: "Invalid role selected. Only student or staff accounts can be created." },
        { status: 400 }
      );
    }

    // Validate phone number (10 digits)
    const cleanPhone = phone ? String(phone).replace(/[\s\-]/g, "") : "";
    if (!cleanPhone || !/^\d{10}$/.test(cleanPhone)) {
      return NextResponse.json(
        { error: "Phone number is required and must be exactly 10 digits" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check duplicate email
    const normalizedEmail = email.toLowerCase().trim();
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const userData = {
      name: name.trim(),
      email: normalizedEmail,
      phone: cleanPhone,
      role: assignedRole,
    };

    if (assignedRole === "student") {
      // Validate student fields: regNo, department, year
      if (!regNo || !department || !year) {
        return NextResponse.json(
          { error: "Registration number, academic department, and year are required for students" },
          { status: 400 }
        );
      }

      const cleanRegNo = String(regNo).trim().toUpperCase();
      if (!/^[A-Z0-9]+$/i.test(cleanRegNo)) {
        return NextResponse.json(
          { error: "Registration number must be alphanumeric (letters and numbers only)" },
          { status: 400 }
        );
      }

      // Check duplicate regNo
      const existingRegNo = await User.findOne({ regNo: cleanRegNo });
      if (existingRegNo) {
        return NextResponse.json(
          { error: "An account with this registration number already exists" },
          { status: 409 }
        );
      }

      const parsedYear = parseInt(year, 10);
      if (isNaN(parsedYear) || parsedYear < 1 || parsedYear > 5) {
        return NextResponse.json(
          { error: "Year of study must be between 1 and 5" },
          { status: 400 }
        );
      }

      userData.regNo = cleanRegNo;
      userData.department = department.trim();
      userData.year = parsedYear;
      if (gender) userData.gender = gender.trim();
      if (bloodGroup) userData.bloodGroup = bloodGroup.trim();
      if (emergencyContactName) userData.emergencyContactName = emergencyContactName.trim();
      if (emergencyContactPhone) userData.emergencyContactPhone = emergencyContactPhone.trim();
    } else if (assignedRole === "staff") {
      // Validate staff fields: medicalDepartment, designation
      if (!medicalDepartment || !designation) {
        return NextResponse.json(
          { error: "Medical department and clinical designation are required for healthcare staff" },
          { status: 400 }
        );
      }

      // Auto-generate staffId
      const generatedStaffId = await generateNextStaffId();
      userData.staffId = generatedStaffId;
      userData.medicalDepartment = medicalDepartment.trim();
      userData.designation = designation.trim();
      if (qualification) userData.qualification = qualification.trim();
    }

    // Hash password with bcryptjs
    const hashedPassword = await bcrypt.hash(password, 10);
    userData.password = hashedPassword;

    // Create user in MongoDB
    const newUser = await User.create(userData);

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          phone: newUser.phone,
          regNo: newUser.regNo || null,
          department: newUser.department || null,
          staffId: newUser.staffId || null,
          medicalDepartment: newUser.medicalDepartment || null,
          designation: newUser.designation || null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "field";
      return NextResponse.json(
        { error: `An account with this ${field} already exists` },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to register user" },
      { status: 500 }
    );
  }
}
