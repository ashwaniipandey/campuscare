"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Clock,
  Phone,
  User,
  MapPin,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  Radio,
  RefreshCw,
  Activity,
  UserCheck,
  Navigation,
  ArrowRightLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ReferralModal from "@/components/ReferralModal";

// Dynamically import EmergencyMap to prevent Leaflet SSR issues
const EmergencyMap = dynamic(() => import("@/components/EmergencyMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[420px] bg-slate-100 rounded-3xl animate-pulse flex flex-col items-center justify-center text-slate-400 gap-2">
      <Loader2 className="w-7 h-7 animate-spin text-rose-500" />
      <span className="text-xs font-medium">Loading live campus emergency map...</span>
    </div>
  ),
});

function playBeepSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
    osc.frequency.setValueAtTime(660, audioCtx.currentTime + 0.15); // E5

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
  } catch (e) {
    console.error("Audio error:", e);
  }
}

function ElapsedTimer({ createdAt }) {
  const [elapsed, setElapsed] = useState("00:00");

  useEffect(() => {
    function update() {
      const diffMs = Math.max(0, Date.now() - new Date(createdAt).getTime());
      const totalSec = Math.floor(diffMs / 1000);
      const min = String(Math.floor(totalSec / 60)).padStart(2, "0");
      const sec = String(totalSec % 60).padStart(2, "0");
      setElapsed(`${min}:${sec}`);
    }

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [createdAt]);

  return <span>{elapsed}</span>;
}

export default function StaffEmergenciesPage() {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newAlertBanner, setNewAlertBanner] = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [referralEmergency, setReferralEmergency] = useState(null);

  const prevCountRef = useRef(0);
  const pollTimerRef = useRef(null);

  const fetchActiveEmergencies = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/emergencies/active");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load emergencies");

      const activeList = data.emergencies || [];
      const newOnly = activeList.filter((e) => e.status === "new");

      // Sound notification trigger when new emergency arrives
      if (silent && newOnly.length > prevCountRef.current) {
        if (soundEnabled) playBeepSound();
        setNewAlertBanner(true);
        setTimeout(() => setNewAlertBanner(false), 8000);
      }

      prevCountRef.current = newOnly.length;
      setEmergencies(activeList);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [soundEnabled]);

  useEffect(() => {
    fetchActiveEmergencies();
    pollTimerRef.current = setInterval(() => fetchActiveEmergencies(true), 5000);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [fetchActiveEmergencies]);

  const handleAction = async (id, action) => {
    setUpdatingId(id + action);
    try {
      const res = await fetch(`/api/emergencies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      if (action === "resolve") {
        setEmergencies((prev) => prev.filter((e) => e._id !== id));
        if (selectedEmergency?._id === id) setSelectedEmergency(null);
      } else {
        setEmergencies((prev) =>
          prev.map((e) => (e._id === id ? data.emergency : e))
        );
        if (selectedEmergency?._id === id) setSelectedEmergency(data.emergency);
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCardClick = (emg) => {
    if (emg.location?.latitude && emg.location?.longitude) {
      setSelectedEmergency(emg);
      // Smooth scroll up to map if on small screen
      if (window.innerWidth < 768) {
        window.scrollTo({ top: 100, behavior: "smooth" });
      }
    }
  };

  const newEmergencies = emergencies.filter((e) => e.status === "new");
  const respondedEmergencies = emergencies.filter((e) => e.status === "responded");

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border rounded-2xl p-4 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            Emergency Response Dispatch
            {newEmergencies.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white animate-pulse">
                {newEmergencies.length} ACTIVE
              </span>
            )}
          </h1>
          <p className="text-xs text-muted-foreground">Live campus emergency telemetry &amp; map</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              soundEnabled
                ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                : "bg-muted border-border text-muted-foreground"
            }`}
            title="Toggle Alert Chime"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? "Audio On" : "Muted"}</span>
          </button>
          <button
            onClick={() => fetchActiveEmergencies()}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Refresh Now"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* New Emergency Broadcast Banner */}
      <AnimatePresence>
        {newAlertBanner && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-600 text-white px-4 py-2.5 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-md animate-pulse rounded-2xl"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>CRITICAL ALERT: New Student SOS Transmitted! Respond immediately.</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {/* ── 1. LIVE EMERGENCY MAP AT TOP ────────────────────────────────────── */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Navigation className="w-4 h-4 text-rose-600" />
              Live Campus Incident Map
            </h2>
            <span className="text-[11px] text-slate-400">
              {emergencies.filter((e) => e.location?.latitude).length} active beacon(s) mapped · Auto-updates
            </span>
          </div>

          <EmergencyMap
            emergencies={emergencies}
            selectedEmergency={selectedEmergency}
            height="420px"
          />
        </section>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
            <p className="text-sm font-medium">Scanning live emergency frequencies...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-center gap-3 text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
            <button onClick={() => fetchActiveEmergencies()} className="ml-auto underline font-bold text-xs">
              Retry
            </button>
          </div>
        ) : emergencies.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3 p-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-base font-bold text-slate-900">No Active Emergencies</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All quiet on campus. Emergency channels are scanning live every 5 seconds.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* New Unresponded Emergencies */}
            {newEmergencies.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-rose-600 animate-ping" />
                    Incoming SOS Broadcasts ({newEmergencies.length})
                  </h2>
                  <span className="text-[11px] text-slate-400">Click a card to focus on map</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {newEmergencies.map((emg) => {
                    const hasCoords = !!(emg.location?.latitude && emg.location?.longitude);
                    const isSelected = selectedEmergency?._id === emg._id;

                    return (
                      <motion.div
                        key={emg._id}
                        initial={{ scale: 0.96, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={() => handleCardClick(emg)}
                        className={`bg-white rounded-3xl border-2 p-5 relative overflow-hidden flex flex-col justify-between cursor-pointer transition-all ${
                          isSelected
                            ? "border-rose-600 ring-4 ring-rose-200/60 shadow-xl"
                            : "border-rose-400 hover:border-rose-500 shadow-md"
                        }`}
                      >
                        <div className="absolute top-0 right-0 bg-rose-600 text-white font-mono text-xs font-extrabold px-3 py-1 rounded-bl-2xl flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Waiting </span>
                          <ElapsedTimer createdAt={emg.createdAt} />
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 uppercase tracking-wide">
                              {emg.type}
                            </span>
                            {emg.needsAmbulance && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <span>🚑</span>
                                <span>
                                  {emg.ambulanceStatus === "searching"
                                    ? "Ambulance: Searching..."
                                    : emg.ambulanceStatus === "accepted"
                                    ? `Ambulance: On The Way (${emg.assignedAmbulance?.vehicleNumber || "Assigned"})`
                                    : emg.ambulanceStatus === "picked-up"
                                    ? `Ambulance: Picked Up (${emg.assignedAmbulance?.vehicleNumber || "Assigned"})`
                                    : emg.ambulanceStatus === "completed"
                                    ? "Ambulance: Handover Done"
                                    : "Ambulance: Dispatched"}
                                </span>
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400">
                              {new Date(emg.createdAt).toLocaleTimeString()}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                              <User className="w-4 h-4 text-slate-400 shrink-0" />
                              {emg.student?.name}
                            </h3>
                            {emg.student?.phone && (
                              <a
                                href={`tel:${emg.student.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1 mt-0.5"
                              >
                                <Phone className="w-3 h-3" />
                                {emg.student.phone}
                              </a>
                            )}
                            <p className="text-xs text-slate-500 mt-0.5">{emg.student?.email}</p>
                          </div>

                          {emg.description && (
                            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 text-xs text-rose-900 font-medium italic">
                              "{emg.description}"
                            </div>
                          )}

                          {/* Location Details */}
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                            <div className="flex items-start gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="font-bold text-slate-800">
                                  {emg.location?.manualLocation || "Campus Location"}
                                </p>
                                {hasCoords ? (
                                  <p className="font-mono text-[11px] text-slate-500">
                                    GPS: {emg.location.latitude.toFixed(5)}, {emg.location.longitude.toFixed(5)}
                                  </p>
                                ) : (
                                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                    Location typed manually
                                  </span>
                                )}
                              </div>
                            </div>

                            {hasCoords && (
                              <div className="pt-1 flex items-center justify-between">
                                <a
                                  href={`https://www.google.com/maps?q=${emg.location.latitude},${emg.location.longitude}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:underline"
                                >
                                  <span>Open in Google Maps</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                                <span className="text-[10px] text-rose-600 font-semibold">
                                  Click card to fly on map →
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div
                          className="flex gap-2 pt-2 border-t border-slate-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            onClick={() => handleAction(emg._id, "respond")}
                            disabled={updatingId === emg._id + "respond"}
                            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold h-10 text-xs gap-1.5 shadow-md shadow-rose-600/20"
                          >
                            {updatingId === emg._id + "respond" ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Activity className="w-4 h-4" />
                                Accept &amp; Respond
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => handleAction(emg._id, "resolve")}
                            disabled={updatingId === emg._id + "resolve"}
                            variant="outline"
                            className="text-xs text-slate-600 hover:bg-slate-100 h-10 px-3"
                          >
                            Resolve
                          </Button>
                          <Button
                            onClick={() => setReferralEmergency(emg)}
                            variant="outline"
                            className="text-xs text-sky-700 hover:bg-sky-50 border-sky-300 h-10 px-3 font-semibold"
                            title="Refer patient to another clinician"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />
                            Refer
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* In-Progress / Responded Emergencies */}
            {respondedEmergencies.length > 0 && (
              <section className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-sky-600" />
                    Units Responding On-Scene ({respondedEmergencies.length})
                  </h2>
                  <span className="text-[11px] text-slate-400">Click card to view on map</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {respondedEmergencies.map((emg) => {
                    const hasCoords = !!(emg.location?.latitude && emg.location?.longitude);
                    const isSelected = selectedEmergency?._id === emg._id;

                    return (
                      <div
                        key={emg._id}
                        onClick={() => handleCardClick(emg)}
                        className={`bg-white rounded-3xl border p-5 space-y-3 cursor-pointer transition-all ${
                          isSelected
                            ? "border-sky-500 ring-4 ring-sky-100 shadow-lg"
                            : "border-sky-200 hover:border-sky-300 shadow-sm"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                              Responded by: {emg.respondedBy?.name || "Staff"}
                            </span>
                            {emg.needsAmbulance && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <span>🚑</span>
                                <span>
                                  {emg.ambulanceStatus === "searching"
                                    ? "Ambulance: Searching..."
                                    : emg.ambulanceStatus === "accepted"
                                    ? `Ambulance: On The Way (${emg.assignedAmbulance?.vehicleNumber || "Assigned"})`
                                    : emg.ambulanceStatus === "picked-up"
                                    ? `Ambulance: Picked Up (${emg.assignedAmbulance?.vehicleNumber || "Assigned"})`
                                    : emg.ambulanceStatus === "completed"
                                    ? "Ambulance: Completed"
                                    : "Ambulance Requested"}
                                </span>
                              </span>
                            )}
                          </div>
                          {emg.responseTimeSeconds !== null && (
                            <span className="text-[11px] font-mono text-slate-500">
                              Response Time: {emg.responseTimeSeconds}s
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-slate-900">{emg.student?.name}</h3>
                          <p className="text-xs text-slate-500">{emg.student?.phone} · {emg.student?.email}</p>
                        </div>

                        {emg.description && (
                          <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            "{emg.description}"
                          </p>
                        )}

                        <div className="text-xs text-slate-600 space-y-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold">Location: </span>
                              <span>{emg.location?.manualLocation || "Campus sector"}</span>
                            </div>
                            {!hasCoords && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                Location typed manually
                              </span>
                            )}
                          </div>
                          {hasCoords && (
                            <div className="pt-1 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                              <a
                                href={`https://www.google.com/maps?q=${emg.location.latitude},${emg.location.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sky-600 hover:underline inline-flex items-center gap-1 font-semibold text-[11px]"
                              >
                                Maps Location <ExternalLink className="w-3 h-3" />
                              </a>
                              <span className="text-[10px] text-sky-600">Click to focus map →</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            onClick={() => handleAction(emg._id, "resolve")}
                            disabled={updatingId === emg._id + "resolve"}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs gap-1.5"
                          >
                            {updatingId === emg._id + "resolve" ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                Mark Emergency Resolved
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => setReferralEmergency(emg)}
                            variant="outline"
                            className="text-xs text-sky-700 hover:bg-sky-50 border-sky-300 h-9 px-3 font-semibold"
                            title="Refer patient to another clinician"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />
                            Refer
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {referralEmergency && (
        <ReferralModal
          isOpen={!!referralEmergency}
          onClose={() => setReferralEmergency(null)}
          patient={referralEmergency.student}
          emergencyId={referralEmergency._id}
          onSuccess={() => {
            setReferralEmergency(null);
            fetchEmergencies(true);
          }}
        />
      )}
    </div>
  );
}
