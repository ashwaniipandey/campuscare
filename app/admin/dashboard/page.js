"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  HeartPulse,
  Users,
  Calendar,
  AlertTriangle,
  Clock,
  ShieldCheck,
  BarChart3,
  ChevronRight,
  RefreshCw,
  Loader2,
  AlertCircle,
  MapPin,
  TrendingUp,
  UserCheck,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Dynamically import EmergencyMap to prevent Leaflet SSR issues
const EmergencyMap = dynamic(() => import("@/components/EmergencyMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[280px] bg-slate-100 rounded-3xl animate-pulse flex items-center justify-center text-slate-400 text-xs">
      Loading Emergency Geo-Map Overview...
    </div>
  ),
});

function AnimatedCount({ value }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0 || !value) {
      setDisplay(0);
      return;
    }
    let start = 0;
    const step = Math.max(1, Math.ceil(value / 25));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(start);
      }
    }, 25);
    return () => clearInterval(timer);
  }, [value]);

  return <span>{display}</span>;
}

function formatResponseTime(seconds) {
  if (seconds == null || seconds === 0) return "0s";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchDashboardData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError("");

    try {
      const [statsRes, emgRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/emergencies"),
      ]);

      if (!statsRes.ok) {
        const d = await statsRes.json();
        throw new Error(d.error || "Failed to load admin stats");
      }

      const statsData = await statsRes.json();
      setStats(statsData);

      if (emgRes.ok) {
        const emgData = await emgRes.json();
        setEmergencies(emgData.emergencies || []);
      }

      setLastRefresh(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const activeEmergencies = emergencies.filter(
    (e) => e.status === "new" || e.status === "responded"
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-800/60 text-indigo-200 text-xs font-semibold mb-3 border border-indigo-700/40">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Executive Command Console</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Campus Health System Administration
              </h1>
              <p className="mt-1 text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
                Platform-wide oversight for student triage, clinical availability, emergency response dispatch, and healthcare analytics.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {lastRefresh && (
                <span className="hidden sm:inline text-[11px] text-slate-400">
                  Updated {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              <button
                type="button"
                onClick={() => fetchDashboardData(true)}
                disabled={refreshing}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-colors"
                title="Refresh stats"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </motion.div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchDashboardData()}
              className="font-bold underline text-rose-700 ml-2"
            >
              Retry
            </button>
          </div>
        )}

        {/* 5 Core Stat Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. Total Students */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 font-medium">Total Students</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
              {loading ? "..." : <AnimatedCount value={stats?.users?.student ?? 0} />}
            </p>
            <p className="text-[11px] text-teal-600 font-medium mt-1">Enrolled accounts</p>
          </div>

          {/* 2. Total Staff */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
              <Stethoscope className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 font-medium">Health Staff</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
              {loading ? "..." : <AnimatedCount value={stats?.users?.staff ?? 0} />}
            </p>
            <p className="text-[11px] text-sky-600 font-medium mt-1">Doctors &amp; Nurses</p>
          </div>

          {/* 3. Appointments Today */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Calendar className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 font-medium">Visits Today</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
              {loading ? "..." : <AnimatedCount value={stats?.appointments?.today ?? 0} />}
            </p>
            <p className="text-[11px] text-indigo-600 font-medium mt-1">
              {stats?.appointments?.pending ?? 0} pending review
            </p>
          </div>

          {/* 4. Active Emergencies */}
          <div
            className={`rounded-2xl p-5 border shadow-xs transition-colors ${
              (stats?.emergencies?.active ?? 0) > 0
                ? "bg-rose-50/50 border-rose-300"
                : "bg-white border-slate-200/80"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                (stats?.emergencies?.active ?? 0) > 0
                  ? "bg-rose-100 text-rose-600 animate-pulse"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 font-medium">Active Emergencies</p>
            <p
              className={`text-2xl sm:text-3xl font-extrabold mt-0.5 ${
                (stats?.emergencies?.active ?? 0) > 0 ? "text-rose-700" : "text-slate-900"
              }`}
            >
              {loading ? "..." : <AnimatedCount value={stats?.emergencies?.active ?? 0} />}
            </p>
            <p className="text-[11px] text-rose-600 font-semibold mt-1">
              {(stats?.emergencies?.new ?? 0) > 0
                ? `${stats?.emergencies?.new} awaiting dispatch`
                : "All clear"}
            </p>
          </div>

          {/* 5. Avg Response Time */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs col-span-2 lg:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 font-medium">Avg Response Time</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
              {loading ? "..." : formatResponseTime(stats?.avgResponseTime)}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">
              7-day avg: {loading ? "..." : formatResponseTime(stats?.avgResponseTime7Days)}
            </p>
          </div>
        </section>

        {/* Live Campus Emergency Map */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Campus Emergency Live Geo-Map
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time geographic distribution of active distress beacons
                </p>
              </div>
            </div>

            <Link href="/admin/emergencies">
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                <span>View Full Emergency Log →</span>
              </Button>
            </Link>
          </div>

          <EmergencyMap
            emergencies={activeEmergencies}
            height="280px"
            readOnly={false}
          />
        </section>

        {/* Quick Navigation Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Analytics Link */}
          <Link href="/admin/analytics" className="group">
            <div className="bg-white rounded-2xl border border-indigo-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Analytics &amp; Trends
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                14-day appointment curves, emergency distributions, and weekday peak volume.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600">
                Explore Charts <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* User Directory Link */}
          <Link href="/admin/users" className="group">
            <div className="bg-white rounded-2xl border border-teal-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
                <UserCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                User Directory &amp; RBAC
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Search students, staff &amp; administrators, manage credentials, and prune stale accounts.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-600">
                Manage Users <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* Appointments Schedule Link */}
          <Link href="/admin/appointments" className="group">
            <div className="bg-white rounded-2xl border border-sky-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
                <Calendar className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                Appointment Registry
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Filter and review complete consultation schedules across all campus clinical staff.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-sky-600">
                View Appointments <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* Emergency SOS Link */}
          <Link href="/admin/emergencies" className="group">
            <div className="bg-white rounded-2xl border border-rose-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                Emergency Dispatch Log
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Comprehensive incident audit log, responder response times, and GPS coordinates.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
                Audit Emergencies <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        </section>
    </div>
  );
}
