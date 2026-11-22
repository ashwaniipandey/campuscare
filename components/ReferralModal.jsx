"use client";

import { useState, useEffect } from "react";
import {
  X,
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  Stethoscope,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReferralModal({
  isOpen,
  onClose,
  patient, // { _id, name, regNo, phone }
  appointmentId = null,
  emergencyId = null,
  onSuccess,
}) {
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [urgency, setUrgency] = useState("routine");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setError("");
      setSuccess(false);
      setReason("");
      setNote("");
      setSelectedDoctorId("");
      return;
    }

    async function fetchDoctors() {
      setLoadingDoctors(true);
      try {
        const res = await fetch("/api/doctors", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setDoctors(data.doctors || []);
        }
      } catch (err) {
        console.error("Failed to load clinicians for referral:", err);
      } finally {
        setLoadingDoctors(false);
      }
    }

    fetchDoctors();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedDoctorId) {
      setError("Please select a target clinician to receive the referral.");
      return;
    }

    if (!reason.trim()) {
      setError("Please provide a clinical reason for this referral.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        patientId: patient?._id,
        regNo: patient?.regNo,
        toDoctorId: selectedDoctorId,
        urgency,
        reason: reason.trim(),
        note: note.trim(),
        appointmentId,
        emergencyId,
      };

      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create referral");
      }

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess(data.referral);
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Refer Patient to Specialist
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Patient: <span className="font-semibold text-slate-700 dark:text-slate-200">{patient?.name || "Student"}</span>
                {patient?.regNo && ` (${patient.regNo})`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center gap-2 text-xs text-rose-800 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-6 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-in zoom-in" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Referral Successfully Created!
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Target doctor and student have been notified.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Target Doctor Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Specialist / Clinician *
              </label>
              {loadingDoctors ? (
                <div className="p-2.5 text-xs text-slate-400 flex items-center gap-2 border rounded-xl">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Loading doctors directory...</span>
                </div>
              ) : (
                <select
                  required
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="">-- Choose receiving doctor --</option>
                  {doctors.map((doc) => {
                    const isAvail = doc.dutyStatus === "available";
                    const docIdStr = String(doc._id);
                    return (
                      <option key={docIdStr} value={docIdStr}>
                        {doc.name} • {doc.staffId || "DOC"} ({doc.medicalDepartment || "General"}) —{" "}
                        {isAvail ? "🟢 Available" : doc.dutyStatus === "busy" ? "🟠 Busy" : "⚪ Off-Duty"}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Clinical Urgency Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "routine", label: "Routine", desc: "Non-critical consult", color: "border-slate-200 dark:border-slate-700" },
                  { id: "urgent", label: "Urgent", desc: "Within 24-48 hours", color: "border-amber-300 text-amber-700 dark:text-amber-400" },
                  { id: "emergency", label: "Emergency", desc: "Immediate review", color: "border-rose-400 text-rose-700 dark:text-rose-400" },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setUrgency(item.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      urgency === item.id
                        ? "bg-blue-50 dark:bg-blue-950/60 border-blue-600 dark:border-blue-500 ring-2 ring-blue-300 dark:ring-blue-800"
                        : "bg-slate-50/50 dark:bg-slate-750/50 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span className="block text-xs font-bold capitalize">{item.label}</span>
                    <span className="text-[10px] text-slate-400 line-clamp-1">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Primary Reason / Chief Complaint *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Suspected fracture, persistent dermatological flare-up..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Clinical Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Clinical Observations &amp; Handover Notes <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Relevant patient history, symptoms observed, vitals, or requested diagnostic tests..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={submitting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Transmitting...
                  </>
                ) : (
                  "Submit Referral"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
