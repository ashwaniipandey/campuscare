"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  AlertCircle,
  FileText,
  User,
  Clock,
  Download,
  Eye,
  Upload,
  Shield,
  FileCheck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ACTION_CONFIG = {
  lookup: {
    label: "Patient Lookup",
    classes: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
    icon: Search,
  },
  "upload-report": {
    label: "Uploaded Report",
    classes: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
    icon: Upload,
  },
  "view-report": {
    label: "Viewed Report",
    classes: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    icon: Eye,
  },
  "download-report": {
    label: "Downloaded Report",
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    icon: Download,
  },
};

function formatTimestamp(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function AdminAccessLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/access-logs");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch access audit logs");
      setLogs(data.logs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Filter logs
  const filteredLogs = logs.filter((l) => {
    const matchesAction = actionFilter === "all" || l.action === actionFilter;

    const q = search.toLowerCase().trim();
    const staffName = l.staff?.name?.toLowerCase() || "";
    const staffId = l.staff?.staffId?.toLowerCase() || "";
    const studentName = l.student?.name?.toLowerCase() || "";
    const regNo = l.student?.regNo?.toLowerCase() || "";
    const reportTitle = l.report?.title?.toLowerCase() || "";
    const reportCat = l.report?.category?.toLowerCase() || "";

    const matchesSearch =
      !q ||
      staffName.includes(q) ||
      staffId.includes(q) ||
      studentName.includes(q) ||
      regNo.includes(q) ||
      reportTitle.includes(q) ||
      reportCat.includes(q);

    return matchesAction && matchesSearch;
  });

  // Action metrics
  const totalCount = logs.length;
  const lookupCount = logs.filter((l) => l.action === "lookup").length;
  const uploadCount = logs.filter((l) => l.action === "upload-report").length;
  const viewCount = logs.filter((l) => l.action === "view-report" || l.action === "download-report").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title and Top Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold mb-2">
              <Shield className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Compliance &amp; HIPAA/FERPA Privacy Trail</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Patient Record Access Logs
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Tamper-evident audit log of all healthcare staff who accessed, viewed, downloaded, or uploaded confidential student medical records.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              disabled={loading}
              className="text-xs gap-1.5 border-slate-200 dark:border-slate-800"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Trail</span>
            </Button>
          </div>
        </div>

        {/* Audit Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Logged Access Events</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{totalCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Most recent 200 events</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Record Lookups</p>
            <p className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-300 mt-1">{lookupCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Registration queries</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">Reports Uploaded</p>
            <p className="text-2xl font-extrabold text-teal-700 dark:text-teal-300 mt-1">{uploadCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Diagnostic files attached</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Views &amp; Downloads</p>
            <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-300 mt-1">{viewCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">File accesses logged</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by clinician name, staff ID, student name, or reg number…"
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setActionFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                actionFilter === "all"
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              All Events ({logs.length})
            </button>
            <button
              type="button"
              onClick={() => setActionFilter("lookup")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                actionFilter === "lookup"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              Lookups
            </button>
            <button
              type="button"
              onClick={() => setActionFilter("upload-report")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                actionFilter === "upload-report"
                  ? "bg-teal-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              Uploads
            </button>
            <button
              type="button"
              onClick={() => setActionFilter("view-report")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                actionFilter === "view-report"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              Views
            </button>
            <button
              type="button"
              onClick={() => setActionFilter("download-report")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                actionFilter === "download-report"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              Downloads
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Audit Log Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <p className="text-xs text-slate-500">Loading access audit trail…</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-20 text-center space-y-2 p-6">
              <ShieldAlert className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                No access audit entries found
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {logs.length === 0
                  ? "Access logs are automatically generated whenever medical personnel look up a student or interact with diagnostic reports."
                  : "Try clearing your search query or filter options."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Timestamp</th>
                    <th className="py-3.5 px-4">Staff Clinician / User</th>
                    <th className="py-3.5 px-4">Action Taken</th>
                    <th className="py-3.5 px-4">Student Patient</th>
                    <th className="py-3.5 px-4 sm:px-6">Target Record</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredLogs.map((log) => {
                    const cfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.lookup;
                    const ActionIcon = cfg.icon;

                    return (
                      <tr
                        key={log._id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Timestamp */}
                        <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {formatTimestamp(log.createdAt)}
                        </td>

                        {/* Staff Clinician */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {log.staff?.name || "Unknown Staff"}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                            {log.staff?.staffId && (
                              <span className="font-mono text-[10px] text-teal-600 dark:text-teal-400 font-bold">
                                {log.staff.staffId}
                              </span>
                            )}
                            <span className="capitalize text-slate-500">
                              ({log.staff?.role || "staff"})
                            </span>
                          </div>
                        </td>

                        {/* Action Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${cfg.classes}`}
                          >
                            <ActionIcon className="w-3 h-3 shrink-0" />
                            <span>{cfg.label}</span>
                          </span>
                        </td>

                        {/* Student Patient */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {log.student?.name || "Student Patient"}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            {log.student?.regNo && (
                              <span className="font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded">
                                {log.student.regNo}
                              </span>
                            )}
                            {log.student?.department && (
                              <span>Dept: {log.student.department}</span>
                            )}
                          </div>
                        </td>

                        {/* Target Record */}
                        <td className="py-3.5 px-4 sm:px-6">
                          {log.report ? (
                            <div>
                              <div className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1">
                                {log.report.title}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                <FileText className="w-3 h-3 text-slate-400" />
                                <span>{log.report.category}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">
                              Full Patient Clinical File
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </div>
  );
}
