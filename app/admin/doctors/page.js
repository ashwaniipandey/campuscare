"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Stethoscope,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Star,
  Users,
  Calendar,
  Clock,
  RefreshCw,
  Loader2,
  AlertCircle,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEPARTMENTS } from "@/lib/departments";

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [sortField, setSortField] = useState("patientsSeenTotal");
  const [sortOrder, setSortOrder] = useState("desc"); // "asc" | "desc"

  const fetchDoctors = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError("");

    try {
      const res = await fetch("/api/admin/doctors-performance");
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to load doctor performance data");
      }
      setDoctors(json.doctors || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Filter and sort doctors
  const filteredAndSortedDoctors = useMemo(() => {
    return doctors
      .filter((doc) => {
        // Department filter
        if (selectedDept !== "all" && doc.medicalDepartment !== selectedDept) {
          return false;
        }
        // Search filter
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = doc.name?.toLowerCase().includes(q);
          const matchStaffId = doc.staffId?.toLowerCase().includes(q);
          const matchDept = doc.medicalDepartment?.toLowerCase().includes(q);
          if (!matchName && !matchStaffId && !matchDept) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === "string") {
          valA = valA.toLowerCase();
          valB = (valB || "").toLowerCase();
          return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
        return sortOrder === "asc" ? valA - valB : valB - valA;
      });
  }, [doctors, selectedDept, search, sortField, sortOrder]);

  // Overall system metrics
  const totalClinicians = doctors.length;
  const onDutyCount = doctors.filter((d) => d.dutyStatus === "available").length;
  const totalVisits = doctors.reduce((acc, d) => acc + (d.patientsSeenTotal || 0), 0);
  const ratedDoctors = doctors.filter((d) => d.reviewCount > 0);
  const sysAvgRating =
    ratedDoctors.length > 0
      ? (
          ratedDoctors.reduce((acc, d) => acc + d.averageRating * d.reviewCount, 0) /
          ratedDoctors.reduce((acc, d) => acc + d.reviewCount, 0)
        ).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Staff Directory &amp; Quality Metrics
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Doctors &amp; Clinician Performance
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Overview of university doctors, patient consultation counts, satisfaction ratings, and duty statuses
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDoctors(true)}
              disabled={refreshing || loading}
              className="text-xs gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Quick KPI Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Clinicians</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {totalClinicians}
            </div>
            <span className="text-[11px] text-slate-400">Registered campus staff</span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Available on Duty</span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">
              {onDutyCount}
            </div>
            <span className="text-[11px] text-slate-400">Ready for consultation</span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Consultations</span>
            <div className="text-2xl font-extrabold text-indigo-600 mt-1">
              {totalVisits}
            </div>
            <span className="text-[11px] text-slate-400">All-time visits completed</span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Average Staff Rating</span>
            <div className="text-2xl font-extrabold text-amber-500 mt-1 flex items-center gap-1">
              <span>{sysAvgRating}</span>
              <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
            </div>
            <span className="text-[11px] text-slate-400">Student satisfaction score</span>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID or department…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 w-full md:w-auto cursor-pointer"
            >
              <option value="all">All Departments ({doctors.length})</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept.key} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-xs">Loading clinician performance metrics…</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-600 text-xs flex flex-col items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              <span>{error}</span>
              <Button size="sm" variant="outline" onClick={() => fetchDoctors()} className="mt-2 text-xs">
                Retry
              </Button>
            </div>
          ) : filteredAndSortedDoctors.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No doctors found matching the current search or department filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold select-none">
                    <th
                      className="py-3.5 px-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
                      onClick={() => handleSort("staffId")}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Staff ID</span>
                        {sortField === "staffId" ? (
                          sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                    <th
                      className="py-3.5 px-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Clinician Name</span>
                        {sortField === "name" ? (
                          sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                    <th
                      className="py-3.5 px-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
                      onClick={() => handleSort("medicalDepartment")}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Department</span>
                        {sortField === "medicalDepartment" ? (
                          sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                    <th
                      className="py-3.5 px-4 text-center cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
                      onClick={() => handleSort("patientsSeenTotal")}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>Patients Seen</span>
                        {sortField === "patientsSeenTotal" ? (
                          sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                    <th
                      className="py-3.5 px-4 text-center cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
                      onClick={() => handleSort("patientsSeenLast7Days")}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>Last 7 Days</span>
                        {sortField === "patientsSeenLast7Days" ? (
                          sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                    <th
                      className="py-3.5 px-4 text-center cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
                      onClick={() => handleSort("averageRating")}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>Average Rating</span>
                        {sortField === "averageRating" ? (
                          sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                    <th
                      className="py-3.5 px-4 text-center cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
                      onClick={() => handleSort("reviewCount")}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>Reviews</span>
                        {sortField === "reviewCount" ? (
                          sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                    <th
                      className="py-3.5 px-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
                      onClick={() => handleSort("dutyStatus")}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Duty Status</span>
                        {sortField === "dutyStatus" ? (
                          sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredAndSortedDoctors.map((doc) => {
                    const isAvailable = doc.dutyStatus === "available";
                    const isBusy = doc.dutyStatus === "busy";

                    return (
                      <tr
                        key={doc._id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Staff ID */}
                        <td className="py-3.5 px-4 font-mono font-bold text-[11px] text-sky-700 dark:text-sky-400">
                          {doc.staffId || "—"}
                        </td>

                        {/* Name */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {doc.name}
                          </div>
                          <div className="text-[11px] text-slate-400">{doc.designation}</div>
                        </td>

                        {/* Department */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {doc.medicalDepartment}
                          </span>
                        </td>

                        {/* Patients Seen (Total) */}
                        <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                          {doc.patientsSeenTotal}
                        </td>

                        {/* Last 7 Days */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {doc.patientsSeenLast7Days}
                          </span>
                        </td>

                        {/* Average Rating */}
                        <td className="py-3.5 px-4 text-center">
                          {doc.reviewCount > 0 ? (
                            <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                              {doc.averageRating}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">No ratings</span>
                          )}
                        </td>

                        {/* Review Count */}
                        <td className="py-3.5 px-4 text-center font-mono text-slate-600 dark:text-slate-400">
                          {doc.reviewCount}
                        </td>

                        {/* Duty Status */}
                        <td className="py-3.5 px-4">
                          {isAvailable ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Available
                            </span>
                          ) : isBusy ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Busy
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Off Duty
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
