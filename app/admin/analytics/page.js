"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Calendar,
  AlertTriangle,
  Clock,
  TrendingUp,
  RefreshCw,
  Loader2,
  AlertCircle,
  PieChart as PieChartIcon,
  Activity,
  Flame,
  HelpCircle,
  Truck,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { Button } from "@/components/ui/button";

function formatDuration(seconds) {
  if (seconds == null || isNaN(seconds)) return "N/A";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchAnalytics = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError("");

    try {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to load analytics data");
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Merge appointments and emergencies per day for dual line chart
  const volumeTrendData = useMemo(() => {
    if (!data?.appointmentsPerDay || !data?.emergenciesPerDay) return [];
    return data.appointmentsPerDay.map((appt, i) => ({
      date: appt.label,
      Appointments: appt.count,
      Emergencies: data.emergenciesPerDay[i]?.count || 0,
    }));
  }, [data]);

  const hasAppointmentStatusData = useMemo(() => {
    return (data?.appointmentsByStatus || []).some((item) => item.value > 0);
  }, [data]);

  const hasEmergencyTypeData = useMemo(() => {
    return (data?.emergenciesByType || []).some((item) => item.count > 0);
  }, [data]);

  const hasResponseTimeData = useMemo(() => {
    return (data?.responseTimePerDay || []).some((item) => item.avgSeconds > 0);
  }, [data]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold mb-1">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Campus Health Analytics</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Clinical Trends &amp; Incident Metrics
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              14-day appointment volumes, category breakdowns, emergency response velocities, and peak hours.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing || loading}
            className="gap-1.5 text-xs text-slate-600 hover:text-indigo-600 hover:border-indigo-300 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh Data</span>
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => fetchAnalytics()} className="font-bold underline text-rose-700 ml-2">
              Retry
            </button>
          </div>
        )}

        {/* Highlight Banner: Busiest Weekday */}
        <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-sky-800 rounded-3xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-200 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Peak Capacity Insight
            </span>
            <h3 className="text-xl font-bold">
              Busiest Clinic Day:{" "}
              <span className="text-teal-200">
                {loading ? "..." : data?.busiestWeekday?.day || "N/A"}
              </span>
            </h3>
            <p className="text-xs text-teal-100 max-w-xl">
              Historical appointments concentrate heavily on this weekday. Consider allocating extra clinical triage staff during peak morning slots.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(data?.weekdayBreakdown || []).map((wb) => (
              <div
                key={wb.day}
                className={`flex flex-col items-center justify-center p-2 rounded-xl text-center min-w-[42px] transition-all ${
                  wb.fullDay === data?.busiestWeekday?.day
                    ? "bg-white text-teal-900 font-extrabold shadow-sm scale-105"
                    : "bg-white/10 text-white/80"
                }`}
              >
                <span className="text-[10px] font-bold uppercase">{wb.day}</span>
                <span className="text-xs font-mono font-bold mt-0.5">{wb.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Avg Ambulance Acceptance
              </span>
              <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                {loading ? "..." : formatDuration(data?.avgAmbulanceAcceptanceSeconds)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                SOS trigger to first ambulance driver claim
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
              <Truck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Ambulance Dispatches
              </span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                {loading ? "..." : data?.totalAmbulanceDispatches ?? 0}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Total incidents requesting emergency ambulance
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/50">
              <Activity className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Active Fleet Ready
              </span>
              <div className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 font-mono">
                Real-Time
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Dynamic dispatch with expanding radius (5-25km)
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-900/50">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Dual Line Chart — Appointments vs Emergencies (14 Days) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  Service Volume (Last 14 Days)
                </h3>
                <p className="text-xs text-slate-500">Daily appointment bookings vs. emergency beacons</p>
              </div>
            </div>

            {loading || !isMounted ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-xs gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                <span>Loading trend curve...</span>
              </div>
            ) : volumeTrendData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                <p>No activity recorded in the past 14 days.</p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={volumeTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                    <Line
                      type="monotone"
                      dataKey="Appointments"
                      stroke="#0d9488"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Emergencies"
                      stroke="#ef4444"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Chart 2: Donut / Pie Chart — Appointments by Status */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-teal-600" />
                  Appointment Distribution
                </h3>
                <p className="text-xs text-slate-500">Breakdown of all consultations by current workflow status</p>
              </div>
            </div>

            {loading || !isMounted ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-xs gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                <span>Loading distribution...</span>
              </div>
            ) : !hasAppointmentStatusData ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                <p>No appointments recorded yet.</p>
              </div>
            ) : (
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.appointmentsByStatus}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {data.appointmentsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Chart 3: Bar Chart — Emergencies by Type */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Emergencies by Category
                </h3>
                <p className="text-xs text-slate-500">Frequency distribution across emergency incident types</p>
              </div>
            </div>

            {loading || !isMounted ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-xs gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
                <span>Loading emergency categories...</span>
              </div>
            ) : !hasEmergencyTypeData ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                <p>No emergency beacons transmitted yet.</p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.emergenciesByType} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {data.emergenciesByType.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Chart 4: Area / Line Chart — Emergency Response Velocity (14 Days) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Average Response Time (Last 14 Days)
                </h3>
                <p className="text-xs text-slate-500">Seconds elapsed from SOS broadcast to responder dispatch</p>
              </div>
            </div>

            {loading || !isMounted ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-xs gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                <span>Loading response velocities...</span>
              </div>
            ) : !hasResponseTimeData ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                <p>No completed emergency responses recorded in this window.</p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.responseTimePerDay} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorResp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      unit="s"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                      }}
                      formatter={(val) => [`${val} seconds`, "Avg Response"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="avgSeconds"
                      stroke="#059669"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorResp)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
