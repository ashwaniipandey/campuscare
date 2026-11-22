"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowRightLeft,
  RefreshCw,
  Loader2,
  AlertCircle,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchReferrals = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/referrals");
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to load referrals log");
      }
      const data = await res.json();
      setReferrals(data.referrals || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const filteredReferrals = referrals.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.patient?.name?.toLowerCase().includes(q) ||
      r.patient?.regNo?.toLowerCase().includes(q) ||
      r.fromDoctor?.name?.toLowerCase().includes(q) ||
      r.toDoctor?.name?.toLowerCase().includes(q) ||
      r.reason?.toLowerCase().includes(q) ||
      r.status?.toLowerCase().includes(q)
    );
  });

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case "emergency":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200">
            Emergency
          </span>
        );
      case "urgent":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200">
            Urgent
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Routine
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            Accepted
          </span>
        );
      case "declined":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3 h-3" />
            Declined
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800 animate-pulse">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 text-xs font-semibold mb-1">
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Inter-Departmental Clinical Registry</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Doctor Referrals &amp; Transfers Audit
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive log of patient handovers, emergency leave reassignments, and specialist consultations.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchReferrals}
              disabled={loading}
              className="gap-1.5 text-xs text-slate-600 dark:text-slate-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Log</span>
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center justify-between text-xs text-rose-800 dark:text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={fetchReferrals} className="font-bold underline text-rose-700 ml-2">
              Retry
            </button>
          </div>
        )}

        {/* Filter bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by student, doctor, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Showing {filteredReferrals.length} of {referrals.length} records
          </span>
        </div>

        {/* Referrals Table */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
              <span className="text-xs">Loading referrals audit log...</span>
            </div>
          ) : filteredReferrals.length === 0 ? (
            <div className="p-16 text-center text-slate-400 space-y-2">
              <ArrowRightLeft className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No referral records match</p>
              <p className="text-xs">Any doctor referrals created will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-700 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Date &amp; Type</th>
                    <th className="py-3.5 px-4 sm:px-6">Patient</th>
                    <th className="py-3.5 px-4 sm:px-6">Referring Doctor</th>
                    <th className="py-3.5 px-4 sm:px-6">Target Specialist</th>
                    <th className="py-3.5 px-4 sm:px-6">Urgency</th>
                    <th className="py-3.5 px-4 sm:px-6">Status &amp; Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-300">
                  {filteredReferrals.map((r) => (
                    <tr
                      key={r._id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-750/40 transition-colors"
                    >
                      {/* Date & Type */}
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-white font-mono text-[11px]">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </div>
                        <span
                          className={`inline-block mt-0.5 px-2 py-0.2 rounded text-[10px] font-bold uppercase ${
                            r.type === "emergency-leave"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {r.type === "emergency-leave" ? "Leave Transfer" : "Single Consult"}
                        </span>
                      </td>

                      {/* Patient */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {r.patient?.name || "Student"}
                        </div>
                        {r.patient?.regNo && (
                          <div className="text-[10px] font-mono text-slate-400">
                            {r.patient.regNo}
                          </div>
                        )}
                      </td>

                      {/* From Doctor */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {r.fromDoctor?.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {r.fromDoctor?.medicalDepartment || "General"}
                        </div>
                      </td>

                      {/* To Doctor */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {r.toDoctor?.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {r.toDoctor?.medicalDepartment || "Specialist"}
                        </div>
                      </td>

                      {/* Urgency */}
                      <td className="py-3.5 px-4 sm:px-6">
                        {getUrgencyBadge(r.urgency)}
                      </td>

                      {/* Status & Reason */}
                      <td className="py-3.5 px-4 sm:px-6 max-w-xs">
                        <div className="mb-1">{getStatusBadge(r.status)}</div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate">
                          Reason: {r.reason}
                        </p>
                        {r.responseNote && (
                          <p className="text-[10px] text-slate-400 italic mt-0.5 truncate">
                            Note: &ldquo;{r.responseNote}&rdquo;
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </div>
  );
}
