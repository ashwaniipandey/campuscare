"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Filter,
  RefreshCw,
  Loader2,
  AlertCircle,
  Clock,
  User,
  Stethoscope,
  X,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const STATUS_BADGES = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-teal-50 text-teal-700 border-teal-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (dateFilter) params.append("date", dateFilter);

      const res = await fetch(`/api/admin/appointments?${params.toString()}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to load appointments");
      }
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFilter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200/80 text-sky-700 text-xs font-semibold mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Clinical Registry</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Appointment Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive schedule of consultations booked between university students and health officers.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchAppointments}
            disabled={loading}
            className="gap-1.5 text-xs text-slate-600 hover:text-sky-700 hover:border-sky-300 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={fetchAppointments} className="font-bold underline text-rose-700 ml-2">
              Retry
            </button>
          </div>
        )}

        {/* Filter Controls */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === opt.value
                    ? "bg-sky-600 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-semibold whitespace-nowrap">Filter Date:</label>
            <div className="relative">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            {dateFilter && (
              <button
                onClick={() => setDateFilter("")}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                title="Clear date"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Appointments Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Date &amp; Time</th>
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-5 py-3.5">Attending Staff</th>
                  <th className="px-5 py-3.5">Type &amp; Symptoms</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
                        <span>Loading appointments...</span>
                      </div>
                    </td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400">
                      <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-600">No appointments found</p>
                      <p className="text-[11px] text-slate-400">Try adjusting your status or date filter.</p>
                    </td>
                  </tr>
                ) : (
                  appointments.map((a) => (
                    <tr key={a._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{a.date}</div>
                        <div className="text-slate-400 flex items-center gap-1 font-mono text-[11px]">
                          <Clock className="w-3 h-3" />
                          {a.startTime} – {a.endTime}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{a.student?.name || "Student"}</div>
                        <div className="text-slate-400 text-[11px]">{a.student?.email}</div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          <span>{a.staff?.name || "Doctor"}</span>
                        </div>
                        <div className="text-slate-400 text-[11px]">{a.staff?.email}</div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="capitalize font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg text-[11px]">
                          {a.type}
                        </span>
                        {a.reason && (
                          <p className="text-slate-500 italic text-[11px] mt-1 max-w-xs truncate flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-slate-400 shrink-0" />
                            "{a.reason}"
                          </p>
                        )}
                        {a.visitNotes && (
                          <p className="text-emerald-700 text-[11px] mt-0.5 font-medium truncate">
                            Notes: {a.visitNotes}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase border ${
                            STATUS_BADGES[a.status] || "bg-slate-50 text-slate-600"
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
}
