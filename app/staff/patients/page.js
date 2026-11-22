"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse,
  Search,
  User,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  FileText,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Download,
  Eye,
  X,
  Upload,
  Building2,
  Heart,
  ShieldAlert,
  ArrowRightLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import ReferralModal from "@/components/ReferralModal";

const CATEGORIES = [
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
  normal: { label: "Normal", bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800" },
  "follow-up-needed": { label: "Follow-up Needed", bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800" },
  critical: { label: "Critical", bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800" },
};

function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function StaffPatientsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [queryRegNo, setQueryRegNo] = useState(searchParams.get("regNo") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [patientData, setPatientData] = useState(null);

  // Active Tab: "reports" or "history"
  const [activeTab, setActiveTab] = useState("reports");

  // Add Report Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReferModalOpen, setIsReferModalOpen] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportError, setReportError] = useState("");

  const [reportForm, setReportForm] = useState({
    category: "General Checkup",
    title: "",
    summary: "",
    condition: "normal",
    reportDate: getTodayStr(),
    file: null,
  });

  // Preview Modal state
  const [previewReport, setPreviewReport] = useState(null);

  useEffect(() => {
    const reg = searchParams.get("regNo");
    if (reg) {
      setQueryRegNo(reg);
      handleSearch(reg);
    }
    if (searchParams.get("addReport") === "true") {
      setIsAddModalOpen(true);
    }
  }, [searchParams]);

  const handleSearch = async (regToSearch) => {
    const targetReg = (regToSearch || queryRegNo).trim();
    if (!targetReg) return;

    setLoading(true);
    setError("");
    setPatientData(null);

    try {
      const res = await fetch(`/api/patients/lookup?regNo=${encodeURIComponent(targetReg)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Student not found");
      setPatientData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    if (!patientData?.student?._id) return;
    if (!reportForm.title.trim()) {
      setReportError("Report title is required.");
      return;
    }

    setSubmittingReport(true);
    setReportError("");

    try {
      const formData = new FormData();
      formData.append("studentId", patientData.student._id);
      formData.append("category", reportForm.category);
      formData.append("title", reportForm.title.trim());
      formData.append("summary", reportForm.summary.trim());
      formData.append("condition", reportForm.condition);
      formData.append("reportDate", reportForm.reportDate);
      if (reportForm.file) {
        formData.append("file", reportForm.file);
      }

      const res = await fetch("/api/reports", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload report");

      // Reset form & close modal
      setIsAddModalOpen(false);
      setReportForm({
        category: "General Checkup",
        title: "",
        summary: "",
        condition: "normal",
        reportDate: getTodayStr(),
        file: null,
      });

      // Refresh patient records
      await handleSearch(patientData.student.regNo);
      setActiveTab("reports");
    } catch (err) {
      setReportError(err.message);
    } finally {
      setSubmittingReport(false);
    }
  };

  const student = patientData?.student;
  const appointments = patientData?.appointments || [];
  const reports = patientData?.reports || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Patient Directory &amp; Records</h1>
          <p className="text-xs text-muted-foreground">Search students, view clinical history &amp; upload reports</p>
        </div>
        <Link href="/staff/appointments">
          <Button variant="outline" size="sm" className="text-xs">
            Appointments
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row items-center gap-3"
          >
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={queryRegNo}
                onChange={(e) => setQueryRegNo(e.target.value.toUpperCase())}
                placeholder="Enter Student Registration Number (e.g. STU2023001, 2023CSE012)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !queryRegNo.trim()}
              className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs h-10 px-6 rounded-xl flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching…</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Lookup Patient</span>
                </>
              )}
            </Button>
          </form>

          {/* Quick Demo Shortcuts */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
            <span>Quick Lookup Examples:</span>
            {["STU2023001", "STU2023002", "STU2023003", "STU2023004"].map((demoReg) => (
              <button
                key={demoReg}
                type="button"
                onClick={() => {
                  setQueryRegNo(demoReg);
                  handleSearch(demoReg);
                }}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 font-mono font-semibold transition-colors"
              >
                {demoReg}
              </button>
            ))}
          </div>
        </div>

        {/* Error Callout */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Patient Profile & Tabs Section */}
        {student && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Patient Summary Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-sky-500 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-sm">
                    {student.name.substring(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold text-slate-900">{student.name}</h2>
                      <span className="font-mono text-xs font-bold bg-teal-50 text-teal-800 px-2 py-0.5 rounded-md border border-teal-200">
                        {student.regNo}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>Dept: {student.department} (Year {student.year})</span>
                      <span>·</span>
                      <span>{student.email}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    onClick={() => setIsReferModalOpen(true)}
                    variant="outline"
                    className="text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 font-bold text-xs h-10 px-4 rounded-xl gap-2 shadow-xs"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>Refer Patient</span>
                  </Button>

                  <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs h-10 px-4 rounded-xl gap-2 shadow-xs"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add Medical Report</span>
                  </Button>
                </div>
              </div>

              {/* Vitals & Demographics Row */}
              <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Phone</span>
                  <span className="font-semibold text-slate-800">{student.phone || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Blood Group</span>
                  <span className="font-semibold text-slate-800">{student.bloodGroup || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Emergency Contact</span>
                  <span className="font-semibold text-slate-800">
                    {student.emergencyContactName || "Parent / Guardian"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Emergency Phone</span>
                  <span className="font-semibold text-slate-800">
                    {student.emergencyContactPhone ? (
                      <a href={`tel:${student.emergencyContactPhone}`} className="text-teal-700 underline">
                        {student.emergencyContactPhone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab("reports")}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "reports"
                    ? "border-teal-600 text-teal-700 dark:text-teal-400"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Medical Reports ({reports.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "history"
                    ? "border-teal-600 text-teal-700 dark:text-teal-400"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Visit History ({appointments.length})</span>
              </button>
            </div>

            {/* TAB 1: REPORTS LIST */}
            {activeTab === "reports" && (
              <div className="space-y-3">
                {reports.length === 0 ? (
                  <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 space-y-3">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="font-bold text-slate-700">No medical reports filed for this patient</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Diagnostic tests, lab results, X-rays and clinician prescriptions will appear here.
                    </p>
                    <Button
                      onClick={() => setIsAddModalOpen(true)}
                      size="sm"
                      className="bg-teal-600 text-white text-xs mt-2"
                    >
                      Upload First Report
                    </Button>
                  </div>
                ) : (
                  reports.map((rpt) => {
                    const cond = CONDITION_CONFIG[rpt.condition] || CONDITION_CONFIG.normal;

                    return (
                      <div
                        key={rpt._id}
                        className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-bold text-xs text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                              {rpt.category}
                            </span>
                            <span className={`text-[11px] font-bold border px-2.5 py-0.5 rounded-full ${cond.bg}`}>
                              {cond.label}
                            </span>
                            <span className="text-xs text-slate-400">
                              {rpt.reportDate}
                            </span>
                          </div>

                          <h3 className="font-bold text-sm text-slate-900 mt-1">{rpt.title}</h3>
                          {rpt.summary && (
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                              {rpt.summary}
                            </p>
                          )}

                          <p className="text-[11px] text-slate-400 mt-2">
                            Uploaded by {rpt.uploadedBy?.name || "Clinic Staff"} ({rpt.uploadedBy?.staffId || "Staff"})
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {rpt.hasFile ? (
                            <>
                              <a
                                href={`/api/reports/${rpt._id}/file`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
                              >
                                <Eye className="w-3.5 h-3.5 text-teal-600" />
                                <span>View File</span>
                              </a>
                              <a
                                href={`/api/reports/${rpt._id}/file?download=1`}
                                download
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                              </a>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic px-2">No file attachment</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: VISIT HISTORY */}
            {activeTab === "history" && (
              <div className="space-y-3">
                {appointments.length === 0 ? (
                  <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 space-y-2">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">No appointments recorded for this student</p>
                  </div>
                ) : (
                  appointments.map((appt) => (
                    <div
                      key={appt._id}
                      className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{appt.date}</span>
                          <span className="text-xs text-slate-500">
                            {appt.startTime} – {appt.endTime}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full uppercase font-extrabold bg-slate-100 text-slate-700">
                            {appt.status}
                          </span>
                        </div>
                        <span className="text-xs text-teal-700 font-semibold">
                          Clinician: {appt.staff?.name} ({appt.staff?.staffId || "Staff"})
                        </span>
                      </div>

                      {appt.service && (
                        <p className="text-xs text-sky-700 font-semibold">
                          Service: {appt.service} {appt.department ? `(${appt.department})` : ""}
                        </p>
                      )}

                      {appt.reason && (
                        <p className="text-xs text-slate-600 italic">
                          Reason: "{appt.reason}"
                        </p>
                      )}

                      {appt.visitNotes && (
                        <div className="mt-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-950">
                          <p className="font-bold text-[11px] text-emerald-800 uppercase tracking-wider mb-0.5">
                            Clinical Visit Notes:
                          </p>
                          <p className="whitespace-pre-line">{appt.visitNotes}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Empty State before search */}
        {!loading && !patientData && !error && (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-200/80 p-8 space-y-3">
            <User className="w-14 h-14 text-slate-300 mx-auto" />
            <h2 className="text-base font-bold text-slate-700">Student Patient Search</h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Search by university registration number to review clinical history, emergency contacts, previous test reports, or upload new diagnostic files.
            </p>
          </div>
        )}

      {/* ADD REPORT MODAL */}
      <AnimatePresence>
        {isAddModalOpen && student && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 sm:p-7 relative my-8"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Add Medical Report</h3>
                  <p className="text-xs text-slate-500">
                    Patient: <strong>{student.name}</strong> ({student.regNo})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {reportError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{reportError}</span>
                </div>
              )}

              <form onSubmit={handleCreateReport} className="space-y-4 text-xs">
                {/* Category & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Report Category
                    </label>
                    <select
                      value={reportForm.category}
                      onChange={(e) => setReportForm({ ...reportForm, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Report Date
                    </label>
                    <input
                      type="date"
                      value={reportForm.reportDate}
                      onChange={(e) => setReportForm({ ...reportForm, reportDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Report Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={reportForm.title}
                    onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                    placeholder="e.g. Complete Blood Count (CBC), Chest X-Ray AP View…"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Condition Badge */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Clinical Assessment / Condition
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "normal", label: "Normal", color: "emerald" },
                      { value: "follow-up-needed", label: "Follow-up", color: "amber" },
                      { value: "critical", label: "Critical", color: "rose" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setReportForm({ ...reportForm, condition: opt.value })}
                        className={`py-2 px-2 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                          reportForm.condition === opt.value
                            ? "border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-200"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Findings Summary */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Clinical Findings &amp; Summary
                  </label>
                  <textarea
                    rows={4}
                    value={reportForm.summary}
                    onChange={(e) => setReportForm({ ...reportForm, summary: e.target.value })}
                    placeholder="Key observations, diagnostic numbers, normal limits, prescriptions given…"
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  />
                </div>

                {/* File Attachment */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Document File <span className="font-normal text-slate-400">(optional, PDF, JPG, PNG up to 4MB)</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setReportForm({ ...reportForm, file });
                    }}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                  />
                  {reportForm.file && (
                    <p className="text-[11px] text-teal-700 mt-1">
                      Selected: {reportForm.file.name} ({(reportForm.file.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddModalOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submittingReport}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs gap-2"
                  >
                    {submittingReport ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading Report…</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Upload &amp; File Report</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {isReferModalOpen && student && (
        <ReferralModal
          isOpen={isReferModalOpen}
          onClose={() => setIsReferModalOpen(false)}
          patient={student}
          onSuccess={() => {
            setIsReferModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default function StaffPatientsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      }
    >
      <StaffPatientsContent />
    </Suspense>
  );
}
