"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  PhoneCall,
  MapPin,
  X,
  Radio,
  CheckCircle2,
  Clock,
  Loader2,
  Navigation,
  AlertCircle,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Dynamically import EmergencyMap for read-only preview
const EmergencyMap = dynamic(() => import("@/components/EmergencyMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[180px] bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse flex items-center justify-center text-slate-400 text-xs">
      Loading location preview...
    </div>
  ),
});

const EMERGENCY_TYPES = [
  { id: "medical", label: "Medical Crisis", desc: "Fainting, seizure, breathing difficulty" },
  { id: "injury", label: "Physical Injury", desc: "Bleeding, fractures, falls, severe burn" },
  { id: "mental-health", label: "Mental Health", desc: "Panic attack, severe anxiety, crisis" },
  { id: "other", label: "Other Hazard", desc: "Fire, environmental risk, assault" },
];

export default function EmergencyModal({ isOpen, onClose }) {
  const { data: session, status: authStatus } = useSession();

  // Location states
  const [geoState, setGeoState] = useState({
    loading: false,
    coords: null,
    error: null,
  });
  const [manualLocation, setManualLocation] = useState("");

  // Form states
  const [selectedType, setSelectedType] = useState("medical");
  const [needsAmbulance, setNeedsAmbulance] = useState(true);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Active emergency tracking & polling
  const [activeEmergency, setActiveEmergency] = useState(null);
  const pollTimerRef = useRef(null);

  // Poll student's latest emergency status
  const fetchMyEmergency = useCallback(async () => {
    if (authStatus !== "authenticated" || session?.user?.role !== "student") return;
    try {
      const res = await fetch("/api/emergencies/mine");
      if (res.ok) {
        const data = await res.json();
        if (data.emergency && (data.emergency.status === "new" || data.emergency.status === "responded")) {
          setActiveEmergency(data.emergency);
        } else if (data.emergency && data.emergency.status === "resolved") {
          setActiveEmergency((prev) => (prev?._id === data.emergency._id ? data.emergency : prev));
        }
      }
    } catch (e) {
      console.error("Error polling emergency status:", e);
    }
  }, [authStatus, session]);

  // Request browser location
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoState({ loading: false, coords: null, error: "Geolocation is not supported by your browser." });
      return;
    }

    setGeoState({ loading: true, coords: null, error: null });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoState({
          loading: false,
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          error: null,
        });
      },
      (err) => {
        setGeoState({
          loading: false,
          coords: null,
          error: err.message || "Location permission denied. Please enter your location manually below.",
        });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );
  }, []);

  // When modal opens, auto-request geolocation and check if there's already an active emergency
  useEffect(() => {
    if (isOpen && (!session || session?.user?.role === "student")) {
      requestLocation();
      fetchMyEmergency();
    }
  }, [isOpen, session, requestLocation, fetchMyEmergency]);

  // Polling loop every 5 seconds when emergency is active
  useEffect(() => {
    if (isOpen && activeEmergency && activeEmergency.status !== "resolved") {
      pollTimerRef.current = setInterval(fetchMyEmergency, 5000);
    } else {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    }
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isOpen, activeEmergency, fetchMyEmergency]);

  // Role-based gate: only students and logged-out visitors may see the SOS modal
  if (!isOpen) return null;
  if (authStatus === "authenticated" && session?.user?.role !== "student") return null;

  const campusSecurityPhone = process.env.NEXT_PUBLIC_CAMPUS_SECURITY_PHONE?.trim();

  const handleSendSOS = async (e) => {
    e.preventDefault();
    if (authStatus !== "authenticated") {
      setSubmitError("Please sign in as a student to trigger live dispatch.");
      return;
    }
    if (session?.user?.role !== "student") {
      setSubmitError("Only students can transmit an Emergency SOS.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const payload = {
        type: selectedType,
        needsAmbulance: Boolean(needsAmbulance),
        description,
        location: {
          latitude: geoState.coords?.latitude || null,
          longitude: geoState.coords?.longitude || null,
          manualLocation: manualLocation.trim(),
        },
      };

      const res = await fetch("/api/emergencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to transmit emergency SOS");
      }

      setActiveEmergency(data.emergency);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#111a2e] rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-900/40 text-slate-900 dark:text-foreground overflow-hidden my-6 transition-colors"
        >
          {/* Red Header Bar */}
          <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <AlertTriangle className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Campus Emergency SOS</h3>
                <p className="text-xs text-rose-100">Live Campus Response & First Aid</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close emergency modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {/* Quick 112 / Campus Security Dial */}
            {campusSecurityPhone ? (
              <div className="grid grid-cols-2 gap-3 mb-3">
                <a
                  href="tel:112"
                  className="flex items-center justify-center gap-2 p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
                >
                  <PhoneCall className="w-4 h-4 shrink-0" />
                  <span>Dial 112 Emergency</span>
                </a>
                <a
                  href={`tel:${campusSecurityPhone}`}
                  className="flex items-center justify-center gap-2 p-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
                >
                  <Radio className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Campus Security</span>
                </a>
              </div>
            ) : (
              <div className="mb-3">
                <a
                  href="tel:112"
                  className="w-full flex items-center justify-center gap-2 p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
                >
                  <PhoneCall className="w-4 h-4 shrink-0" />
                  <span>Dial 112 Emergency</span>
                </a>
              </div>
            )}

            {/* Safety Notice Callout */}
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-start gap-2.5 text-xs text-rose-900 dark:text-rose-200 mb-4">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="font-semibold text-rose-950 dark:text-rose-300">Safety Notice: </strong>
                This is a campus project. In a life-threatening emergency, call your local emergency number (112 in India) immediately.
              </p>
            </div>

            {/* If logged-out visitor: Do not allow sending an SOS */}
            {authStatus !== "authenticated" ? (
              <div className="p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Please log in as a student to send an SOS
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Emergency SOS dispatch with GPS building detection and ambulance alerts requires an active student account.
                  </p>
                </div>
                <div className="pt-2">
                  <Link href="/login" onClick={handleClose}>
                    <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs h-10 shadow-sm">
                      Login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : activeEmergency ? (
              /* If there's an active or recently resolved emergency */
              <div className="space-y-4">
                <div
                  className={`p-5 rounded-2xl border ${
                    activeEmergency.status === "new"
                      ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                      : activeEmergency.status === "responded"
                      ? "bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200"
                      : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {activeEmergency.status === "new" && (
                      <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center animate-pulse">
                        <Clock className="w-5 h-5" />
                      </div>
                    )}
                    {activeEmergency.status === "responded" && (
                      <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400 flex items-center justify-center animate-bounce">
                        <UserCheck className="w-5 h-5" />
                      </div>
                    )}
                    {activeEmergency.status === "resolved" && (
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}

                    <div>
                      <h4 className="font-bold text-sm text-foreground">
                        {activeEmergency.status === "new" && "SOS Broadcasted: Help Requested"}
                        {activeEmergency.status === "responded" && "Responder Assigned: Staff is On The Way!"}
                        {activeEmergency.status === "resolved" && "Incident Resolved"}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {activeEmergency.status === "new" && "Waiting for campus health staff to accept dispatch..."}
                        {activeEmergency.status === "responded" &&
                          `Responded by ${activeEmergency.respondedBy?.name || "Campus Medic"}. Keep your phone close.`}
                        {activeEmergency.status === "resolved" && "Your emergency call has been closed. Stay safe!"}
                      </p>
                    </div>
                  </div>

                  {/* Read-only map with student's own location marker */}
                  {activeEmergency.location?.latitude && activeEmergency.location?.longitude ? (
                    <div className="mt-3 space-y-1.5">
                      <EmergencyMap
                        emergencies={[activeEmergency]}
                        height="180px"
                        readOnly={true}
                        zoom={16}
                      />
                      <p className="text-[11px] font-semibold text-teal-800 dark:text-teal-300 text-center flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        <span>Your location was shared with campus health staff</span>
                      </p>
                    </div>
                  ) : activeEmergency.location?.manualLocation ? (
                    <div className="mt-2 p-2.5 bg-white/70 dark:bg-slate-900/70 rounded-xl border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200">
                      <span className="font-bold">Manual Location: </span>
                      <span>{activeEmergency.location.manualLocation}</span>
                      <p className="text-[11px] text-teal-700 dark:text-teal-400 mt-0.5">Your location was shared with campus health staff</p>
                    </div>
                  ) : null}

                  {/* Ambulance Status Section */}
                  {activeEmergency.needsAmbulance && (
                    <div className="mt-3 p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">🚑</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">Ambulance Dispatch:</span>
                      </div>

                      {activeEmergency.ambulanceStatus === "searching" && (
                        <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold animate-pulse">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Searching for nearby ambulance...</span>
                        </div>
                      )}

                      {activeEmergency.ambulanceStatus === "accepted" && (
                        <div className="space-y-1">
                          <div className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>
                              Ambulance {activeEmergency.assignedAmbulance?.vehicleNumber || ""} is on the way
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                            Driver: <span className="font-semibold text-slate-900 dark:text-white">{activeEmergency.assignedAmbulance?.driverName || "Driver"}</span>
                            {activeEmergency.assignedAmbulance?.driverPhone && (
                              <>
                                {" "}• Contact:{" "}
                                <a
                                  href={`tel:${activeEmergency.assignedAmbulance.driverPhone}`}
                                  className="text-blue-600 dark:text-blue-400 underline font-bold"
                                >
                                  {activeEmergency.assignedAmbulance.driverPhone}
                                </a>
                              </>
                            )}
                            {activeEmergency.assignedAmbulance?.distanceKm != null && (
                              <> • Distance: {activeEmergency.assignedAmbulance.distanceKm} km</>
                            )}
                          </p>
                        </div>
                      )}

                      {activeEmergency.ambulanceStatus === "picked-up" && (
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          <span>Picked up</span>
                        </div>
                      )}

                      {activeEmergency.ambulanceStatus === "completed" && (
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Completed</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-white/10 text-xs space-y-1 opacity-90 text-slate-700 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span className="font-medium">Incident Type:</span>
                      <span className="capitalize font-bold text-slate-900 dark:text-white">{activeEmergency.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Transmitted at:</span>
                      <span>{new Date(activeEmergency.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                {activeEmergency.status === "resolved" ? (
                  <Button
                    onClick={() => setActiveEmergency(null)}
                    variant="outline"
                    className="w-full text-xs font-semibold"
                  >
                    Done / Close Notification
                  </Button>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 py-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600 dark:text-teal-400" />
                    <span>Auto-refreshing status every 5 seconds...</span>
                  </div>
                )}
              </div>
            ) : (
              /* Emergency SOS Trigger Form for Students */
              <form onSubmit={handleSendSOS} className="space-y-4">
                {/* Emergency Type Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Select Emergency Category:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {EMERGENCY_TYPES.map((t) => {
                      const isSelected = selectedType === t.id;
                      return (
                        <button
                          type="button"
                          key={t.id}
                          onClick={() => {
                            setSelectedType(t.id);
                            setNeedsAmbulance(t.id === "medical" || t.id === "injury");
                          }}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "border-rose-500 dark:border-rose-500 bg-rose-50/80 dark:bg-rose-950/50 text-rose-950 dark:text-rose-100 ring-2 ring-rose-300 dark:ring-rose-500/60"
                              : "border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800/90 text-foreground"
                          }`}
                        >
                          <p className={`text-xs font-bold ${isSelected ? "text-rose-950 dark:text-rose-100" : "text-foreground"}`}>
                            {t.label}
                          </p>
                          <p className={`text-[10px] line-clamp-1 ${isSelected ? "text-rose-700 dark:text-rose-300" : "text-muted-foreground"}`}>
                            {t.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Geolocation & Location Section */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Your Campus Location:
                    </label>
                    <button
                      type="button"
                      onClick={requestLocation}
                      className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1"
                    >
                      <Navigation className="w-3 h-3" />
                      Re-detect GPS
                    </button>
                  </div>

                  {geoState.loading ? (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                      <span>Detecting your live GPS coordinates...</span>
                    </div>
                  ) : geoState.coords ? (
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                      <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-medium">
                        GPS Locked: {geoState.coords.latitude.toFixed(5)}, {geoState.coords.longitude.toFixed(5)}
                      </span>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span>{geoState.error || "GPS unavailable. Please specify your location below."}</span>
                      </div>
                    </div>
                  )}

                  {/* Manual Location / Building Field */}
                  <div className="mt-2 relative">
                    <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-2.5" />
                    <input
                      type="text"
                      value={manualLocation}
                      onChange={(e) => setManualLocation(e.target.value)}
                      placeholder="e.g. Science Complex Room 304, North Quad B..."
                      className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                {/* Description Textarea */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    What is happening? <span className="font-normal text-slate-400 dark:text-slate-500">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of patient condition or hazards..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                  />
                </div>

                {/* Need an ambulance checkbox */}
                <div className="flex items-center gap-2.5 p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30">
                  <input
                    type="checkbox"
                    id="needAmbulanceCheck"
                    checked={needsAmbulance}
                    onChange={(e) => setNeedsAmbulance(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded border-slate-300 dark:border-slate-600 focus:ring-rose-500 cursor-pointer accent-rose-600"
                  />
                  <label
                    htmlFor="needAmbulanceCheck"
                    className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center gap-1.5 select-none"
                  >
                    <span>🚑</span>
                    <span>Need an ambulance</span>
                  </label>
                </div>

                {submitError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-center gap-2 text-xs text-rose-800 dark:text-rose-300">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Big Red SOS Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting || authStatus !== "authenticated"}
                  className="w-full h-12 text-sm font-bold bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-700 hover:to-red-800 text-white rounded-xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Transmitting Distress Signal...</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5" />
                      <span>Transmit Emergency SOS</span>
                    </>
                  )}
                </Button>
                <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
                  Alerts campus medical triage and university dispatch immediately.
                </p>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
