"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse, Calendar, Clock, Plus, Trash2, ArrowLeft,
  Loader2, AlertCircle, CheckCircle2, Info, Users,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TIME_OPTIONS = [];
for (let h = 7; h <= 20; h++) {
  for (let m of ["00", "30"]) {
    TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:${m}`);
  }
}

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, mo, d] = dateStr.split("-");
  return new Date(y, mo - 1, d).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

export default function StaffAvailabilityPage() {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("09:30");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotsError, setSlotsError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // Fetch ALL of my own slots (we'll filter to current staff's on the backend)
  const fetchMySlots = useCallback(async () => {
    setLoadingSlots(true);
    setSlotsError("");
    try {
      const res = await fetch("/api/availability/mine");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load slots");
      setSlots(data.slots || []);
    } catch (e) {
      setSlotsError(e.message);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => { fetchMySlots(); }, [fetchMySlots]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAddError("");
    setAddSuccess("");

    if (!date) return setAddError("Please select a date.");
    if (startTime >= endTime) return setAddError("Start time must be before end time.");

    setAdding(true);
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, startTime, endTime }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add slot");
      setAddSuccess(`Slot added: ${formatDate(date)}, ${startTime}–${endTime}`);
      setDate("");
      setStartTime("09:00");
      setEndTime("09:30");
      await fetchMySlots();
    } catch (e) {
      setAddError(e.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this availability slot?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/availability/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      setSlots((prev) => prev.filter((s) => s._id !== id));
    } catch (e) {
      alert(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const upcoming = slots.filter((s) => s.date >= getTodayStr());
  const past = slots.filter((s) => s.date < getTodayStr());

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">My Availability</h1>
          <p className="text-xs text-muted-foreground">Add and manage your open appointment slots</p>
        </div>
        <Link href="/staff/appointments">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <ClipboardList className="w-3.5 h-3.5" />
            Patient Appointments
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT: Add Slot Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sticky top-24">
              <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-600" />
                Add Availability Slot
              </h2>

              {addSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-800"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{addSuccess}</span>
                </motion.div>
              )}

              {addError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{addError}</span>
                </div>
              )}

              <form onSubmit={handleAdd} className="space-y-4">
                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="date"
                      min={getTodayStr()}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                {/* Times */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Start Time
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <select
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      End Time
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <select
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={adding}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold h-10"
                >
                  {adding ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Add Slot
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-5 p-3 rounded-xl bg-sky-50/70 border border-sky-100 text-xs text-sky-700">
                <p className="font-semibold mb-1">How slots work:</p>
                <ul className="space-y-1 list-disc list-inside text-sky-600 font-normal">
                  <li>Students see your open slots and can book them</li>
                  <li>Booked slots cannot be deleted (cancel appointment first)</li>
                  <li>Duplicate date+time is automatically prevented</li>
                </ul>
              </div>
            </div>
          </div>

          {/* RIGHT: My Slots List */}
          <div className="lg:col-span-3 space-y-6">
            {loadingSlots ? (
              <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
                <p className="text-xs">Loading your slots…</p>
              </div>
            ) : slotsError ? (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-center gap-3 text-rose-700 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{slotsError}</span>
              </div>
            ) : slots.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-2xl border border-slate-200/80 space-y-2">
                <Calendar className="w-10 h-10 text-slate-200 mx-auto" />
                <p className="text-sm font-bold text-slate-500">No slots added yet</p>
                <p className="text-xs text-slate-400">Use the form to add your first availability slot</p>
              </div>
            ) : (
              <>
                {/* Upcoming Slots */}
                {upcoming.length > 0 && (
                  <section>
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                      Upcoming Slots ({upcoming.length})
                    </h2>
                    <div className="space-y-2.5">
                      {upcoming.map((slot) => (
                        <motion.div
                          key={slot._id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-2xl border border-slate-200/80 shadow-xs px-5 py-4 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              slot.isBooked
                                ? "bg-amber-50 text-amber-600"
                                : "bg-sky-50 text-sky-600"
                            }`}>
                              <Clock className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {formatDate(slot.date)}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {slot.startTime} – {slot.endTime}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {slot.isBooked ? (
                              <span className="text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
                                Booked
                              </span>
                            ) : (
                              <>
                                <span className="text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full">
                                  Open
                                </span>
                                <button
                                  onClick={() => handleDelete(slot._id)}
                                  disabled={deletingId === slot._id}
                                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40"
                                  title="Delete slot"
                                >
                                  {deletingId === slot._id
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <Trash2 className="w-4 h-4" />}
                                </button>
                              </>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Past Slots */}
                {past.length > 0 && (
                  <section>
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                      Past Slots ({past.length})
                    </h2>
                    <div className="space-y-2">
                      {past.map((slot) => (
                        <div
                          key={slot._id}
                          className="bg-white rounded-2xl border border-slate-100 px-5 py-4 flex items-center justify-between gap-4 opacity-50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center">
                              <Clock className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-700">{formatDate(slot.date)}</p>
                              <p className="text-xs text-slate-400">{slot.startTime} – {slot.endTime}</p>
                            </div>
                          </div>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            slot.isBooked
                              ? "bg-slate-50 text-slate-500 border-slate-200"
                              : "bg-slate-50 text-slate-400 border-slate-100"
                          }`}>
                            {slot.isBooked ? "Was Booked" : "Unused"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
    </div>
  );
}
