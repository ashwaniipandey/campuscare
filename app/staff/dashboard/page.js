"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse, Stethoscope, Calendar, Clock, CheckCircle2, Ban,
  ClipboardList, CalendarClock, AlertOctagon, LogOut, Home,
  Loader2, AlertCircle, ChevronRight, User, MessageSquare,
  RefreshCw, XCircle, FileText, Sparkles, TrendingUp, AlertTriangle,
  Search, ArrowRightLeft, UserMinus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";
import ReferralModal from "@/components/ReferralModal";
import EmergencyLeaveModal from "@/components/EmergencyLeaveModal";

// ─── constants ────────────────────────────────────────────────────────────────

const TYPE_LABELS = {
  general: "General Medicine",
  counseling: "Counseling & Wellness",
  "emergency-followup": "Emergency Follow-up",
};

const STATUS_CFG = {
  pending:   { label: "Pending",   classes: "bg-amber-50  text-amber-700  border-amber-200",  Icon: Clock },
  confirmed: { label: "Confirmed", classes: "bg-teal-50   text-teal-700   border-teal-200",   Icon: CheckCircle2 },
  cancelled: { label: "Cancelled", classes: "bg-red-50    text-red-700    border-red-200",    Icon: Ban },
  completed: { label: "Completed", classes: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2 },
};

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

function formatDateShort(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

// ─── animated counter ─────────────────────────────────────────────────────────

function AnimatedCount({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    let start = 0;
    const step = Math.ceil(value / 20);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display}</span>;
}

// ─── skeleton loader ──────────────────────────────────────────────────────────

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />;
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/80 space-y-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-10" />
        </div>
      ))}
    </div>
  );
}

function ApptSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
          <Skeleton className="h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

// ─── complete modal ───────────────────────────────────────────────────────────

