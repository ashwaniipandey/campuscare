"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  HeartPulse, User, Calendar, AlertTriangle, Clock,
  LogOut, Home, ShieldCheck, Activity, PlusCircle, ClipboardList,
  UserCircle, ArrowRight, FileText, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EmergencyModal from "@/components/EmergencyModal";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";

export default function StudentDashboard() {
  const { data: session } = useSession();
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [reportsInfo, setReportsInfo] = useState({ total: 0, unviewed: 0 });

  useEffect(() => {
    async function checkProfile() {
      try {
        const [profRes, repRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/reports/mine"),
        ]);
        if (profRes.ok) {
          const data = await profRes.json();
          setProfile(data.user);
        }
        if (repRes.ok) {
          const rData = await repRes.json();
          setReportsInfo({
            total: (rData.reports || []).length,
            unviewed: rData.unviewedCount || 0,
          });
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setProfileLoading(false);
      }
    }
    if (session?.user) {
      checkProfile();
    }
  }, [session]);

  const isProfileIncomplete =
    !profileLoading &&
    profile &&
    (!profile.regNo || !profile.phone || !profile.department);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="bg-gradient-to-r from-teal-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden"
        >
          <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-600/60 text-teal-100 text-xs font-medium mb-3 border border-teal-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Student Health Account</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome back, {session?.user?.name || "Student"}!
              </h1>
              <p className="mt-1.5 text-teal-100 text-sm max-w-xl">
                Your campus health portal is ready. Book clinic appointments and track your health visits.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="teal" className="bg-white text-teal-900 font-bold px-3 py-1.5 text-xs">Role: Student</Badge>
              <span className="text-xs text-teal-200">{session?.user?.email}</span>
            </div>
          </div>
        </motion.div>

        {/* Profile Completion Warning Banner */}
        {isProfileIncomplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-amber-950 dark:text-amber-100">
                  Complete your profile to book appointments
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5">
                  Your student record is missing registration number, department, or phone number.
                </p>
              </div>
            </div>
            <Link href="/profile" className="shrink-0">
              <Button
                size="sm"
                className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5"
              >
                <span>Complete Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0"><Activity className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Campus Clinic Status</p>
              <p className="text-base font-bold text-slate-900">Open &amp; On-Duty</p>
              <p className="text-[11px] text-teal-600">Main Health Hall B</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0"><AlertTriangle className="w-6 h-6 animate-pulse" /></div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Emergency SOS Response</p>
              <p className="text-base font-bold text-slate-900">24/7 Dispatch Ready</p>
              <p className="text-[11px] text-rose-600">Live GPS telemetry enabled</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0"><Clock className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Clinic Hours</p>
              <p className="text-base font-bold text-slate-900">Mon–Fri 8AM–8PM</p>
              <p className="text-[11px] text-sky-600">Sat–Sun 10AM–4PM</p>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
          {/* Book Appointment */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
            className="bg-white rounded-3xl p-6 border border-teal-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                <PlusCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Book Appointment</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Browse available slots from campus doctors and book your clinic visit with one click.
              </p>
            </div>
            <Link href="/student/book" className="mt-5">
              <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">Browse &amp; Book Slots →</Button>
            </Link>
          </motion.div>

          {/* My Appointments */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}
            className="bg-white rounded-3xl p-6 border border-sky-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
                <ClipboardList className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">My Appointments</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                View your upcoming and past clinic appointments with status and cancel if needed.
              </p>
            </div>
            <Link href="/student/appointments" className="mt-5">
              <Button variant="outline" className="w-full border-sky-300 text-sky-700 hover:bg-sky-50">View My Appointments →</Button>
            </Link>
          </motion.div>

          {/* Medical Reports */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-indigo-200/80 dark:border-indigo-900 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                {reportsInfo.unviewed > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-600 text-white shadow-xs animate-pulse">
                    {reportsInfo.unviewed} NEW
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Medical Reports</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {reportsInfo.unviewed > 0
                  ? `${reportsInfo.unviewed} new ${reportsInfo.unviewed === 1 ? "report" : "reports"} from campus health staff. Click to view.`
                  : "View lab results, clinical findings, prescriptions, and your complete health history."}
              </p>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                  {reportsInfo.total} {reportsInfo.total === 1 ? "report" : "reports"} on file
                </span>
                {reportsInfo.unviewed === 0 && reportsInfo.total > 0 && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    All caught up
                  </span>
                )}
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <Link href={reportsInfo.unviewed > 0 ? "/student/reports?tab=new" : "/student/reports?tab=history"}>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-semibold text-xs">
                  {reportsInfo.unviewed > 0 ? `View ${reportsInfo.unviewed} New ${reportsInfo.unviewed === 1 ? "Report" : "Reports"} →` : "View Health History →"}
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Emergency SOS */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }}
            className="bg-white rounded-3xl p-6 border border-rose-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Emergency SOS</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Trigger one-touch emergency medical dispatch with GPS coordinates and live responder tracking.
              </p>
            </div>
            <div className="mt-5">
              <Button
                variant="emergency"
                onClick={() => setIsEmergencyOpen(true)}
                className="w-full font-bold"
              >
                Trigger Emergency SOS →
              </Button>
            </div>
          </motion.div>
        </div>

      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />
    </div>
  );
}
