"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Stethoscope,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Building2,
  Calendar,
  Heart,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

const ACADEMIC_DEPTS = ["CSE", "ECE", "ME", "Civil", "MBA", "Other"];
const MEDICAL_DEPTS = [
  "General Medicine",
  "Dermatology (Skin)",
  "Pathology Lab",
  "Radiology (X-Ray)",
  "Counseling",
  "Dental",
  "ENT",
  "Emergency",
  "Other",
];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];
const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    role: "student",
    phone: "",
    regNo: "",
    department: "",
    year: 1,
    gender: "",
    bloodGroup: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    staffId: "",
    medicalDepartment: "",
    designation: "",
    qualification: "",
  });

  // Track if regNo was already set in DB (read-only if set)
  const [hasExistingRegNo, setHasExistingRegNo] = useState(false);

  useEffect(() => {
    document.title = "My Profile | CampusCare";
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/profile");
    } else if (status === "authenticated") {
      fetchProfile();
    }
  }, [status]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load profile");

      const u = data.user;
      setUserData({
        name: u.name || "",
        email: u.email || "",
        role: u.role || "student",
        phone: u.phone || "",
        regNo: u.regNo || "",
        department: u.department || "CSE",
        year: u.year || 1,
        gender: u.gender || "",
        bloodGroup: u.bloodGroup || "",
        emergencyContactName: u.emergencyContactName || "",
        emergencyContactPhone: u.emergencyContactPhone || "",
        staffId: u.staffId || "",
        medicalDepartment: u.medicalDepartment || "General Medicine",
        designation: u.designation || "",
        qualification: u.qualification || "",
      });

      if (u.regNo) {
        setHasExistingRegNo(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!userData.name.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    if (userData.phone) {
      const cleanPhone = userData.phone.replace(/[\s\-]/g, "");
      if (!/^\d{10}$/.test(cleanPhone)) {
        setError("Phone number must be exactly 10 digits.");
        return;
      }
    }

    try {
      setSaving(true);
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      setSuccess("Profile updated successfully!");
      if (data.user?.regNo) {
        setHasExistingRegNo(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <p className="text-sm font-medium">Loading profile details...</p>
        </div>
      </div>
    );
  }

  const isStudent = userData.role === "student";
  const isStaff = userData.role === "staff";
  const isAdmin = userData.role === "admin";

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation / Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={
              isStaff
                ? "/staff/dashboard"
                : isAdmin
                ? "/admin/dashboard"
                : "/student/dashboard"
            }
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-teal-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <span className="text-xs text-slate-400">Account ID: {session?.user?.id?.substring(0, 8)}...</span>
        </div>

        {/* Profile Card Summary Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs mb-8"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Avatar Initials */}
            <div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-md ${
                isStaff
                  ? "bg-gradient-to-tr from-sky-600 to-teal-500"
                  : isAdmin
                  ? "bg-gradient-to-tr from-indigo-700 to-teal-600"
                  : "bg-gradient-to-tr from-teal-600 to-emerald-500"
              }`}
            >
              {getInitials(userData.name)}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1.5">
                <h1 className="text-2xl font-extrabold text-slate-900">{userData.name}</h1>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border ${
                    isStaff
                      ? "bg-sky-50 text-sky-700 border-sky-200"
                      : isAdmin
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : "bg-teal-50 text-teal-700 border-teal-200"
                  }`}
                >
                  {isStaff ? (
                    <Stethoscope className="w-3 h-3" />
                  ) : isAdmin ? (
                    <ShieldCheck className="w-3 h-3" />
                  ) : (
                    <GraduationCap className="w-3 h-3" />
                  )}
                  {userData.role}
                </span>
              </div>

              {/* Badges / Quick Identifiers */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {userData.email}
                </span>

                {isStudent && userData.regNo && (
                  <span className="flex items-center gap-1.5 font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                    Reg No: {userData.regNo}
                  </span>
                )}

                {isStaff && userData.staffId && (
                  <span className="flex items-center gap-1.5 font-mono font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">
                    Staff ID: {userData.staffId}
                  </span>
                )}

                {isStudent && userData.department && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    Dept: {userData.department} {userData.year ? `(Year ${userData.year})` : ""}
                  </span>
                )}

                {isStaff && userData.medicalDepartment && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {userData.medicalDepartment}
                  </span>
                )}

                {userData.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {userData.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Notifications */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Edit Profile Form */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Account Core Details */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-teal-600" />
              <span>Core Profile Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={userData.name}
                  onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Read-only
                  </span>
                </label>
                <input
                  type="email"
                  disabled
                  value={userData.email}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100/80 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone Number (10 Digits)
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={userData.phone}
                  onChange={(e) =>
                    setUserData({ ...userData, phone: e.target.value.replace(/\D/g, "") })
                  }
                  placeholder="e.g. 9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Registration Number or Staff ID */}
              {isStudent && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Registration Number</span>
                    {hasExistingRegNo && (
                      <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Read-only
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    disabled={hasExistingRegNo}
                    value={userData.regNo}
                    onChange={(e) =>
                      setUserData({ ...userData, regNo: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. 2023CSE012"
                    className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs uppercase font-mono ${
                      hasExistingRegNo
                        ? "bg-slate-100/80 text-slate-500 cursor-not-allowed"
                        : "bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    }`}
                  />
                  {!hasExistingRegNo && (
                    <p className="text-[10px] text-teal-700 mt-1">
                      Set your university registration number to complete your profile.
                    </p>
                  )}
                </div>
              )}

              {isStaff && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Staff ID</span>
                    <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Read-only
                    </span>
                  </label>
                  <input
                    type="text"
                    disabled
                    value={userData.staffId || "Auto-assigned"}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100/80 text-xs text-slate-500 font-mono cursor-not-allowed"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Student Academic & Health Info */}
          {isStudent && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-teal-600" />
                <span>Academic & Emergency Contact Details</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Academic Department
                  </label>
                  <select
                    value={userData.department}
                    onChange={(e) => setUserData({ ...userData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {ACADEMIC_DEPTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Year of Study
                  </label>
                  <select
                    value={userData.year}
                    onChange={(e) =>
                      setUserData({ ...userData, year: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="1">Year 1 (Freshman)</option>
                    <option value="2">Year 2 (Sophomore)</option>
                    <option value="3">Year 3 (Junior)</option>
                    <option value="4">Year 4 (Senior)</option>
                    <option value="5">Year 5 (Graduate / Final)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Gender
                  </label>
                  <select
                    value={userData.gender}
                    onChange={(e) => setUserData({ ...userData, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select Gender (Optional)</option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Blood Group
                  </label>
                  <select
                    value={userData.bloodGroup}
                    onChange={(e) => setUserData({ ...userData, bloodGroup: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select Blood Group (Optional)</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    value={userData.emergencyContactName}
                    onChange={(e) =>
                      setUserData({ ...userData, emergencyContactName: e.target.value })
                    }
                    placeholder="Parent / Guardian Name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={userData.emergencyContactPhone}
                    onChange={(e) =>
                      setUserData({
                        ...userData,
                        emergencyContactPhone: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    placeholder="10 digit phone number"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Staff Clinical Details */}
          {isStaff && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-sky-600" />
                <span>Clinical Practice Details</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Medical Department
                  </label>
                  <select
                    value={userData.medicalDepartment}
                    onChange={(e) =>
                      setUserData({ ...userData, medicalDepartment: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {MEDICAL_DEPTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Clinical Designation
                  </label>
                  <input
                    type="text"
                    value={userData.designation}
                    onChange={(e) => setUserData({ ...userData, designation: e.target.value })}
                    placeholder="Doctor, Nurse, Counselor..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Qualifications & Degrees
                </label>
                <input
                  type="text"
                  value={userData.qualification}
                  onChange={(e) => setUserData({ ...userData, qualification: e.target.value })}
                  placeholder="e.g. MBBS, MD (General Medicine), Fellowship in Emergency Care"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 h-11 rounded-xl shadow-md shadow-teal-600/20 text-xs flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Profile Updates</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