function CompleteModal({ appointment, onClose, onSave }) {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/appointments/${appointment._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed", visitNotes: notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to complete");
      onSave(appointment._id, notes);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 z-10"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Complete Appointment</h3>
            <p className="text-xs text-slate-500">
              {appointment.student?.name} · {appointment.startTime}–{appointment.endTime}
            </p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1.5 mb-4">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Visit Notes <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Diagnosis, treatment given, follow-up instructions, medications prescribed…"
            className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>

        {error && (
          <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 text-slate-600">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Mark Complete
              </span>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── appointment card ─────────────────────────────────────────────────────────

function ApptCard({ appt, onAction, onComplete, onRefer, isToday }) {
  const [acting, setActing] = useState(null);
  const cfg = STATUS_CFG[appt.status] || STATUS_CFG.pending;
  const StatusIcon = cfg.Icon;

  const handleAction = async (status) => {
    setActing(status);
    await onAction(appt._id, status);
    setActing(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
          <User className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cfg.classes}`}>
              <StatusIcon className="w-3 h-3" />
              {cfg.label}
            </span>
            <span className="text-[11px] bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full">
              {TYPE_LABELS[appt.type] || appt.type}
            </span>
            {appt.department && (
              <span className="text-[11px] bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full font-semibold">
                {appt.department}
              </span>
            )}
            {appt.service && (
              <span className="text-[11px] bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-full font-semibold">
                {appt.service}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <p className="text-sm font-bold text-slate-900 truncate">
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
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
            <span>{appt.student?.email}</span>
            {appt.student?.phone && (
              <span className="flex items-center gap-1 font-medium text-teal-700 dark:text-teal-400">
                📞 {appt.student.phone}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {isToday ? "" : `${formatDateShort(appt.date)} · `}{appt.startTime}–{appt.endTime}
          </p>

          {appt.reason && (
            <p className="text-xs text-slate-400 mt-1 flex items-start gap-1 italic">
              <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
              "{appt.reason}"
            </p>
          )}

          {appt.status === "completed" && appt.visitNotes && (
            <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
              <p className="text-[11px] font-bold text-emerald-700 mb-0.5">Visit Notes</p>
              <p className="text-xs text-emerald-800 italic">{appt.visitNotes}</p>
            </div>
          )}
        </div>

        <div className="flex flex-row sm:flex-col gap-2 shrink-0">
          {appt.status === "pending" && (
            <>
              <Button
                size="sm"
                onClick={() => handleAction("confirmed")}
                disabled={!!acting}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-8 px-3"
              >
                {acting === "confirmed"
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Confirm</>}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction("cancelled")}
                disabled={!!acting}
                className="text-xs h-8 px-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
              >
                {acting === "cancelled"
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <><Ban className="w-3.5 h-3.5 mr-1" />Cancel</>}
              </Button>
            </>
          )}

          {appt.status === "confirmed" && (
            <>
              <Button
                size="sm"
                onClick={() => onComplete(appt)}
                disabled={!!acting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3"
              >
                <FileText className="w-3.5 h-3.5 mr-1" />Complete
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction("cancelled")}
                disabled={!!acting}
                className="text-xs h-8 px-3 text-rose-600 hover:bg-rose-50 border-rose-200"
              >
                {acting === "cancelled"
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

          {appt.student && onRefer && (
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => onRefer(appt)}
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
}

// ─── main dashboard ───────────────────────────────────────────────────────────

export default function StaffDashboard() {
  const { data: session } = useSession();
  const router = useRouter();

  const [data, setData] = useState(null);       // { counts, today, upcoming }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [activeEmergencyCount, setActiveEmergencyCount] = useState(0);
  const [dutyStatus, setDutyStatus] = useState("available");
  const [updatingDuty, setUpdatingDuty] = useState(false);
  const [patientSearchReg, setPatientSearchReg] = useState("");
  const [referralTarget, setReferralTarget] = useState(null);
  const [showEmergencyLeave, setShowEmergencyLeave] = useState(false);

  useEffect(() => {
    async function loadDutyStatus() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const json = await res.json();
          if (json.user?.dutyStatus) {
            setDutyStatus(json.user.dutyStatus);
          }
        }
      } catch (err) {
        console.error("Failed to fetch duty status:", err);
      }
    }
    loadDutyStatus();
  }, []);

  const handleDutyStatusChange = async (newStatus) => {
    try {
      setUpdatingDuty(true);
      const res = await fetch("/api/staff/duty-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dutyStatus: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setDutyStatus(data.dutyStatus);
      }
    } catch (err) {
      console.error("Duty status update error:", err);
    } finally {
      setUpdatingDuty(false);
    }
  };

  const intervalRef = useRef(null);

  const fetchStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      const [statsRes, emgRes] = await Promise.all([
        fetch("/api/staff/stats"),
        fetch("/api/emergencies/active"),
      ]);

      const json = await statsRes.json();
      if (!statsRes.ok) throw new Error(json.error || "Failed to load stats");
      setData(json);

      if (emgRes.ok) {
        const emgData = await emgRes.json();
        const newCount = (emgData.emergencies || []).filter((e) => e.status === "new").length;
        setActiveEmergencyCount(newCount);
      }

      setLastRefresh(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    intervalRef.current = setInterval(() => fetchStats(true), 30_000);
    return () => clearInterval(intervalRef.current);
  }, [fetchStats]);

  const handleAction = useCallback(async (apptId, status) => {
    try {
      const res = await fetch(`/api/appointments/${apptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Action failed");
      await fetchStats(true);
    } catch (e) {
      alert(e.message);
    }
  }, [fetchStats]);

  const handleCompleteSave = useCallback(async () => {
    await fetchStats(true);
  }, [fetchStats]);

  const counts = data?.counts || {};
  const todayAppts = data?.today || [];
  const upcomingAppts = data?.upcoming || [];

  const STAT_CARDS = [
    {
      label: "Today",
      key: "today",
      Icon: Calendar,
      bg: "bg-sky-50",
      text: "text-sky-600",
      border: "border-sky-100",
      desc: formatDate(getTodayStr()),
    },
    {
      label: "Pending",
      key: "pending",
      Icon: Clock,
      bg: "bg-amber-50",
      text: "text-amber-600",
      border: "border-amber-100",
      desc: "Awaiting confirmation",
    },
    {
      label: "Confirmed",
      key: "confirmed",
      Icon: CheckCircle2,
      bg: "bg-teal-50",
      text: "text-teal-600",
      border: "border-teal-100",
      desc: "Ready to see patients",
    },
    {
      label: "Completed",
      key: "completed",
      Icon: Sparkles,
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-emerald-100",
      desc: "Total visits done",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Page Action Bar ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border rounded-2xl p-3 sm:p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground mr-1 hidden sm:inline">Duty Status:</span>
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
            <button
              type="button"
              disabled={updatingDuty}
              onClick={() => handleDutyStatusChange("available")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                dutyStatus === "available"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Available</span>
            </button>
            <button
              type="button"
              disabled={updatingDuty}
              onClick={() => handleDutyStatusChange("busy")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                dutyStatus === "busy"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Busy</span>
            </button>
            <button
              type="button"
              disabled={updatingDuty}
              onClick={() => handleDutyStatusChange("off-duty")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                dutyStatus === "off-duty"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Off Duty</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="hidden sm:inline text-[11px] text-muted-foreground">
              Updated {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
            title="Refresh now"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEmergencyLeave(true)}
            className="gap-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-800"
            title="Transfer your appointments and go off-duty"
          >
            <UserMinus className="w-3.5 h-3.5" />
            <span>Emergency Leave</span>
          </Button>
        </div>
      </div>
        {/* Active Emergency Alert Banner on Staff Dashboard */}
        {activeEmergencyCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-rose-600 to-red-600 rounded-2xl p-4 text-white shadow-lg flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm">
                  {activeEmergencyCount} Active Student Emergency SOS Broadcast{activeEmergencyCount > 1 ? "s" : ""}!
                </h3>
                <p className="text-xs text-rose-100">Immediate first aid triage &amp; responder action required.</p>
              </div>
            </div>
            <Link href="/staff/emergencies">
              <Button size="sm" className="bg-white text-rose-700 hover:bg-rose-50 font-bold text-xs shrink-0">
                View &amp; Respond Now →
              </Button>
            </Link>
          </motion.div>
        )}

        {/* ── welcome banner ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-gradient-to-r from-sky-800 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden"
        >
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute -right-4 bottom-0 w-32 h-32 rounded-full bg-white/5" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-700/60 text-sky-100 text-xs font-medium mb-3 border border-sky-500/30">
                <Stethoscope className="w-3.5 h-3.5" />
                On-Duty · Health Staff Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"},{" "}
                {session?.user?.name?.split(" ")[0] || "Doctor"}!
              </h1>
              <p className="mt-1 text-sky-100 text-sm">{formatDate(getTodayStr())}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-white/15 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                {session?.user?.email}
              </span>
              {!loading && (
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                  counts.pending > 0
                    ? "bg-amber-400/20 border-amber-300/40 text-amber-100"
                    : "bg-emerald-400/20 border-emerald-300/40 text-emerald-100"
                }`}>
                  {counts.pending > 0 ? `${counts.pending} pending` : "All clear ✓"}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── stat cards ──────────────────────────────────────────────────── */}
        {loading ? <StatsSkeleton /> : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STAT_CARDS.map(({ label, key, Icon, bg, text, border, desc }, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.35 }}
                className={`bg-white rounded-2xl p-5 border ${border} shadow-xs hover:shadow-sm transition-shadow`}
              >
                <div className={`w-10 h-10 rounded-xl ${bg} ${text} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                <p className={`text-3xl font-extrabold mt-0.5 ${text}`}>
                  <AnimatedCount value={counts[key] ?? 0} />
                </p>
                <p className="text-[11px] text-slate-400 mt-1 leading-tight">{desc}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Quick Patient Record Lookup ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Patient Health Record Lookup</h3>
              <p className="text-xs text-slate-500">
                Find student medical history, previous visits, diagnostic reports, or upload new reports by Reg. Number
              </p>
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (patientSearchReg.trim()) {
                router.push(`/staff/patients?regNo=${encodeURIComponent(patientSearchReg.trim())}`);
              }
            }}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <input
              type="text"
              placeholder="e.g. STU2023001"
              value={patientSearchReg}
              onChange={(e) => setPatientSearchReg(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-teal-500 w-full sm:w-48"
            />
            <Button
              type="submit"
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-4 h-9 font-semibold shrink-0"
            >
              Lookup →
            </Button>
          </form>
        </div>

        {/* ── error ───────────────────────────────────────────────────────── */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
            <button onClick={() => fetchStats()} className="ml-auto text-xs font-semibold underline">Retry</button>
          </div>
        )}

        {/* ── today's schedule ─────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              Today's Schedule
              {!loading && (
                <span className="text-xs font-normal text-slate-400">
                  {todayAppts.length} appointment{todayAppts.length !== 1 ? "s" : ""}
                </span>
              )}
            </h2>
            <Link href="/staff/appointments" className="text-xs text-sky-600 hover:underline font-medium flex items-center gap-1">
              All appointments <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? <ApptSkeleton /> : todayAppts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 py-14 text-center space-y-2">
              <Calendar className="w-10 h-10 text-slate-200 mx-auto" />
              <p className="text-sm font-bold text-slate-500">No appointments today</p>
              <p className="text-xs text-slate-400">Your schedule is clear — enjoy your day!</p>
              <div className="pt-2">
                <Link href="/staff/availability">
                  <Button size="sm" className="bg-sky-600 hover:bg-sky-700 text-white text-xs">
                    Add Availability Slots
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppts.map((appt) => (
                <ApptCard
                  key={appt._id}
                  appt={appt}
                  isToday
                  onAction={handleAction}
                  onComplete={setCompleteTarget}
                  onRefer={(a) => setReferralTarget({ patient: a.student, appointmentId: a._id })}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── upcoming section ─────────────────────────────────────────────── */}
        {!loading && upcomingAppts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                Upcoming
                <span className="text-xs font-normal text-slate-400">
                  {upcomingAppts.length} appointment{upcomingAppts.length !== 1 ? "s" : ""}
                </span>
              </h2>
            </div>
            <div className="space-y-3">
              {upcomingAppts.map((appt) => (
                <ApptCard
                  key={appt._id}
                  appt={appt}
                  isToday={false}
                  onAction={handleAction}
                  onComplete={setCompleteTarget}
                  onRefer={(a) => setReferralTarget({ patient: a.student, appointmentId: a._id })}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── quick links ──────────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              href: "/staff/availability",
              Icon: CalendarClock,
              label: "My Availability",
              desc: "Add and manage open appointment slots",
              color: "sky",
            },
            {
              href: "/staff/appointments",
              Icon: ClipboardList,
              label: "All Appointments",
              desc: "Full list of patient appointments",
              color: "teal",
            },
            {
              href: "/staff/emergencies",
              Icon: AlertTriangle,
              label: "Emergency Dispatch",
              desc: "Monitor live campus emergency beacons",
              color: "rose",
            },
          ].map(({ href, Icon, label, desc, color }, i) => (
            <motion.div
              key={href}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07, duration: 0.35 }}
            >
              <Link href={href} className="block group">
                <div className={`bg-white rounded-2xl border border-${color}-100 p-5 hover:shadow-md transition-all hover:-translate-y-0.5 duration-200`}>
                  <div className={`w-10 h-10 rounded-xl bg-${color}-50 text-${color}-600 flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 group-hover:text-sky-700 transition-colors">{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                  <div className={`mt-3 text-xs font-semibold text-${color}-600 flex items-center gap-1`}>
                    Open <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </section>

      {/* ── complete modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {completeTarget && (
          <CompleteModal
            appointment={completeTarget}
            onClose={() => setCompleteTarget(null)}
            onSave={handleCompleteSave}
          />
        )}
      </AnimatePresence>

      {/* ── referral modal ─────────────────────────────────────────────────── */}
      {referralTarget && (
        <ReferralModal
          isOpen={!!referralTarget}
          onClose={() => setReferralTarget(null)}
          patient={referralTarget.patient}
          appointmentId={referralTarget.appointmentId}
          onSuccess={() => {
            setReferralTarget(null);
            fetchStats(true);
          }}
        />
      )}

      {/* ── emergency leave modal ─────────────────────────────────────────── */}
      {showEmergencyLeave && (
        <EmergencyLeaveModal
          isOpen={showEmergencyLeave}
          onClose={() => setShowEmergencyLeave(false)}
          currentDoctorDepartment={session?.user?.medicalDepartment}
          onSuccess={() => {
            setShowEmergencyLeave(false);
            setDutyStatus("off-duty");
            fetchStats(true);
          }}
        />
      )}
    </div>
  );
}
