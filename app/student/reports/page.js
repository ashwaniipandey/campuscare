"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse,
  FileText,
  Calendar,
  Clock,
  ArrowLeft,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Stethoscope,
  ExternalLink,
  X,
  Loader2,
  Activity,
  FileCheck,
  Sparkles,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";

// ─── constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "All Categories",
  "Blood Test",
  "Urine Test",
  "Typhoid Test",
  "Malaria and Dengue Test",
  "X-Ray",
  "Ultrasound",
  "Skin Report",
  "Prescription",
  "General Checkup",
  "Other",
];

const CONDITION_CONFIG = {
  normal: {
    label: "Normal",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
    dot: "bg-emerald-500",
  },
  "follow-up-needed": {
    label: "Follow-up Needed",
    bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
    dot: "bg-amber-500",
  },
  critical: {
    label: "Critical Attention",
    bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
    dot: "bg-rose-500",
  },
};

// ─── helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── reusable report card ──────────────────────────────────────────────────────

function ReportCard({ rpt, isNew, onView, onMarkViewed }) {
  const cond = CONDITION_CONFIG[rpt.condition] || CONDITION_CONFIG.normal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`bg-white dark:bg-slate-900 rounded-3xl border p-5 sm:p-6 shadow-xs transition-all relative overflow-hidden ${
        isNew
          ? "border-teal-400 dark:border-teal-700 ring-2 ring-teal-500/10"
          : "border-slate-200/80 dark:border-slate-800"
      }`}
    >
      {/* Top Badges & Date */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-xs text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 px-2.5 py-0.5 rounded-full">
            {rpt.category}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-bold border px-2.5 py-0.5 rounded-full ${cond.bg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${cond.dot}`} />
            {cond.label}
          </span>
          {isNew && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-500 text-white shadow-xs animate-pulse">
              NEW
            </span>
          )}
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
          {formatDate(rpt.reportDate)}
        </span>
      </div>

      {/* Title & Clinician */}
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
        {rpt.title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
        Attending:{" "}
        <strong>{rpt.uploadedBy?.name || "Campus Health Clinician"}</strong>
        {rpt.uploadedBy?.staffId && ` (${rpt.uploadedBy.staffId})`}
      </p>

      {/* Summary */}
      {rpt.summary && (
        <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <p className="font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
            Clinical Observations &amp; Notes
          </p>
          <p className="whitespace-pre-line">{rpt.summary}</p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
        <div className="text-[11px] text-slate-400 dark:text-slate-500">
          {rpt.hasFile ? (
            <span className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 font-medium">
              <FileCheck className="w-3.5 h-3.5" />
              Medical File Attached
            </span>
          ) : (
            <span>Text report — no file attached</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(rpt)}
            className="text-xs gap-1.5 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Eye className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>View Report</span>
          </Button>

          {rpt.hasFile && (
            <a
              href={`/api/reports/${rpt._id}/file?download=1`}
              target="_blank"
              rel="noreferrer"
              download
              onClick={() => onMarkViewed(rpt._id)}
            >
              <Button
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </Button>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── timeline report entry ─────────────────────────────────────────────────────

function TimelineReportEntry({ item, onView, onMarkViewed }) {
  const cond = CONDITION_CONFIG[item.condition] || CONDITION_CONFIG.normal;

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 sm:p-5 border border-slate-200/70 dark:border-slate-800 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${item.badgeColor}`}
          >
            {item.badge}
          </span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {formatDate(item.date)}
          </span>
        </div>
        <span
          className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${cond.bg}`}
        >
          {cond.label}
        </span>
      </div>

      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
        {item.title}
      </h4>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {item.subtitle}
      </p>

      {item.summary && (
        <div className="mt-2 p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900 text-xs text-sky-950 dark:text-sky-200">
          <p className="font-bold text-[10px] uppercase tracking-wider text-sky-700 dark:text-sky-400 mb-0.5">
            Findings &amp; Diagnostics:
          </p>
          <p className="whitespace-pre-line">{item.summary}</p>
        </div>
      )}

      <div className="pt-2 flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onView(item.reportObj)}
          className="text-xs gap-1.5 h-7 border-slate-200 dark:border-slate-700"
        >
          <Eye className="w-3 h-3 text-teal-600 dark:text-teal-400" />
          <span>View Details</span>
        </Button>
        {item.hasFile && (
          <a
            href={`/api/reports/${item.reportObj._id}/file?download=1`}
            target="_blank"
            rel="noreferrer"
            download
            onClick={() => onMarkViewed(item.reportObj._id)}
          >
            <Button
              size="sm"
              className="text-xs gap-1.5 h-7 bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Download className="w-3 h-3" />
              <span>Download</span>
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}

// ─── preview modal ─────────────────────────────────────────────────────────────

function PreviewModal({ report, onClose, onMarkViewed }) {
  const cond = CONDITION_CONFIG[report.condition] || CONDITION_CONFIG.normal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl p-6 sm:p-7 relative my-8"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {report.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {report.category} • {formatDate(report.reportDate)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Condition & Clinician */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-0.5">
                Diagnostic Condition
              </span>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-bold border px-2.5 py-0.5 rounded-full ${cond.bg}`}
              >
                {cond.label}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-0.5">
                Attending Healthcare Provider
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                {report.uploadedBy?.name || "Campus Clinician"}
                {report.uploadedBy?.staffId && ` (${report.uploadedBy.staffId})`}
              </span>
            </div>
          </div>

          {/* Summary */}
          <div>
            <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs mb-1.5 uppercase tracking-wider">
              Clinical Findings &amp; Assessment
            </h4>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line text-xs">
              {report.summary || "No specific summary entered."}
            </div>
          </div>

          {/* File section */}
          {report.hasFile ? (
            <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
                <div>
                  <p className="font-bold text-xs text-teal-900 dark:text-teal-200">
                    Official Medical Document
                  </p>
                  <p className="text-[11px] text-teal-700 dark:text-teal-400">
                    Signed document file stored in student health records
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/api/reports/${report._id}/file`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => onMarkViewed(report._id)}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5 border-teal-300 dark:border-teal-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Open in New Tab</span>
                  </Button>
                </a>
                <a
                  href={`/api/reports/${report._id}/file?download=1`}
                  target="_blank"
                  rel="noreferrer"
                  download
                  onClick={() => onMarkViewed(report._id)}
                >
                  <Button
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </Button>
                </a>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
              No physical document was uploaded. The clinician logged the diagnostic observations
              directly in text form.
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Close
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── main inner component ──────────────────────────────────────────────────────

function StudentReportsContent() {
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "new");
  const [reports, setReports] = useState([]);
  const [unviewedCount, setUnviewedCount] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Timeline filters
  const [historySearch, setHistorySearch] = useState("");
  const [historyCategory, setHistoryCategory] = useState("All Categories");

  // Preview modal — keep track of the report + whether it was pending removal from new-tab
  const [previewReport, setPreviewReport] = useState(null);
  const [previewWasNew, setPreviewWasNew] = useState(false);

  // Marks a report as viewed both on the server and in local state
  const markViewed = useCallback(async (reportId) => {
    // Optimistically update local state right away
    setReports((prev) =>
      prev.map((r) => {
        if (r._id === reportId && !r.viewedByStudentAt) {
          setUnviewedCount((c) => Math.max(0, c - 1));
          return { ...r, viewedByStudentAt: new Date().toISOString() };
        }
        return r;
      })
    );

    // Fire-and-forget server call
    try {
      await fetch(`/api/reports/${reportId}/viewed`, {
        method: "POST",
        cache: "no-store",
      });
    } catch (e) {
      // Non-critical — view is already updated locally
      console.warn("markViewed network error:", e);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [reportsRes, apptsRes] = await Promise.all([
        fetch("/api/reports/mine", { cache: "no-store" }),
        fetch("/api/appointments", { cache: "no-store" }),
      ]);

      if (reportsRes.ok) {
        const repData = await reportsRes.json();
        setReports(repData.reports || []);
        setUnviewedCount(repData.unviewedCount || 0);
      } else {
        const repData = await reportsRes.json();
        throw new Error(repData.error || "Failed to load reports");
      }

      if (apptsRes.ok) {
        const apptData = await apptsRes.json();
        setAppointments(apptData.appointments || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load health records");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open preview — mark viewed immediately (optimistic), keep modal open during view
  const handleView = useCallback(
    (rpt) => {
      const wasNew = !rpt.viewedByStudentAt;
      setPreviewReport(rpt);
      setPreviewWasNew(wasNew);
      markViewed(rpt._id);
    },
    [markViewed]
  );

  // Close preview — if report was new, the card will animate-out because
  // local state already has viewedByStudentAt set.
  const handleClosePreview = useCallback(() => {
    setPreviewReport(null);
    setPreviewWasNew(false);
  }, []);

  // ── derived data ────────────────────────────────────────────────────────────

  const newReports = reports.filter((r) => !r.viewedByStudentAt);

  // History: all reports (viewed + unviewed) + completed appointments, newest first
  const timelineItems = [
    ...appointments
      .filter((a) => a.status === "completed")
      .map((a) => ({
        id: `appt-${a._id}`,
        type: "appointment",
        date: a.date,
        title: a.service || `${a.department || "Medical"} Consultation`,
        subtitle: `Dr. ${a.staff?.name || "Staff Clinician"} (${a.staff?.staffId || "Staff"})`,
        badge: "Clinic Visit",
        badgeColor:
          "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
        reason: a.reason,
        notes: a.visitNotes,
      })),
    ...reports.map((r) => ({
      id: `report-${r._id}`,
      type: "report",
      date: r.reportDate,
      title: r.title,
      subtitle: `${r.category} • ${r.uploadedBy?.name || "Clinic Staff"}`,
      badge: r.category,
      badgeColor:
        "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
      condition: r.condition,
      summary: r.summary,
      hasFile: r.hasFile,
      category: r.category,
      reportObj: r,
    })),
  ].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  // Apply timeline filters
  const filteredTimeline = timelineItems.filter((item) => {
    const q = historySearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.title?.toLowerCase().includes(q) ||
      item.subtitle?.toLowerCase().includes(q) ||
      item.summary?.toLowerCase().includes(q) ||
      item.notes?.toLowerCase().includes(q);

    const matchesCategory =
      historyCategory === "All Categories" ||
      item.type === "appointment" ||
      item.category === historyCategory;

    return matchesSearch && matchesCategory;
  });

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground leading-none">
              My Health Records &amp; Reports
            </h1>
            {unviewedCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-teal-600 text-white">
                {unviewedCount} new
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Diagnostic lab reports, clinical findings, and visit history
          </p>
        </div>

        <Link href="/student/appointments">
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            <span>Appointments</span>
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 mb-6 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("new")}
            className={`pb-3 px-1 mr-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "new"
                ? "border-teal-600 text-teal-700 dark:text-teal-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>New Reports</span>
            {unviewedCount > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === "new"
                    ? "bg-teal-600 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                }`}
              >
                {unviewedCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`pb-3 px-1 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "history"
                ? "border-teal-600 text-teal-700 dark:text-teal-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Health History</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              ({timelineItems.length})
            </span>
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            <p className="text-xs text-slate-500">Loading your health records…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── TAB 1: NEW REPORTS ─────────────────────────────────────────── */}
        {!loading && activeTab === "new" && (
          <div className="space-y-4">
            {newReports.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 space-y-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    No new reports
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto mt-1">
                    All your past reports are in Health History. New diagnostic reports from campus
                    health staff will appear here automatically.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("history")}
                  className="text-xs gap-1.5 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Go to Health History</span>
                </Button>
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                {newReports.map((rpt) => (
                  <ReportCard
                    key={rpt._id}
                    rpt={rpt}
                    isNew={true}
                    onView={handleView}
                    onMarkViewed={markViewed}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        )}

        {/* ── TAB 2: HEALTH HISTORY TIMELINE ───────────────────────────── */}
        {!loading && activeTab === "history" && (
          <div className="space-y-6">
            {/* Search & filter bar */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search by test name, findings, doctor, or visit reason…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {historySearch && (
                  <button
                    type="button"
                    onClick={() => setHistorySearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
                <select
                  value={historyCategory}
                  onChange={(e) => setHistoryCategory(e.target.value)}
                  aria-label="Filter by category"
                  className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredTimeline.length === 0 ? (
              <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 space-y-2">
                <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                  {timelineItems.length === 0
                    ? "No health history recorded yet"
                    : "No items match your search"}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                  {timelineItems.length === 0
                    ? "Completed clinic visits and filed diagnostic reports will appear here."
                    : "Try adjusting your search or category filter."}
                </p>
                {timelineItems.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHistorySearch("");
                      setHistoryCategory("All Categories");
                    }}
                    className="text-xs mt-2"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
                <div className="mb-6">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Unified Health Timeline
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Chronological record of all clinic visits, diagnostic tests, and clinical notes
                  </p>
                </div>

                <div className="relative pl-6 sm:pl-8 border-l-2 border-teal-200 dark:border-teal-900/60 space-y-8">
                  {filteredTimeline.map((item) => (
                    <div key={item.id} className="relative">
                      {/* Node icon */}
                      <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-7 h-7 rounded-full bg-white dark:bg-slate-900 border-2 border-teal-500 flex items-center justify-center shadow-xs">
                        {item.type === "appointment" ? (
                          <Stethoscope className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                        )}
                      </div>

                      {item.type === "appointment" ? (
                        /* ── appointment card ── */
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 sm:p-5 border border-slate-200/70 dark:border-slate-800 space-y-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                            >
                              {item.badge}
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {formatDate(item.date)}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {item.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {item.subtitle}
                          </p>
                          {item.reason && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                              Reason: &ldquo;{item.reason}&rdquo;
                            </p>
                          )}
                          {item.notes && (
                            <div className="mt-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 text-xs text-emerald-950 dark:text-emerald-200">
                              <p className="font-bold text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-0.5">
                                Clinician Visit Notes:
                              </p>
                              <p className="whitespace-pre-line">{item.notes}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* ── report entry ── */
                        <TimelineReportEntry
                          item={item}
                          onView={handleView}
                          onMarkViewed={markViewed}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewReport && (
          <PreviewModal
            report={previewReport}
            onClose={handleClosePreview}
            onMarkViewed={markViewed}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── page export ───────────────────────────────────────────────────────────────

export default function StudentReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      }
    >
      <StudentReportsContent />
    </Suspense>
  );
}
