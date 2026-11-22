"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse, Calendar, Clock, Stethoscope, ArrowLeft,
  Loader2, AlertCircle, CheckCircle2, XCircle, Ban,
  ClockIcon, PlusCircle, Star, MessageSquare, X, Check,
  ArrowRightLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";

const STATUS_CONFIG = {
  pending: { label: "Pending", variant: "outline", icon: ClockIcon, classes: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800" },
  confirmed: { label: "Confirmed", variant: "teal", icon: CheckCircle2, classes: "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800" },
  cancelled: { label: "Cancelled", variant: "destructive", icon: Ban, classes: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800" },
  completed: { label: "Completed", variant: "success", icon: CheckCircle2, classes: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" },
};

const TYPE_LABELS = {
  general: "General Medicine",
  counseling: "Counseling & Wellness",
  "emergency-followup": "Emergency Follow-up",
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const [y, m, d] = dateStr.split("-");
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function StudentAppointmentsPage() {
  const { data: session } = useSession();
  const [appointments, setAppointments] = useState([]);
  const [reviewsMap, setReviewsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(null);

  // Review Modal State
  const [reviewAppt, setReviewAppt] = useState(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [apptsRes, reviewsRes] = await Promise.all([
        fetch("/api/appointments"),
        fetch("/api/reviews/mine"),
      ]);

      const apptsData = await apptsRes.json();
      if (!apptsRes.ok) throw new Error(apptsData.error || "Failed to load appointments");
      setAppointments(apptsData.appointments || []);

      if (reviewsRes.ok) {
        const revData = await reviewsRes.json();
        const map = {};
        (revData.reviews || []).forEach((r) => {
          if (r.appointment) {
            map[r.appointment] = r;
          }
        });
        setReviewsMap(map);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancel = async (id) => {
    if (!confirm("Are you sure you want to cancel this appointment? The slot will become available again.")) return;
    setCancelling(id);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel");
      setAppointments((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: "cancelled" } : a))
      );
    } catch (e) {
      alert(e.message);
    } finally {
      setCancelling(null);
    }
  };

  const openReviewModal = (appt) => {
    setReviewAppt(appt);
    setRating(5);
    setHoverRating(0);
    setComment("");
    setIsAnonymous(false);
    setReviewError("");
  };

  const closeReviewModal = () => {
    setReviewAppt(null);
    setReviewError("");
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewAppt) return;
    if (rating < 1 || rating > 5) {
      setReviewError("Please select a rating between 1 and 5 stars");
      return;
    }

    setSubmittingReview(true);
    setReviewError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: reviewAppt._id,
          rating,
          comment: comment.trim(),
          isAnonymous,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      // Update local reviews map
      setReviewsMap((prev) => ({
        ...prev,
        [reviewAppt._id]: data.review || {
          appointment: reviewAppt._id,
          rating,
          comment,
          isAnonymous,
        },
      }));

      closeReviewModal();
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const active = appointments.filter((a) => !["cancelled", "completed"].includes(a.status));
  const past = appointments.filter((a) => ["cancelled", "completed"].includes(a.status));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">My Appointments</h1>
          <p className="text-xs text-muted-foreground">Track and manage your clinic visits</p>
        </div>
        <Link href="/student/book">
          <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 text-xs">
            <PlusCircle className="w-3.5 h-3.5" />
            Book New
          </Button>
        </Link>
      </div>

      <div className="space-y-8">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-teal-500" />
            <p className="text-sm">Loading your appointments…</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-5 flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
            <button onClick={fetchData} className="ml-auto text-xs font-semibold underline">Retry</button>
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-24 text-center space-y-3">
            <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No appointments yet</h3>
            <p className="text-xs text-slate-400">Book your first clinic visit to get started</p>
            <Link href="/student/book">
              <Button className="mt-2 bg-teal-600 hover:bg-teal-700 text-white">Book an Appointment</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Active Appointments */}
            {active.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                  Upcoming & Active ({active.length})
                </h2>
                <div className="space-y-3">
                  {active.map((appt) => {
                    const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending;
                    const StatusIcon = cfg.icon;
                    return (
                      <motion.div
                        key={appt._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.classes}`}>
                                <StatusIcon className="w-3 h-3" />
                                {cfg.label}
                              </span>
                              <span className="text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full">
                                {TYPE_LABELS[appt.type] || appt.type}
                              </span>
                              {appt.department && (
                                <span className="text-[11px] bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 px-2 py-0.5 rounded-full font-semibold">
                                  {appt.department}
                                </span>
                              )}
                              {appt.service && (
                                <span className="text-[11px] bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 px-2 py-0.5 rounded-full font-semibold">
                                  {appt.service}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {formatDate(appt.date)} · {appt.startTime}–{appt.endTime}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <Stethoscope className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                              {appt.staff?.name || "Campus Doctor"}
                            </p>
                            {appt.reason && (
                              <p className="text-xs text-slate-400 mt-1 italic truncate">"{appt.reason}"</p>
                            )}

                            {(appt.referredFrom || appt.referralId) && (
                              <div className="mt-2 p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center gap-2 text-xs text-sky-800 dark:text-sky-300 font-medium">
                                <ArrowRightLeft className="w-3.5 h-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
                                <span>
                                  Transferred from Dr. {appt.referredFrom?.name || "Previous Doctor"}
                                  {appt.referredFrom?.medicalDepartment ? ` (${appt.referredFrom.medicalDepartment})` : ""}
                                  {appt.referralId?.status ? ` · Referral ${appt.referralId.status}` : ""}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {appt.status !== "cancelled" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancel(appt._id)}
                            disabled={cancelling === appt._id}
                            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900 shrink-0"
                          >
                            {cancelling === appt._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5 mr-1" />
                                Cancel
                              </>
                            )}
                          </Button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Past Appointments */}
            {past.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                  Past & Completed ({past.length})
                </h2>
                <div className="space-y-3">
                  {past.map((appt) => {
                    const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.completed;
                    const StatusIcon = cfg.icon;
                    const isCompleted = appt.status === "completed";
                    const existingReview = reviewsMap[appt._id];

                    return (
                      <div
                        key={appt._id}
                        className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                          appt.status === "cancelled" ? "opacity-60" : ""
                        }`}
                      >
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.classes}`}>
                                <StatusIcon className="w-3 h-3" />
                                {cfg.label}
                              </span>
                              {appt.department && (
                                <span className="text-[11px] bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 px-2 py-0.5 rounded-full font-semibold">
                                  {appt.department}
                                </span>
                              )}
                              {appt.service && (
                                <span className="text-[11px] bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 px-2 py-0.5 rounded-full font-semibold">
                                  {appt.service}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                              {formatDate(appt.date)} · {appt.startTime}–{appt.endTime}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <Stethoscope className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                              {appt.staff?.name || "Campus Doctor"}
                            </p>
                            {appt.visitNotes && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic line-clamp-2">
                                <span className="font-semibold not-italic">Doctor's Note:</span> {appt.visitNotes}
                              </p>
                            )}

                            {(appt.referredFrom || appt.referralId) && (
                              <div className="mt-2 p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center gap-2 text-xs text-sky-800 dark:text-sky-300 font-medium">
                                <ArrowRightLeft className="w-3.5 h-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
                                <span>
                                  Transferred from Dr. {appt.referredFrom?.name || "Previous Doctor"}
                                  {appt.referredFrom?.medicalDepartment ? ` (${appt.referredFrom.medicalDepartment})` : ""}
                                  {appt.referralId?.status ? ` · Referral ${appt.referralId.status}` : ""}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Review Action or Rating Display */}
                        {isCompleted && (
                          <div className="shrink-0 flex items-center gap-2">
                            {existingReview ? (
                              <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 px-2.5 py-1 rounded-xl">
                                  <div className="flex items-center text-amber-500">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-3.5 h-3.5 ${
                                          star <= existingReview.rating
                                            ? "fill-amber-400 text-amber-500"
                                            : "text-slate-300 dark:text-slate-600"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 ml-1">
                                    {existingReview.rating}.0
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Reviewed
                                </span>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => openReviewModal(appt)}
                                className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs gap-1.5 shadow-xs"
                              >
                                <Star className="w-3.5 h-3.5 fill-white text-white" />
                                Rate your visit
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewAppt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 sm:p-7 relative overflow-hidden"
            >
              <button
                type="button"
                onClick={closeReviewModal}
                className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Rate your visit</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Dr. {reviewAppt.staff?.name || "Clinician"} · {formatDate(reviewAppt.date)}
                  </p>
                </div>
              </div>

              {reviewError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{reviewError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* 5 Clickable Stars */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    How was your consultation experience?
                  </label>
                  <div className="flex items-center gap-2 justify-center py-2 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1.5 focus:outline-hidden transform hover:scale-115 transition-transform"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            star <= (hoverRating || rating)
                              ? "fill-amber-400 text-amber-500"
                              : "text-slate-300 dark:text-slate-600"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-1.5">
                    {rating === 5 && "Excellent (5/5)"}
                    {rating === 4 && "Very Good (4/5)"}
                    {rating === 3 && "Average (3/5)"}
                    {rating === 2 && "Poor (2/5)"}
                    {rating === 1 && "Very Poor (1/5)"}
                  </p>
                </div>

                {/* Comment Box */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Feedback / Review Notes (optional)
                    </label>
                    <span className="text-[10px] text-slate-400">{comment.length}/500</span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us about the doctor's communication, care, and cleanliness of the facility…"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400 resize-none"
                  />
                </div>

                {/* Post Anonymously Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isAnonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="isAnonymous" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                    Post anonymously (your name will show as "Anonymous")
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={closeReviewModal}
                    disabled={submittingReview}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={submittingReview}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs gap-1.5"
                  >
                    {submittingReview ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Submit Review
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
