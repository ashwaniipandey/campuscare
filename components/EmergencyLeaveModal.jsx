"use client";

import { useState, useEffect } from "react";
import {
  X,
  AlertOctagon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmergencyLeaveModal({ isOpen, onClose, currentDoctorDepartment, onSuccess }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setError("");
      setResult(null);
      setReason("");
      setSelectedDoctorId("");
      return;
    }

    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch("/api/doctors");
        if (res.ok) {
          const data = await res.json();
          // Sort doctors: same department first
          const sorted = (data.doctors || []).sort((a, b) => {
            const aSame = a.medicalDepartment === currentDoctorDepartment ? -1 : 1;
            const bSame = b.medicalDepartment === currentDoctorDepartment ? -1 : 1;
            return aSame - bSame;
          });
          setDoctors(sorted);
        }
      } catch (err) {
        console.error("Failed to load clinicians:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isOpen, currentDoctorDepartment]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedDoctorId) {
      setError("Please select a receiving clinician.");
      return;
    }

    if (!reason.trim()) {
      setError("Please provide a reason for the emergency leave transfer.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/referrals/emergency-leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toDoctorId: selectedDoctorId,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process emergency leave transfer");
      }

      const chosenDoc = doctors.find((d) => d._id === selectedDoctorId);
      setResult({
        count: data.count,
        doctorName: chosenDoc?.name || "the designated doctor",
        batchId: data.batchId,
      });

      if (onSuccess) onSuccess();
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
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Emergency Leave &amp; Patient Transfer
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Immediately hand over pending visits for today and the next 2 days
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

        {result ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Emergency Transfer Initiated
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Successfully created transfer requests for <strong>{result.count} patient(s)</strong> to{" "}
                <strong>{result.doctorName}</strong>.
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                Your duty status was set to <strong>Off-Duty</strong> and your open unbooked slots for the next 3 days were cleared. All affected students have been notified.
              </p>
            </div>
            <Button
              type="button"
              onClick={onClose}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-6"
            >
              Done / Return to Dashboard
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 rounded-2xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <span>⚠️</span> Automatic Actions on Submission:
              </p>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px] opacity-90">
                <li>All pending and confirmed visits for today &amp; the next 2 days will be batched and requested to transfer.</li>
                <li>Your clinical duty status will immediately change to <strong>Off-Duty</strong>.</li>
                <li>Your open, unbooked slots for those 3 days will be removed from the public directory.</li>
              </ul>
            </div>

            {/* Receiving Doctor */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Designated Receiving Clinician *
              </label>
              {loading ? (
                <div className="p-2.5 text-xs text-slate-400 flex items-center gap-2 border rounded-xl">
                  <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                  <span>Loading clinicians...</span>
                </div>
              ) : (
                <select
                  required
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                >
                  <option value="">-- Choose on-call colleague --</option>
                  {doctors.map((doc) => {
                    const isSame = doc.medicalDepartment === currentDoctorDepartment;
                    const isAvail = doc.dutyStatus === "available";
                    return (
                      <option key={doc._id} value={doc._id}>
                        {isSame ? "★ [Same Dept] " : ""}{doc.name} • {doc.staffId || "DOC"} ({doc.medicalDepartment || "General"}) —{" "}
                        {isAvail ? "🟢 Available" : doc.dutyStatus === "busy" ? "🟠 Busy" : "⚪ Off-Duty"}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Emergency Absence *
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Sudden acute illness, family medical emergency, campus quarantine..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden resize-none"
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
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold gap-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Transferring Patients...</span>
                  </>
                ) : (
                  <span>Confirm Emergency Transfer</span>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
