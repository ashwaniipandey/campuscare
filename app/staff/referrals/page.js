"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ArrowRightLeft,
  Inbox,
  Send,
  AlertTriangle,
  Clock,
  User,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  Calendar,
  Layers,
  Check,
  X,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StaffReferralsPage() {
  const [activeTab, setActiveTab] = useState("incoming"); // "incoming" | "outgoing"
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Response Note Modal state
  const [respondingReferral, setRespondingReferral] = useState(null); // { referral, action: "accept"|"decline" }
  const [responseNote, setResponseNote] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // Batch action state
  const [batchActionLoading, setBatchActionLoading] = useState(null);

  const fetchReferrals = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [inRes, outRes] = await Promise.all([
        fetch("/api/referrals/incoming", { cache: "no-store" }),
        fetch("/api/referrals/outgoing", { cache: "no-store" }),
      ]);

      if (!inRes.ok || !outRes.ok) {
        throw new Error("Failed to load referrals list");
      }

      const inData = await inRes.json();
      const outData = await outRes.json();

      setIncoming(inData.referrals || []);
      setOutgoing(outData.referrals || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  // Group pending incoming by batchId
  const pendingBatches = useMemo(() => {
    const batches = {};
    incoming.forEach((ref) => {
      if (ref.status === "pending" && ref.batchId) {
        if (!batches[ref.batchId]) {
          batches[ref.batchId] = {
            batchId: ref.batchId,
            fromDoctor: ref.fromDoctor?.name || "Clinician",
            referrals: [],
          };
        }
        batches[ref.batchId].referrals.push(ref);
      }
    });
    return Object.values(batches);
  }, [incoming]);

  const handleRespondSingle = async () => {
    if (!respondingReferral) return;
    const { referral, action } = respondingReferral;

    setSubmittingResponse(true);
    try {
      const res = await fetch(`/api/referrals/${referral._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, responseNote: responseNote.trim() }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || `Failed to ${action} referral`);
      }

      setRespondingReferral(null);
      setResponseNote("");
      fetchReferrals();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleCancelOutgoing = async (referralId) => {
    if (!confirm("Are you sure you want to cancel this pending referral?")) return;
    setActionLoadingId(referralId);
    try {
      const res = await fetch(`/api/referrals/${referralId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to cancel referral");
      }

      fetchReferrals();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBatchRespond = async (batchId, action) => {
    setBatchActionLoading(`${batchId}-${action}`);
    try {
      const res = await fetch(`/api/referrals/batch/${batchId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || `Failed to ${action} batch`);
      }

      fetchReferrals();
    } catch (err) {
      setError(err.message);
    } finally {
      setBatchActionLoading(null);
    }
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case "emergency":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            🚨 Emergency
          </span>
        );
      case "urgent":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            ⚡ Urgent
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Routine
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            Accepted
          </span>
        );
      case "declined":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3 h-3" />
            Declined
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800 animate-pulse">
            <Clock className="w-3 h-3" />
            Pending Action
          </span>
        );
    }
  };

  const pendingIncomingCount = incoming.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-xs font-semibold mb-1">
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Inter-Clinician Consultations</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Clinical Referrals &amp; Patient Transfers
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review specialist handover requests, manage patient transitions, and respond to emergency leave batches.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchReferrals}
            disabled={loading}
            className="gap-1.5 text-xs text-slate-600 dark:text-slate-300 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Referrals</span>
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center justify-between text-xs text-rose-800 dark:text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError("")} className="font-bold underline text-rose-700 ml-2">
              Dismiss
            </button>
          </div>
        )}

        {/* Batch Action Banners (if any pending batches in incoming) */}
        {activeTab === "incoming" && pendingBatches.length > 0 && (
          <div className="space-y-3">
            {pendingBatches.map((batch) => (
              <div
                key={batch.batchId}
                className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border-2 border-amber-300 dark:border-amber-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase text-amber-900 dark:text-amber-300">
                        Emergency Leave Transfer Batch
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-600 text-white font-mono">
                        {batch.referrals.length} Patients
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                      <strong>{batch.fromDoctor}</strong> is on emergency leave and requested you to accept their scheduled visits.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleBatchRespond(batch.batchId, "accept")}
                    disabled={Boolean(batchActionLoading)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-sm"
                  >
                    {batchActionLoading === `${batch.batchId}-accept` ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Accept All ({batch.referrals.length})</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBatchRespond(batch.batchId, "decline")}
                    disabled={Boolean(batchActionLoading)}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 gap-1.5"
                  >
                    {batchActionLoading === `${batch.batchId}-decline` ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <X className="w-3.5 h-3.5" />
                    )}
                    <span>Decline Batch</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
          <button
            type="button"
            onClick={() => setActiveTab("incoming")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-2xl border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "incoming"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 shadow-xs"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Incoming Referrals</span>
            {pendingIncomingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white font-mono">
                {pendingIncomingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("outgoing")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-2xl border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "outgoing"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 shadow-xs"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Outgoing Referrals ({outgoing.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            <span className="text-xs">Loading referrals...</span>
          </div>
        ) : (
          <div>
            {activeTab === "incoming" ? (
              incoming.length === 0 ? (
                <div className="py-16 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs p-8 space-y-2 text-slate-400 dark:text-slate-500">
                  <Inbox className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No incoming referrals</p>
                  <p className="text-xs">When colleagues refer patients to you, they will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {incoming.map((ref) => (
                    <div
                      key={ref._id}
                      className={`bg-white dark:bg-slate-800 rounded-3xl border p-5 flex flex-col justify-between space-y-4 shadow-xs transition-all ${
                        ref.conflict && ref.status === "pending"
                          ? "border-amber-400 dark:border-amber-700 ring-2 ring-amber-200/60 dark:ring-amber-950"
                          : "border-slate-200/80 dark:border-slate-700"
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Header: Urgency + Status */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {getUrgencyBadge(ref.urgency)}
                            {ref.type === "emergency-leave" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200">
                                Emergency Leave Transfer
                              </span>
                            )}
                          </div>
                          {getStatusBadge(ref.status)}
                        </div>

                        {/* Patient info */}
                        <div>
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <User className="w-4 h-4 text-blue-600" />
                              <span>{ref.patient?.name || "Student"}</span>
                            </h3>
                            {ref.patient?.regNo && (
                              <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                                {ref.patient.regNo}
                              </span>
                            )}
                          </div>

                          {ref.patient?.phone && (
                            <a
                              href={`tel:${ref.patient.phone}`}
                              className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 mt-0.5 font-semibold"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{ref.patient.phone}</span>
                            </a>
                          )}
                        </div>

                        {/* Referring Doctor Info */}
                        <div className="text-xs text-slate-600 dark:text-slate-400 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-750/60 border border-slate-100 dark:border-slate-700/60">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                            Referred By:
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {ref.fromDoctor?.name}
                          </span>
                          {ref.fromDoctor?.medicalDepartment && (
                            <span> • {ref.fromDoctor.medicalDepartment}</span>
                          )}
                        </div>

                        {/* Reason & Note */}
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                            Clinical Reason:
                          </span>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {ref.reason}
                          </p>
                          {ref.note && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50/70 dark:bg-slate-750/50 p-2 rounded-xl">
                              &ldquo;{ref.note}&rdquo;
                            </p>
                          )}
                        </div>

                        {/* Associated Appointment Details */}
                        {ref.appointment && (
                          <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-300 space-y-1">
                            <span className="font-bold flex items-center gap-1 text-[11px]">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Scheduled Slot: {ref.appointment.date} at {ref.appointment.startTime} - {ref.appointment.endTime}</span>
                            </span>
                            {ref.appointment.service && (
                              <p className="text-[11px] text-blue-700 dark:text-blue-400">
                                Service: {ref.appointment.service}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Schedule Conflict Warning */}
                        {ref.conflict && ref.status === "pending" && (
                          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold">Schedule Conflict Alert</p>
                              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                                You already have another appointment booked at this exact date &amp; time. You can still accept, but will need to manage double-booking.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Response Note (if responded) */}
                        {ref.responseNote && (
                          <div className="text-[11px] text-slate-500 p-2 bg-slate-50 dark:bg-slate-750 rounded-xl">
                            <span className="font-bold">Response Note: </span>
                            <span>{ref.responseNote}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions for Pending Incoming */}
                      {ref.status === "pending" && (
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => setRespondingReferral({ referral: ref, action: "accept" })}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRespondingReferral({ referral: ref, action: "decline" })}
                            className="flex-1 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 gap-1.5"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Decline</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* Outgoing Referrals */
              outgoing.length === 0 ? (
                <div className="py-16 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs p-8 space-y-2 text-slate-400 dark:text-slate-500">
                  <Send className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No outgoing referrals</p>
                  <p className="text-xs">Use the &ldquo;Refer Patient&rdquo; button on any appointment or patient card to refer care.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {outgoing.map((ref) => (
                    <div
                      key={ref._id}
                      className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 p-5 flex flex-col justify-between space-y-4 shadow-xs"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {getUrgencyBadge(ref.urgency)}
                            {ref.type === "emergency-leave" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                                Leave Transfer
                              </span>
                            )}
                          </div>
                          {getStatusBadge(ref.status)}
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <User className="w-4 h-4 text-blue-600" />
                              <span>{ref.patient?.name || "Student"}</span>
                            </h3>
                            {ref.patient?.regNo && (
                              <span className="font-mono text-xs font-bold text-slate-500">
                                {ref.patient.regNo}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-xs text-slate-600 dark:text-slate-400 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-750/60 border border-slate-100 dark:border-slate-700/60">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                            Referred To:
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {ref.toDoctor?.name}
                          </span>
                          {ref.toDoctor?.medicalDepartment && (
                            <span> • {ref.toDoctor.medicalDepartment}</span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                            Reason:
                          </span>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {ref.reason}
                          </p>
                          {ref.note && (
                            <p className="text-xs text-slate-500 italic bg-slate-50/70 dark:bg-slate-750/50 p-2 rounded-xl">
                              &ldquo;{ref.note}&rdquo;
                            </p>
                          )}
                        </div>

                        {ref.responseNote && (
                          <div className="text-[11px] text-slate-500 p-2 bg-slate-50 dark:bg-slate-750 rounded-xl">
                            <span className="font-bold">Colleague Response: </span>
                            <span>{ref.responseNote}</span>
                          </div>
                        )}
                      </div>

                      {/* Cancel action if still pending */}
                      {ref.status === "pending" && (
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelOutgoing(ref._id)}
                            disabled={actionLoadingId === ref._id}
                            className="text-xs text-slate-600 dark:text-slate-300 hover:text-rose-600"
                          >
                            {actionLoadingId === ref._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              "Cancel Referral"
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}

      {/* Response Note Modal (Accept / Decline with note) */}
      {respondingReferral && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                {respondingReferral.action} Referral
              </h3>
              <button
                type="button"
                onClick={() => setRespondingReferral(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Confirm {respondingReferral.action}ing referral for{" "}
              <strong>{respondingReferral.referral.patient?.name}</strong> from{" "}
              <strong>{respondingReferral.referral.fromDoctor?.name}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Handover / Response Note <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder={
                  respondingReferral.action === "accept"
                    ? "e.g. Reviewed symptoms; will follow up on lab tests during scheduled slot."
                    : "e.g. Schedule is at capacity; recommend counseling department..."
                }
                value={responseNote}
                onChange={(e) => setResponseNote(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRespondingReferral(null)}
                disabled={submittingResponse}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleRespondSingle}
                disabled={submittingResponse}
                className={`text-xs text-white font-bold ${
                  respondingReferral.action === "accept"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {submittingResponse ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : null}
                <span>Confirm {respondingReferral.action}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
