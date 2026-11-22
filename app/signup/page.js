"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import {
  HeartPulse,
  User,
  Mail,
  Lock,
  Phone,
  GraduationCap,
  Stethoscope,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Eye,
  EyeOff,
  Building2,
  Calendar,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    document.title = "Create Account | CampusCare";
  }, []);

  const [role, setRole] = useState("student"); // student or staff
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Student specific
  const [regNo, setRegNo] = useState("");
  const [department, setDepartment] = useState("CSE");
  const [year, setYear] = useState("1");

  // Staff specific
  const [medicalDepartment, setMedicalDepartment] = useState("General Medicine");
  const [designation, setDesignation] = useState("Doctor");
  const [qualification, setQualification] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredStaff, setRegisteredStaff] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !phone) {
      setError("Please fill in all required fields.");
      return;
    }

    // Phone validation (10 digits)
    const cleanPhone = phone.replace(/[\s\-]/g, "");
    if (!/^\d{10}$/.test(cleanPhone)) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Role-specific validation
    if (role === "student") {
      if (!regNo.trim()) {
        setError("Registration number is required for students.");
        return;
      }
      if (!/^[A-Z0-9]+$/i.test(regNo.trim())) {
        setError("Registration number must be alphanumeric (letters and numbers only).");
        return;
      }
    } else if (role === "staff") {
      if (!medicalDepartment || !designation.trim()) {
        setError("Medical department and designation are required for staff.");
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: cleanPhone,
        password,
        role,
        ...(role === "student"
          ? {
              regNo: regNo.trim().toUpperCase(),
              department,
              year: parseInt(year, 10),
            }
          : {
              medicalDepartment,
              designation: designation.trim(),
              qualification: qualification.trim(),
            }),
      };

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account.");
        setLoading(false);
        return;
      }

      // Auto sign-in right after registration
      const loginRes = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password,
      });

      if (role === "staff") {
        // Show auto-generated staffId confirmation card
        setRegisteredStaff({
          name: data.user.name,
          staffId: data.user.staffId,
        });
        setLoading(false);
      } else {
        if (!loginRes?.error) {
          router.push("/student/dashboard");
        } else {
          router.push("/login?registered=true");
        }
        router.refresh();
      }
    } catch (err) {
      setError("Network or server error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 group mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform duration-200">
            <HeartPulse className="w-7 h-7" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-foreground group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
            CampusCare
          </span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-foreground tracking-tight">
          Create an Account
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-muted-foreground">
          Join CampusCare for clinic visits, wellness appointments & emergency response
        </p>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0"
      >
        <div className="bg-white dark:bg-card py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/60 dark:shadow-none rounded-3xl border border-slate-200/80 dark:border-border">
          {registeredStaff ? (
            /* Staff ID Confirmation View */
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Registration Successful!</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Welcome to the CampusCare Healthcare Team, <strong>{registeredStaff.name}</strong>.
                </p>
              </div>

              <div className="p-6 bg-gradient-to-br from-teal-50 to-sky-50 border-2 border-teal-200 rounded-3xl max-w-sm mx-auto shadow-inner">
                <p className="text-xs uppercase font-extrabold tracking-wider text-teal-700">
                  Your Official Staff ID
                </p>
                <p className="text-4xl font-black font-mono text-teal-900 tracking-wider my-2">
                  {registeredStaff.staffId}
                </p>
                <p className="text-[11px] text-teal-800">
                  Please save this ID. It is shown on patient appointments and clinical charts.
                </p>
              </div>

              <Button
                onClick={() => {
                  router.push("/staff/dashboard");
                  router.refresh();
                }}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold h-12 rounded-xl text-sm"
              >
                Go to Staff Dashboard →
              </Button>
            </div>
          ) : (
            <>
              {/* Error Alert */}
              {error && (
                <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Role Selector Cards */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    I am registering as:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole("student")}
                      className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        role === "student"
                          ? "border-teal-600 bg-teal-50/70 ring-2 ring-teal-500/30 shadow-xs"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            role === "student" ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        {role === "student" && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Student</p>
                        <p className="text-[10px] text-slate-500">Book visits & trigger emergency SOS</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole("staff")}
                      className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        role === "staff"
                          ? "border-teal-600 bg-teal-50/70 ring-2 ring-teal-500/30 shadow-xs"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            role === "staff" ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          <Stethoscope className="w-4 h-4" />
                        </div>
                        {role === "staff" && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Health Staff</p>
                        <p className="text-[10px] text-slate-500">Manage slots & respond to emergencies</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={role === "staff" ? "Dr. Jane Smith, MD" : "Jane Doe"}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={role === "staff" ? "doctor@university.edu" : "student@university.edu"}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Phone Contact */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Phone Number (10 Digits)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="9876543210"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* STUDENT-SPECIFIC FIELDS */}
                {role === "student" && (
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Registration Number
                        </label>
                        <input
                          type="text"
                          required
                          value={regNo}
                          onChange={(e) => setRegNo(e.target.value.toUpperCase())}
                          placeholder="e.g. 2023CSE012"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Academic Department
                        </label>
                        <select
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          {ACADEMIC_DEPTS.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Year of Study
                      </label>
                      <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
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
                )}

                {/* STAFF-SPECIFIC FIELDS */}
                {role === "staff" && (
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Medical Department
                        </label>
                        <select
                          value={medicalDepartment}
                          onChange={(e) => setMedicalDepartment(e.target.value)}
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
                          required
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          placeholder="Doctor, Nurse, Counselor..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Qualification <span className="font-normal text-slate-400">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        placeholder="e.g. MBBS, MD, B.Sc Nursing"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <p className="text-[11px] text-teal-700 font-medium">
                      * Your unique Staff ID (e.g. DOC-0001) will be automatically generated upon signup.
                    </p>
                  </div>
                )}

                {/* Password & Confirm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold h-11 rounded-xl shadow-md shadow-teal-600/20 text-xs flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span>Creating Account...</span>
                    ) : (
                      <>
                        <span>Complete Registration</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {/* Sign In Prompt */}
              <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
                Already registered with CampusCare?{" "}
                <Link href="/login" className="font-bold text-teal-600 hover:text-teal-700">
                  Sign In here
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
