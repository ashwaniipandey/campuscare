"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  RefreshCw,
  Loader2,
  AlertCircle,
  Clock,
  User,
  MapPin,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Radio,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function formatSeconds(seconds) {
  if (seconds == null || seconds < 0) return "N/A";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function AdminEmergenciesPage() {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEmergencies = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/emergencies");
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to load emergencies");
      }
      const data = await res.json();
      setEmergencies(data.emergencies || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmergencies();
  }, [fetchEmergencies]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-semibold mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Campus Incident Dispatch Log</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Emergency Response Registry
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical record of all distress calls, first responder assignments, dispatch latencies, and resolution statuses.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchEmergencies}
            disabled={loading}
            className="gap-1.5 text-xs text-slate-600 hover:text-rose-700 hover:border-rose-300 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Audit Log</span>
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={fetchEmergencies} className="font-bold underline text-rose-700 ml-2">
              Retry
            </button>
          </div>
        )}

        {/* Emergencies Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Type &amp; Time</th>
                  <th className="px-5 py-3.5">Student Info</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Responder</th>
                  <th className="px-5 py-3.5">Response Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-rose-600" />
                        <span>Loading emergency registry...</span>
                      </div>
                    </td>
                  </tr>
                ) : emergencies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-600">No emergency records logged</p>
                      <p className="text-[11px] text-slate-400">All campus sectors peaceful.</p>
                    </td>
                  </tr>
                ) : (
                  emergencies.map((e) => {
                    const hasCoords = e.location?.latitude != null && e.location?.longitude != null;
                    const isNew = e.status === "new";
                    const isResponded = e.status === "responded";
                    const isResolved = e.status === "resolved";

                    return (
                      <tr key={e._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                            {e.type}
                          </span>
                          <div className="text-slate-400 text-[11px] mt-1 font-mono">
                            {new Date(e.createdAt).toLocaleString()}
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900">{e.student?.name || "Student"}</div>
                          <div className="text-slate-400 text-[11px]">{e.student?.email}</div>
                          {e.student?.phone && (
                            <a
                              href={`tel:${e.student.phone}`}
                              className="text-teal-600 hover:underline font-mono text-[11px] flex items-center gap-1 mt-0.5"
                            >
                              <Phone className="w-3 h-3" />
                              {e.student.phone}
                            </a>
                          )}
                        </td>

                        <td className="px-5 py-3.5 max-w-xs">
                          <p className="font-bold text-slate-800 truncate">
                            {e.location?.manualLocation || "Location unspecified"}
                          </p>
                          {hasCoords ? (
                            <a
                              href={`https://www.google.com/maps?q=${e.location.latitude},${e.location.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-sky-600 hover:underline font-mono mt-0.5"
                            >
                              <span>
                                {Number(e.location.latitude).toFixed(4)}, {Number(e.location.longitude).toFixed(4)}
                              </span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                              Manual Entry
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase border ${
                                isNew
                                  ? "bg-red-50 text-red-700 border-red-300 animate-pulse"
                                  : isResponded
                                  ? "bg-orange-50 text-orange-700 border-orange-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}
                            >
                              {e.status}
                            </span>
                            {e.needsAmbulance && (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <span>🚑</span>
                                <span>
                                  {e.ambulanceStatus === "searching"
                                    ? "Searching"
                                    : e.assignedAmbulance?.vehicleNumber
                                    ? `${e.assignedAmbulance.vehicleNumber} (${e.ambulanceStatus})`
                                    : e.ambulanceStatus}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap text-slate-700">
                          {e.respondedBy ? (
                            <div>
                              <p className="font-bold">{e.respondedBy.name}</p>
                              <p className="text-[11px] text-slate-400">{e.respondedBy.email}</p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {e.responseTimeSeconds != null ? (
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg">
                              {formatSeconds(e.responseTimeSeconds)}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Pending response</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
}
