"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  HeartPulse, Calendar, Clock, Stethoscope, ArrowLeft,
  Loader2, AlertCircle, CheckCircle2, XCircle, Ban,
  ClockIcon, User, MessageSquare, FileText, ArrowRightLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import ReferralModal from "@/components/ReferralModal";

const STATUS_CONFIG = {
  pending: { label: "Pending Review", icon: ClockIcon, classes: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confirmed", icon: CheckCircle2, classes: "bg-teal-50 text-teal-700 border-teal-200" },
  cancelled: { label: "Cancelled", icon: Ban, classes: "bg-red-50 text-red-700 border-red-200" },
  completed: { label: "Completed", icon: CheckCircle2, classes: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const TYPE_LABELS = {
  general: "General Medicine",
  counseling: "Counseling & Wellness",
  "emergency-followup": "Emergency Follow-up",
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

export default function StaffAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(null);
  const [referralTarget, setReferralTarget] = useState(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setAppointments(data.appointments || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const handleUpdate = async (id, status) => {
    setUpdating(id + status);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      setAppointments((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status } : a))
      );
    } catch (e) {
      alert(e.message);
    } finally {
      setUpdating(null);
    }
  };

  const active = appointments.filter((a) => !["cancelled", "completed"].includes(a.status));
  const past = appointments.filter((a) => ["cancelled", "completed"].includes(a.status));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Patient Appointments</h1>
          <p className="text-xs text-muted-foreground">Review and manage assigned appointments</p>
        </div>
        <Link href="/staff/availability">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5" />
            My Slots
          </Button>
        </Link>
      </div>

      <div className="space-y-8">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-sky-500" />
            <p className="text-sm">Loading appointments…</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-center gap-3 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
            <button onClick={fetchAppointments} className="ml-auto text-xs font-semibold underline">Retry</button>
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-2xl border border-slate-200/80 space-y-2">
            <Calendar className="w-12 h-12 text-slate-200 mx-auto" />
            <h3 className="text-base font-bold text-slate-500">No appointments yet</h3>
            <p className="text-xs text-slate-400">Students will appear here once they book your slots</p>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Active Appointments ({active.length})
                </h2>
                <div className="space-y-3">
                  {active.map((appt) => {
                    const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending;
                    const StatusIcon = cfg.icon;
                    return (
                      <motion.div
                        key={appt._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                          <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                            <User className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.classes}`}>
                                <StatusIcon className="w-3 h-3" />
                                {cfg.label}
                              </span>
                              <span className="text-[11px] bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full">
                                {TYPE_LABELS[appt.type] || appt.type}
                              </span>
                              {appt.department && (
                                <span className="text-[11px] bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 px-2 py-0.5 rounded-full font-semibold">
                                  {appt.department}
                                </span>
                              )}
                              {appt.service && (
                                <span className="text-[11px] bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 px-2 py-0.5 rounded-full font-semibold">
                                  {appt.service}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mb-0.5">
                              <p className="text-sm font-bold text-slate-900">
                                {appt.student?.name}
                              </p>
                              {appt.student?.regNo && (
                                <span className="font-mono text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 px-1.5 py-0.2 rounded border border-teal-200 dark:border-teal-800">
                                  {appt.student.regNo}
                                </span>
                              )}
                              {appt.student?.department && (
                                <span className="text-[10px] text-slate-500 font-medium">
                                  ({appt.student.department})
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 mb-1">
                              <span>{appt.student?.email}</span>
                              {appt.student?.phone && (
                                <span className="flex items-center gap-1 font-medium text-teal-700 dark:text-teal-400">
                                  📞 {appt.student.phone}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {formatDate(appt.date)} · {appt.startTime}–{appt.endTime}
                            </p>
                            {appt.reason && (
                              <p className="text-xs text-slate-400 mt-1 flex items-start gap-1 italic">
                                <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                                "{appt.reason}"
                              </p>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 shrink-0 flex-wrap sm:flex-col items-start">
                            {appt.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdate(appt._id, "confirmed")}
                                  disabled={!!updating}
                                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-8 px-3"
                                >
                                  {updating === appt._id + "confirmed"
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Confirm</>}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdate(appt._id, "cancelled")}
                                  disabled={!!updating}
                                  className="text-xs h-8 px-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                                >
                                  {updating === appt._id + "cancelled"
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <><Ban className="w-3.5 h-3.5 mr-1" />Cancel</>}
                                </Button>
                              </>
                            )}

                            {appt.status === "confirmed" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdate(appt._id, "completed")}
                                  disabled={!!updating}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3"
                                >
                                  {updating === appt._id + "completed"
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Mark Complete</>}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdate(appt._id, "cancelled")}
                                  disabled={!!updating}
                                  className="text-xs h-8 px-3 text-rose-600 hover:bg-rose-50 border-rose-200"
                                >
                                  {updating === appt._id + "cancelled"
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <><Ban className="w-3.5 h-3.5 mr-1" />Cancel</>}
                                </Button>
                              </>
                            )}

                            {appt.student?.regNo && (
                              <Link href={`/staff/patients?regNo=${encodeURIComponent(appt.student.regNo)}&addReport=true`}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-8 px-2.5 text-teal-700 border-teal-300 hover:bg-teal-50"
                                  title="Add medical report for this student"
                                >
                                  <FileText className="w-3.5 h-3.5 mr-1" />
                                  <span>Add Report</span>
                                </Button>
                              </Link>
                            )}

                            {appt.student && (
                              <Button
                                size="sm"
                                variant="outline"
                                type="button"
                                onClick={() => setReferralTarget({ patient: appt.student, appointmentId: appt._id })}
                                className="text-xs h-8 px-2.5 text-sky-700 hover:bg-sky-50 border-sky-300"
                                title="Refer patient to another doctor"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />
                                <span>Refer</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Past Appointments ({past.length})
                </h2>
                <div className="space-y-2">
                  {past.map((appt) => {
                    const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.completed;
                    const StatusIcon = cfg.icon;
                    return (
                      <div key={appt._id} className="bg-white rounded-2xl border border-slate-100 px-5 py-4 flex items-center gap-4 opacity-60">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">{appt.student?.name}</p>
                          <p className="text-xs text-slate-400">{formatDate(appt.date)} · {appt.startTime}–{appt.endTime}</p>
                        </div>
                        <span className={`ml-auto text-[11px] font-bold px-2.5 py-1 rounded-full border ${cfg.classes}`}>
                          {cfg.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {referralTarget && (
        <ReferralModal
          isOpen={!!referralTarget}
          onClose={() => setReferralTarget(null)}
          patient={referralTarget.patient}
          appointmentId={referralTarget.appointmentId}
          onSuccess={() => {
            setReferralTarget(null);
            fetchAppointments();
          }}
        />
      )}
    </div>
  );
}
