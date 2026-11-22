"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  HeartPulse,
  ArrowLeft,
  Calendar,
  Users,
  Award,
  Star,
  TrendingUp,
  RefreshCw,
  Loader2,
  AlertCircle,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";

const DONUT_COLORS = [
  "#0d9488", // teal-600
  "#0284c7", // sky-600
  "#6366f1", // indigo-500
  "#f59e0b", // amber-500
  "#ec4899", // pink-500
  "#10b981", // emerald-500
  "#8b5cf6", // violet-500
  "#f97316", // orange-500
];

export default function StaffPerformancePage() {
  const { data: session } = useSession();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchPerformance = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError("");

    try {
      const res = await fetch("/api/staff/performance");
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to load performance metrics");
      }
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            Clinician Performance &amp; Reviews
          </h1>
          <p className="text-xs text-muted-foreground">
            Patient consultation volume, ratings, and student feedback
          </p>
        </div>

        <button
          onClick={() => fetchPerformance(true)}
          disabled={refreshing || loading}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
          title="Refresh metrics"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            <p className="text-sm">Aggregating consultation and review records…</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-5 flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchPerformance()}
              className="ml-auto text-xs"
            >
              Retry
            </Button>
          </div>
        ) : data ? (
          <>
            {/* Stat Cards Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Patients Today */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Patients Today
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {data.todayCount}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Completed visits today</p>
              </motion.div>

              {/* Patients This Week */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    This Week (Last 7d)
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {data.thisWeekCount}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Visits completed in 7 days</p>
              </motion.div>

              {/* Total Seen */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Total Patients Seen
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {data.totalSeen}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Avg {data.avgPatientsPerWorkingDay} / active day
                </p>
              </motion.div>

              {/* Average Rating */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Average Rating
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                    {data.avgRating > 0 ? data.avgRating : "—"}
                  </span>
                  {data.avgRating > 0 && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">/ 5.0</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {data.reviewCount > 0
                    ? `From ${data.reviewCount} ${data.reviewCount === 1 ? "review" : "reviews"}`
                    : "No reviews submitted yet"}
                </p>
              </motion.div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Patients per Day (Last 14 Days) */}
              <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Daily Patients Seen (Last 14 Days)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Completed clinic consultations per day
                    </p>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 rounded-full border border-teal-200 dark:border-teal-800">
                    {data.patientsPerDay.reduce((a, b) => a + b.patients, 0)} visits in 14d
                  </span>
                </div>

                <div className="h-64 w-full">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.patientsPerDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
                          axisLine={{ stroke: "#e2e8f0" }}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(15, 23, 42, 0.9)",
                            borderColor: "#334155",
                            borderRadius: "12px",
                            color: "#fff",
                            fontSize: "12px",
                          }}
                          formatter={(value) => [`${value} Patients`, "Completed Visits"]}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Bar
                          dataKey="patients"
                          fill="#0d9488"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={36}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Service Breakdown Donut */}
              <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Consultations by Service
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Distribution of clinical services delivered
                  </p>
                </div>

                {data.serviceBreakdown?.length === 0 ? (
                  <div className="py-16 text-center text-xs text-slate-400">
                    No completed appointment data yet
                  </div>
                ) : (
                  <div className="h-56 w-full flex items-center justify-center my-2">
                    {isMounted && (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.serviceBreakdown}
                            dataKey="count"
                            nameKey="service"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                          >
                            {data.serviceBreakdown.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(15, 23, 42, 0.9)",
                              borderColor: "#334155",
                              borderRadius: "12px",
                              color: "#fff",
                              fontSize: "12px",
                            }}
                            formatter={(value, name) => [`${value} Visits`, name]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}

                {/* Service Legend List */}
                <div className="space-y-1.5 max-h-32 overflow-y-auto pt-2 border-t border-slate-100 dark:border-slate-800">
                  {data.serviceBreakdown.map((s, idx) => (
                    <div key={s.service} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                        />
                        <span className="text-slate-700 dark:text-slate-300 truncate">
                          {s.service}
                        </span>
                      </div>
                      <span className="font-mono text-slate-500 font-semibold">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Reviews & Ratings Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Rating Distribution Bar */}
              <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Rating Distribution
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Patient star rating breakdown
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 text-center">
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {data.avgRating > 0 ? data.avgRating : "0.0"}
                  </div>
                  <div className="flex items-center justify-center text-amber-500 my-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= Math.round(data.avgRating)
                            ? "fill-amber-400 text-amber-500"
                            : "text-slate-300 dark:text-slate-600"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Based on {data.reviewCount} total {data.reviewCount === 1 ? "review" : "reviews"}
                  </span>
                </div>

                {/* 5 to 1 star bars */}
                <div className="space-y-2 pt-2">
                  {[5, 4, 3, 2, 1].map((ratingNum) => {
                    const count = data.distribution?.[ratingNum] || 0;
                    const total = data.reviewCount || 1;
                    const pct = data.reviewCount > 0 ? Math.round((count / total) * 100) : 0;

                    return (
                      <div key={ratingNum} className="flex items-center gap-2.5 text-xs">
                        <span className="w-6 font-semibold text-slate-700 dark:text-slate-300">
                          {ratingNum}★
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-[11px] text-right text-slate-400 font-mono">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Student Reviews */}
              <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Recent Student Reviews
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Verified feedback from completed appointments
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    Latest {data.recentReviews?.length || 0} reviews
                  </span>
                </div>

                {data.recentReviews?.length === 0 ? (
                  <div className="py-16 text-center space-y-2">
                    <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400">
                      No reviews received yet
                    </h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      When students complete their consultations and submit feedback, their ratings and comments will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {data.recentReviews.map((rev) => (
                      <div
                        key={rev._id}
                        className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {rev.studentName}
                            </span>
                            {rev.isAnonymous && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                Anonymous
                              </span>
                            )}
                          </div>

                          <div className="flex items-center text-amber-500">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= rev.rating
                                    ? "fill-amber-400 text-amber-500"
                                    : "text-slate-300 dark:text-slate-600"
                                }`}
                              />
                            ))}
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1.5 font-mono">
                              {rev.rating}.0
                            </span>
                          </div>
                        </div>

                        {rev.comment ? (
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                            "{rev.comment}"
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">No written comment provided.</p>
                        )}

                        <div className="text-[10px] text-slate-400">
                          {new Date(rev.createdAt).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
