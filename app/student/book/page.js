"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse,
  ClipboardList,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Calendar,
  Stethoscope,
  Sparkles,
  FlaskConical,
  Scan,
  HeartHandshake,
  Smile,
  Ear,
  AlertTriangle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  FileText,
  Building2,
  Award,
  Check,
  Star,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { DEPARTMENTS } from "@/lib/departments";

const ICON_MAP = {
  Stethoscope,
  Sparkles,
  FlaskConical,
  Scan,
  HeartHandshake,
  Smile,
  Ear,
  AlertTriangle,
};

function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return "";
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getInitials(name) {
  if (!name) return "DR";
  return name
    .split(" ")
    .filter((p) => !["dr.", "dr", "nurse", "md", "do", "np"].includes(p.toLowerCase()))
    .map((p) => p[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "DR";
}

function BookAppointmentContent({ onOpenReviews }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Wizard Step: 1 = Department, 2 = Doctor, 3 = Service & Slot, 4 = Review & Confirm
  const [currentStep, setCurrentStep] = useState(1);

  // Student Profile Completeness
  const [profileLoading, setProfileLoading] = useState(true);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);

  // Data states
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);

  const [selectedDept, setSelectedDept] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [reason, setReason] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState("");
  const [bookedAppointment, setBookedAppointment] = useState(null);

  // Doctor Reviews Modal State — lifted to outer BookAppointmentPage via prop
  // handleOpenDoctorReviews is passed in as onOpenReviews prop

  // 1. Check Student Profile
  useEffect(() => {
    async function checkProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          const u = data.user;
          if (!u?.regNo || !u?.phone || !u?.department) {
            setIsProfileIncomplete(true);
          }
        }
      } catch (err) {
        console.error("Profile check error:", err);
      } finally {
        setProfileLoading(false);
      }
    }

    if (session?.user) {
      checkProfile();
    }
  }, [session]);

  // 2. Fetch Departments with live counts
  useEffect(() => {
    async function fetchDepartments() {
      try {
        setLoadingDepts(true);
        const res = await fetch("/api/departments");
        if (res.ok) {
          const data = await res.json();
          setDepartments(data.departments || []);
        } else {
          setDepartments(DEPARTMENTS);
        }
      } catch (err) {
        console.error("Failed to load departments:", err);
        setDepartments(DEPARTMENTS);
      } finally {
        setLoadingDepts(false);
      }
    }

    fetchDepartments();
  }, []);

  // 3. Fetch Doctors when Department is selected
  useEffect(() => {
    if (!selectedDept) return;

    async function fetchDoctors() {
      try {
        setLoadingDoctors(true);
        const res = await fetch(`/api/doctors?department=${encodeURIComponent(selectedDept.key)}`);
        if (res.ok) {
          const data = await res.json();
          setDoctors(data.doctors || []);
        } else {
          setDoctors([]);
        }
      } catch (err) {
        console.error("Failed to load doctors:", err);
        setDoctors([]);
      } finally {
        setLoadingDoctors(false);
      }
    }

    fetchDoctors();
  }, [selectedDept]);

  // 4. Fetch Slots when Doctor and Date are selected
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) return;

    async function fetchDoctorSlots() {
      try {
        setLoadingSlots(true);
        setSelectedSlot(null);
        const res = await fetch(`/api/doctors/${selectedDoctor._id}/slots?date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          setSlots(data.slots || []);
        } else {
          setSlots([]);
        }
      } catch (err) {
        console.error("Failed to load doctor slots:", err);
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchDoctorSlots();
  }, [selectedDoctor, selectedDate]);

  // Handle Booking Submission
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedSlot || !selectedDoctor) return;

    setBooking(true);
    setBookError("");

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availabilityId: selectedSlot._id,
          doctorId: selectedDoctor._id,
          department: selectedDept?.name || selectedDoctor.medicalDepartment,
          service: selectedService || selectedDept?.services?.[0] || "General Consultation",
          reason: reason.trim(),
          type: "general",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");

      setBookedAppointment(data.appointment);
    } catch (err) {
      setBookError(err.message);
    } finally {
      setBooking(false);
    }
  };

  // Step 1: Select Department
  const handleSelectDepartment = (dept) => {
    setSelectedDept(dept);
    setSelectedDoctor(null);
    setSelectedService(dept.services?.[0] || "");
    setCurrentStep(2);
  };

  // Step 2: Select Doctor
  const handleSelectDoctor = (doc) => {
    setSelectedDoctor(doc);
    setSelectedSlot(null);
    setCurrentStep(3);
  };

  // Step 3: Proceed to Review
  const handleProceedToReview = () => {
    if (!selectedSlot) return;
    setCurrentStep(4);
  };

  const STEPS = [
    { number: 1, label: "Department" },
    { number: 2, label: "Doctor" },
    { number: 3, label: "Service & Slot" },
    { number: 4, label: "Confirm" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Book Medical Appointment</h1>
          <p className="text-xs text-muted-foreground">4-Step Campus Doctor Scheduling</p>
        </div>
        <Link href="/student/appointments">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <ClipboardList className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">My Appointments</span>
          </Button>
        </Link>
      </div>
        {/* Profile Incomplete Guard */}
        {!profileLoading && isProfileIncomplete ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 bg-white rounded-3xl border border-amber-300 shadow-sm text-center max-w-xl mx-auto my-12 space-y-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Profile Completion Required</h2>
            <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
              To book clinic appointments and register your medical records with university clinicians,
              please complete your student profile with your <strong>Registration Number</strong>, <strong>Academic Department</strong>, and <strong>Phone Number</strong>.
            </p>
            <div className="pt-2">
              <Link href="/profile">
                <Button className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-2 rounded-xl text-xs gap-2">
                  <span>Complete Profile Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        ) : bookedAppointment ? (
          /* SUCCESS SCREEN */
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-emerald-200 p-8 sm:p-10 shadow-lg text-center max-w-lg mx-auto my-8"
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Appointment Requested!</h2>
            <p className="text-xs text-slate-600 mt-1">
              Your appointment request is saved with status <strong>Pending</strong>. Staff will review and confirm.
            </p>

            {/* Appointment Recap Card */}
            <div className="my-6 p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 text-left text-xs space-y-2.5">
              <div className="flex justify-between items-center pb-2 border-b border-emerald-200/50">
                <span className="font-semibold text-emerald-900">Department:</span>
                <span className="font-bold text-emerald-950">{bookedAppointment.department || selectedDept?.name}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-emerald-200/50">
                <span className="font-semibold text-emerald-900">Clinical Service:</span>
                <span className="font-bold text-emerald-950">{bookedAppointment.service || selectedService}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-emerald-200/50">
                <span className="font-semibold text-emerald-900">Doctor:</span>
                <span className="font-bold text-emerald-950">
                  {bookedAppointment.staff?.name || selectedDoctor?.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-emerald-900">Date &amp; Time:</span>
                <span className="font-bold text-emerald-950">
                  {formatDateDisplay(bookedAppointment.date)} ({bookedAppointment.startTime} – {bookedAppointment.endTime})
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/student/appointments" className="w-full sm:w-auto">
                <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs h-11 px-5 rounded-xl">
                  View My Appointments
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  setBookedAppointment(null);
                  setSelectedDoctor(null);
                  setSelectedSlot(null);
                  setReason("");
                  setCurrentStep(1);
                }}
                className="w-full sm:w-auto text-xs h-11 px-5 rounded-xl"
              >
                Book Another Appointment
              </Button>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Progress Bar Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                {STEPS.map((s) => {
                  const isDone = currentStep > s.number;
                  const isCurrent = currentStep === s.number;
                  return (
                    <div
                      key={s.number}
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => {
                        if (s.number < currentStep) setCurrentStep(s.number);
                      }}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                          isDone
                            ? "bg-teal-600 text-white"
                            : isCurrent
                            ? "bg-teal-600 text-white ring-4 ring-teal-100 dark:ring-teal-950"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                        }`}
                      >
                        {isDone ? <Check className="w-3.5 h-3.5" /> : s.number}
                      </div>
                      <span
                        className={`hidden sm:inline text-xs font-semibold ${
                          isCurrent
                            ? "text-teal-700 dark:text-teal-400 font-bold"
                            : isDone
                            ? "text-slate-700 dark:text-slate-300"
                            : "text-slate-400"
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-teal-600 h-full transition-all duration-300"
                  style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                />
              </div>
            </div>

            {/* Wizard Steps with AnimatePresence */}
            <AnimatePresence mode="wait">
              {/* STEP 1: Medical Department Selection */}
              {currentStep === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Select Medical Department</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Choose the clinical specialty for your symptoms or scheduled consultation
                    </p>
                  </div>

                  {loadingDepts ? (
                    <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
                      <Loader2 className="w-7 h-7 animate-spin text-teal-600" />
                      <p className="text-xs">Loading campus medical departments…</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {departments.map((dept) => {
                        const IconComponent = ICON_MAP[dept.icon] || Stethoscope;
                        const isSelected = selectedDept?.key === dept.key;

                        return (
                          <motion.button
                            key={dept.key}
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSelectDepartment(dept)}
                            className={`p-5 rounded-3xl border text-left flex flex-col justify-between transition-all cursor-pointer h-full ${
                              isSelected
                                ? "border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 shadow-sm ring-2 ring-teal-300"
                                : "border-slate-200/80 bg-white hover:border-teal-300 hover:bg-slate-50/80 shadow-xs"
                            }`}
                          >
                            <div>
                              <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center mb-3">
                                <IconComponent className="w-5 h-5" />
                              </div>
                              <h3 className="font-bold text-sm text-slate-900 mb-1">{dept.name}</h3>
                              <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">
                                {dept.description}
                              </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                              <span className="text-slate-600 font-medium">
                                {dept.doctorCount || 0} {dept.doctorCount === 1 ? "Doctor" : "Doctors"}
                              </span>
                              {dept.availableNowCount > 0 ? (
                                <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                  {dept.availableNowCount} available now
                                </span>
                              ) : (
                                <span className="text-slate-400">Next slots open</span>
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 2: Doctor Selection */}
              {currentStep === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 dark:text-teal-400 mb-0.5">
                        <span>Department:</span>
                        <span className="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/60 rounded-md border border-teal-200 dark:border-teal-800">
                          {selectedDept?.name}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900">Choose a Doctor</h2>
                      <p className="text-xs text-slate-500">
                        View live on-duty status and upcoming slot availability
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentStep(1)}
                      className="text-xs gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Change Department</span>
                    </Button>
                  </div>

                  {loadingDoctors ? (
                    <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
                      <Loader2 className="w-7 h-7 animate-spin text-teal-600" />
                      <p className="text-xs">Finding clinicians in {selectedDept?.name}…</p>
                    </div>
                  ) : doctors.length === 0 ? (
                    <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 space-y-3">
                      <Stethoscope className="w-12 h-12 text-slate-300 mx-auto" />
                      <h3 className="font-bold text-slate-700">No doctors listed in this department yet</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        There are currently no staff clinicians assigned to {selectedDept?.name}. Please select another department.
                      </p>
                      <Button onClick={() => setCurrentStep(1)} size="sm" className="bg-teal-600 text-white text-xs mt-2">
                        Pick Another Department
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {doctors.map((doc) => {
                        const isAvailableNow = doc.availabilityLabel === "available-now";
                        const isOffDuty = doc.availabilityLabel === "off-duty";
                        const isNextSlot = doc.availabilityLabel === "next-slot";
                        const isNoSlots = doc.availabilityLabel === "no-slots";

                        return (
                          <div
                            key={doc._id}
                            className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between hover:border-teal-300 transition-all"
                          >
                            <div className="flex items-start gap-4 mb-4">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-teal-500 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                                {getInitials(doc.name)}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-bold text-sm text-slate-900 truncate">{doc.name}</h3>
                                  {doc.staffId && (
                                    <span className="font-mono text-[10px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 px-1.5 py-0.2 rounded border border-sky-200 dark:border-sky-800">
                                      {doc.staffId}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-600 font-medium">{doc.designation}</p>
                                {doc.qualification && (
                                  <p className="text-[11px] text-slate-400">{doc.qualification}</p>
                                )}
                              </div>
                            </div>

                            {/* Rating and Reviews Link */}
                            <div className="flex items-center justify-between text-xs my-2.5 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                              {doc.reviewCount > 0 ? (
                                <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                                  <div className="flex items-center text-amber-500">
                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 mr-1" />
                                    <span>{doc.avgRating}</span>
                                  </div>
                                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                    ({doc.reviewCount})
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                                  <Star className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                                  <span>No reviews yet</span>
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onOpenReviews(doc);
                                }}
                                className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold underline text-[11px] cursor-pointer z-10 relative"
                              >
                                Reviews
                              </button>
                            </div>

                            {/* Availability Badge Row */}
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                              <div>
                                {isAvailableNow && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Available now
                                  </span>
                                )}

                                {isNextSlot && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                                    <Clock className="w-3 h-3 text-sky-600" />
                                    Next: {doc.nextSlot?.label || "Slot Open"}
                                  </span>
                                )}

                                {isOffDuty && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                                    Off duty
                                  </span>
                                )}

                                {isNoSlots && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                    No slots listed
                                  </span>
                                )}
                              </div>

                              <Button
                                size="sm"
                                onClick={() => handleSelectDoctor(doc)}
                                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs h-8 px-4 rounded-xl"
                              >
                                Select
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 3: Choose Service & Pick Free Slot */}
              {currentStep === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Select Service &amp; Time Slot</h2>
                      <p className="text-xs text-slate-500">
                        Doctor: <strong>{selectedDoctor?.name}</strong> ({selectedDoctor?.staffId})
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentStep(2)}
                      className="text-xs gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Change Doctor</span>
                    </Button>
                  </div>

                  {/* 1. Service Selection Chips */}
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      1. Choose Clinical Service / Reason:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedDept?.services?.map((svc) => {
                        const isChosen = selectedService === svc;
                        return (
                          <button
                            key={svc}
                            type="button"
                            onClick={() => setSelectedService(svc)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              isChosen
                                ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {svc}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Date Selection & Free Slot Chips */}
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        2. Pick Appointment Date:
                      </label>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <input
                          type="date"
                          min={getTodayStr()}
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <span className="text-xs text-slate-500 font-medium">
                          {formatDateDisplay(selectedDate)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                        3. Available Time Slots with {selectedDoctor?.name}:
                      </label>

                      {loadingSlots ? (
                        <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-400">
                          <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                          <span>Checking slot schedule…</span>
                        </div>
                      ) : slots.length === 0 ? (
                        <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-200/60 p-4">
                          <Clock className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                          <p className="text-xs font-bold text-slate-600">No open slots on {formatDateDisplay(selectedDate)}</p>
                          <p className="text-[11px] text-slate-400">Try choosing another date above.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {slots.map((slot) => {
                            const isChosen = selectedSlot?._id === slot._id;
                            return (
                              <button
                                key={slot._id}
                                type="button"
                                onClick={() => setSelectedSlot(slot)}
                                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                                  isChosen
                                    ? "bg-teal-600 text-white border-teal-600 font-bold shadow-xs ring-2 ring-teal-300"
                                    : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 text-xs font-medium"
                                }`}
                              >
                                <span>{slot.startTime} – {slot.endTime}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-end">
                      <Button
                        type="button"
                        disabled={!selectedSlot}
                        onClick={handleProceedToReview}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs h-11 px-6 rounded-xl gap-2 disabled:opacity-40"
                      >
                        <span>Review &amp; Confirm Booking</span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Review Summary & Confirm */}
              {currentStep === 4 && (
                <motion.div
                  key="step-4"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6 max-w-2xl mx-auto"
                >
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Review Booking Summary</h2>
                    <p className="text-xs text-slate-500">
                      Please confirm your appointment details before finalizing
                    </p>
                  </div>

                  <form onSubmit={handleConfirmBooking} className="space-y-5">
                    {/* Summary Card */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
                      <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Department</p>
                          <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedDept?.name}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Clinical Service</p>
                          <p className="text-sm font-bold text-teal-700 dark:text-teal-400 mt-0.5">{selectedService}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Doctor</p>
                          <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedDoctor?.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{selectedDoctor?.staffId}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date &amp; Time</p>
                          <p className="text-sm font-bold text-slate-900 mt-0.5">{formatDateDisplay(selectedDate)}</p>
                          <p className="text-xs text-slate-600 font-semibold">{selectedSlot?.startTime} – {selectedSlot?.endTime}</p>
                        </div>
                      </div>

                      {/* Reason / Symptoms Textarea */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Brief Reason / Symptoms <span className="font-normal text-slate-400">(optional)</span>
                        </label>
                        <textarea
                          rows={3}
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Describe your current symptoms, condition duration or special requests…"
                          className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                        />
                      </div>

                      {bookError && (
                        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>{bookError}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(3)}
                        className="text-xs gap-1.5 h-11 px-5 rounded-xl"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                      </Button>

                      <Button
                        type="submit"
                        disabled={booking}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs h-11 px-8 rounded-xl shadow-md shadow-teal-600/20 flex items-center gap-2"
                      >
                        {booking ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Confirming Appointment…</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Confirm &amp; Book Appointment</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
    </div>
  );
}

// ─── Doctor Reviews Modal (Portal) ───────────────────────────────────────────
// Rendered via createPortal into document.body to escape any ancestor
// transform/overflow that would trap fixed positioning (Framer Motion stacking context).

function DoctorReviewsModal({ doc, data, loading, error, onClose }) {
  // Escape key handler
  useEffect(() => {
    if (!doc) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [doc, onClose]);

  if (!doc) return null;
  if (typeof document === "undefined") return null; // SSR guard

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ isolation: "isolate" }}
    >
      {/* Backdrop — click to close */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close reviews"
      />

      {/* Modal panel */}
      <div
        className="relative z-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
                {doc.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {doc.designation}
                {doc.medicalDepartment ? ` · ${doc.medicalDepartment}` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {loading ? (
            /* Loading skeleton */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 grid grid-cols-12 gap-4">
                <div className="col-span-5 flex flex-col items-center gap-2">
                  <div className="h-10 w-16 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                  <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
                <div className="col-span-7 flex flex-col justify-center gap-2">
                  {[5, 4, 3, 2, 1].map((n) => (
                    <div key={n} className="flex items-center gap-2">
                      <div className="w-5 h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="py-8 flex flex-col items-center gap-3 text-center">
              <AlertCircle className="w-8 h-8 text-rose-500" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Could not load reviews</p>
              <p className="text-xs text-slate-400">{error}</p>
            </div>
          ) : data ? (
            <>
              {/* Rating summary + distribution */}
              <div className="grid grid-cols-12 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="col-span-5 flex flex-col items-center justify-center text-center py-1 border-r border-slate-200 dark:border-slate-700">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white leading-none">
                    {data.averageRating > 0 ? data.averageRating : "—"}
                  </span>
                  <div className="flex items-center my-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= Math.round(data.averageRating || 0)
                            ? "fill-amber-400 text-amber-500"
                            : "text-slate-300 dark:text-slate-600"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {data.reviewCount === 0
                      ? "No reviews yet"
                      : `${data.reviewCount} ${data.reviewCount === 1 ? "review" : "reviews"}`}
                  </span>
                </div>

                <div className="col-span-7 flex flex-col justify-center space-y-1.5 pl-3">
                  {[5, 4, 3, 2, 1].map((ratingNum) => {
                    const count = data.distribution?.[ratingNum] || 0;
                    const pct = data.reviewCount > 0
                      ? Math.round((count / data.reviewCount) * 100)
                      : 0;
                    return (
                      <div key={ratingNum} className="flex items-center gap-2 text-xs">
                        <span className="w-5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                          {ratingNum}★
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-5 text-[10px] text-right text-slate-400 font-mono shrink-0">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reviews list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Patient Feedback
                  {data.reviews?.length > 0 && ` (${data.reviews.length})`}
                </h4>

                {data.reviewCount === 0 ? (
                  <div className="py-10 text-center space-y-2">
                    <Star className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto" />
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No reviews yet</p>
                    <p className="text-xs text-slate-400">Be the first to leave a review after your visit.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {data.reviews.map((rev) => (
                      <div
                        key={rev._id}
                        className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                            {rev.studentName}
                          </span>
                          <div className="flex items-center shrink-0">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${
                                  s <= rev.rating
                                    ? "fill-amber-400 text-amber-500"
                                    : "text-slate-200 dark:text-slate-700"
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {rev.comment ? (
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            &ldquo;{rev.comment}&rdquo;
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">No written comment</p>
                        )}

                        <p className="text-[10px] text-slate-400">
                          {new Date(rev.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onClose}
            className="text-xs"
          >
            Close
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function BookAppointmentPage() {
  const [reviewDoctorModal, setReviewDoctorModal] = useState(null);
  const [doctorReviewsLoading, setDoctorReviewsLoading] = useState(false);
  const [doctorReviewsData, setDoctorReviewsData] = useState(null);
  const [doctorReviewsError, setDoctorReviewsError] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpenReviews = async (doc) => {
    setReviewDoctorModal(doc);
    setDoctorReviewsLoading(true);
    setDoctorReviewsData(null);
    setDoctorReviewsError(null);

    try {
      const res = await fetch(`/api/doctors/${doc._id}/reviews`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setDoctorReviewsData(json);
    } catch (err) {
      console.error("[Reviews] Failed to load reviews for", doc.name, err);
      setDoctorReviewsError(err.message || "Failed to load reviews");
    } finally {
      setDoctorReviewsLoading(false);
    }
  };

  const handleCloseReviews = () => {
    setReviewDoctorModal(null);
    setDoctorReviewsData(null);
    setDoctorReviewsError(null);
  };

  return (
    <>
      <Suspense
        fallback={
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <p className="text-xs">Loading appointment scheduler…</p>
            </div>
          </div>
        }
      >
        <BookAppointmentContent onOpenReviews={handleOpenReviews} />
      </Suspense>

      {/* Portal-rendered modal — lives outside all transform ancestors */}
      {mounted && (
        <DoctorReviewsModal
          doc={reviewDoctorModal}
          data={doctorReviewsData}
          loading={doctorReviewsLoading}
          error={doctorReviewsError}
          onClose={handleCloseReviews}
        />
      )}
    </>
  );
}
