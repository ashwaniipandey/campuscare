"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Truck,
  MapPin,
  Phone,
  Clock,
  Radio,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  AlertCircle,
  Navigation,
  Compass,
  Volume2,
  VolumeX,
  ShieldCheck,
  User,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";

// Dynamically import EmergencyMap for active pickup mini-map
const EmergencyMap = dynamic(() => import("@/components/EmergencyMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[220px] bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse flex items-center justify-center text-slate-400 text-xs">
      Loading pickup destination map...
    </div>
  ),
});

function playRequestBeep() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
    osc.frequency.setValueAtTime(1174.66, audioCtx.currentTime + 0.12); // D6

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.38);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.38);
  } catch (e) {
    console.error("Audio error:", e);
  }
}

function ElapsedSecondsTimer({ startedAt }) {
  const [sec, setSec] = useState(0);

  useEffect(() => {
    function tick() {
      if (!startedAt) return;
      const elapsed = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
      setSec(elapsed);
    }
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return <span>{m > 0 ? `${m}m ${s}s` : `${s}s`}</span>;
}

export default function AmbulanceDashboardPage() {
  // Ambulance Profile
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("offline");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Requests Data
  const [openRequests, setOpenRequests] = useState([]);
  const [takenRequests, setTakenRequests] = useState([]);
  const [myPickup, setMyPickup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Audio & Beep
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevOpenCountRef = useRef(0);
  const prevIdsRef = useRef(new Set());

  // GPS Live Tracking
  const [sharingLocation, setSharingLocation] = useState(false);
  const [currentCoords, setCurrentCoords] = useState(null);
  const [gpsError, setGpsError] = useState("");
  const watchIdRef = useRef(null);
  const locationIntervalRef = useRef(null);

  // Load Ambulance Profile
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/ambulance/me");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.ambulance);
        setStatus(data.ambulance.status || "offline");
        if (data.ambulance.location?.latitude != null) {
          setCurrentCoords({
            latitude: data.ambulance.location.latitude,
            longitude: data.ambulance.location.longitude,
          });
        }
      }
    } catch (e) {
      console.error("Error fetching ambulance profile:", e);
    }
  }, []);

  // Poll Requests (every 3 seconds)
  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/ambulance/requests");
      if (!res.ok) return;
      const data = await res.json();

      const newOpen = data.open || [];
      const newTaken = data.taken || [];
      const newMine = data.mine || null;

      // Detect if there's a new open request that wasn't there before
      const currentIds = new Set(newOpen.map((r) => r._id));
      let hasBrandNew = false;
      currentIds.forEach((id) => {
        if (!prevIdsRef.current.has(id)) {
          hasBrandNew = true;
        }
      });

      if (hasBrandNew && soundEnabled && newOpen.length > 0) {
        playRequestBeep();
      }

      prevIdsRef.current = currentIds;
      prevOpenCountRef.current = newOpen.length;

      setOpenRequests(newOpen);
      setTakenRequests(newTaken);
      setMyPickup(newMine);
      setLoading(false);
    } catch (e) {
      console.error("Error polling ambulance requests:", e);
    }
  }, [soundEnabled]);

  useEffect(() => {
    fetchProfile();
    fetchRequests();
    const interval = setInterval(fetchRequests, 3000);
    return () => clearInterval(interval);
  }, [fetchProfile, fetchRequests]);

  // Update Ambulance Status
  const handleStatusChange = async (newStatus) => {
    if (newStatus === status || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch("/api/ambulance/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const d = await res.json();
        setStatus(d.status);
        fetchRequests();
      }
    } catch (e) {
      console.error("Error updating status:", e);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Push Location to Server
  const sendLocationToServer = async (latitude, longitude) => {
    try {
      await fetch("/api/ambulance/location", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude }),
      });
    } catch (e) {
      console.error("Failed to push location:", e);
    }
  };

  // Live Location Toggle
  const toggleLocationSharing = () => {
    if (sharingLocation) {
      // Turn off
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (locationIntervalRef.current != null) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
      setSharingLocation(false);
      setGpsError("");
    } else {
      // Turn on
      if (!navigator.geolocation) {
        setGpsError("Geolocation is not supported by your browser.");
        return;
      }
      setGpsError("");
      setSharingLocation(true);

      const updatePos = (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentCoords({ latitude, longitude });
        sendLocationToServer(latitude, longitude);
      };

      navigator.geolocation.getCurrentPosition(
        updatePos,
        (err) => setGpsError(err.message || "Failed to get GPS location"),
        { enableHighAccuracy: true }
      );

      // Watch continuously
      watchIdRef.current = navigator.geolocation.watchPosition(
        updatePos,
        (err) => setGpsError(err.message || "GPS error"),
        { enableHighAccuracy: true, maximumAge: 5000 }
      );

      // Also pulse send every 15 seconds as specified
      locationIntervalRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (pos) => sendLocationToServer(pos.coords.latitude, pos.coords.longitude),
          () => {},
          { enableHighAccuracy: true }
        );
      }, 15000);
    }
  };

  // Cleanup GPS on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (locationIntervalRef.current != null) clearInterval(locationIntervalRef.current);
    };
  }, []);

  // Accept Pickup
  const handleAcceptPickup = async (emergencyId) => {
    setActionLoading(true);
    setToastMessage("");
    setError("");

    try {
      const res = await fetch(`/api/ambulance/requests/${emergencyId}/accept`, {
        method: "POST",
      });

      if (res.status === 409) {
        setToastMessage("Taken by another ambulance. Stand down.");
        fetchRequests();
        return;
      }

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to accept pickup");
      }

      // Success
      setStatus("busy");
      setToastMessage("Pickup claimed successfully! Proceed to patient.");
      fetchRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Progress Active Pickup
  const handleUpdatePickup = async (emergencyId, action) => {
    setActionLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/ambulance/requests/${emergencyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to update pickup status");
      }

      if (action === "completed") {
        setStatus("available");
        setToastMessage("Pickup completed. Unit is now Available.");
      } else {
        setToastMessage("Status updated to Patient Picked Up.");
      }
      fetchRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Unit Header Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl shadow-md shadow-blue-500/20 shrink-0 font-bold">
              <Truck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                  {profile?.vehicleNumber || "AMBULANCE"}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {profile?.type === "advanced" ? "ALS Advanced" : "BLS Basic"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Driver: <span className="font-semibold text-slate-700 dark:text-slate-300">{profile?.driverName || "Driver"}</span>
                {profile?.driverPhone && ` • ${profile.driverPhone}`}
              </p>
            </div>
          </div>

          {/* Controls: Duty Status + Location Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Big Status Switcher */}
            <div className="inline-flex rounded-2xl p-1 bg-slate-100 dark:bg-slate-750 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => handleStatusChange("available")}
                disabled={updatingStatus}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  status === "available"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Available
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange("busy")}
                disabled={updatingStatus}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  status === "busy"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Busy
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange("offline")}
                disabled={updatingStatus}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  status === "offline"
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Offline
              </button>
            </div>

            {/* Live Location Toggle */}
            <Button
              variant={sharingLocation ? "default" : "outline"}
              size="sm"
              onClick={toggleLocationSharing}
              className={`text-xs gap-1.5 font-semibold ${
                sharingLocation
                  ? "bg-teal-600 hover:bg-teal-700 text-white"
                  : "text-slate-700 dark:text-slate-300"
              }`}
            >
              <Compass className={`w-3.5 h-3.5 ${sharingLocation ? "animate-spin" : ""}`} />
              <span>{sharingLocation ? "GPS Broadcasting On" : "Share Live Location"}</span>
            </Button>

            {/* Mute/Sound Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled((v) => !v)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-750"
              title={soundEnabled ? "Audio alert on" : "Audio alert muted"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* GPS Telemetry Bar (if active) */}
        {sharingLocation && (
          <div className="bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-900 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs text-teal-800 dark:text-teal-300">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping" />
              <span className="font-semibold">GPS Active:</span>
              <span className="font-mono">
                {currentCoords
                  ? `${currentCoords.latitude.toFixed(4)}, ${currentCoords.longitude.toFixed(4)}`
                  : "Acquiring satellite lock..."}
              </span>
            </div>
            <span className="text-[11px] text-teal-600 dark:text-teal-400">Pulsing telemetry every 15s</span>
          </div>
        )}

        {gpsError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>GPS Error: {gpsError}</span>
          </div>
        )}

        {/* Global Toast / Notification */}
        {toastMessage && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-center justify-between text-xs text-blue-900 dark:text-blue-200 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="font-bold">{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage("")}
              className="text-blue-700 dark:text-blue-300 hover:underline font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center justify-between text-xs text-rose-900 dark:text-rose-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError("")}
              className="text-rose-700 dark:text-rose-300 hover:underline font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 1. "My Active Pickup" Section */}
        {myPickup && (
          <div className="bg-gradient-to-tr from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-blue-700/60 space-y-5 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                  <Navigation className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-300">
                    Active Mission In Progress
                  </span>
                  <h2 className="text-xl font-black tracking-tight">
                    {myPickup.studentName} ({myPickup.type.toUpperCase()})
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-blue-400/20 text-blue-200 border border-blue-300/30">
                  {myPickup.ambulanceStatus === "accepted" ? "En Route To Patient" : "Patient On Board"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Mission Details */}
              <div className="space-y-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Student Contact:</span>
                    {myPickup.studentPhone ? (
                      <a
                        href={`tel:${myPickup.studentPhone}`}
                        className="font-bold text-teal-300 hover:underline flex items-center gap-1.5 text-sm"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{myPickup.studentPhone}</span>
                      </a>
                    ) : (
                      <span className="text-slate-500">No phone provided</span>
                    )}
                  </div>

                  {myPickup.studentRegNo && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Reg No:</span>
                      <span className="font-mono font-bold">{myPickup.studentRegNo}</span>
                    </div>
                  )}

                  {myPickup.distanceKm != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Estimated Distance:</span>
                      <span className="font-mono font-extrabold text-blue-300 text-sm">
                        {myPickup.distanceKm} km
                      </span>
                    </div>
                  )}

                  {myPickup.location?.manualLocation && (
                    <div className="pt-2 border-t border-white/10">
                      <span className="text-slate-400 block mb-0.5">Location Notes:</span>
                      <p className="text-slate-200 font-medium">
                        {myPickup.location.manualLocation}
                      </p>
                    </div>
                  )}

                  {myPickup.description && (
                    <div className="pt-2 border-t border-white/10">
                      <span className="text-slate-400 block mb-0.5">Distress Reason:</span>
                      <p className="text-slate-200 italic">
                        &ldquo;{myPickup.description}&rdquo;
                      </p>
                    </div>
                  )}
                </div>

                {/* Progress Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  {myPickup.ambulanceStatus === "accepted" ? (
                    <Button
                      size="lg"
                      onClick={() => handleUpdatePickup(myPickup._id, "picked-up")}
                      disabled={actionLoading}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm h-12 rounded-2xl shadow-lg gap-2"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
                      <span>Mark Patient Picked Up</span>
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      onClick={() => handleUpdatePickup(myPickup._id, "completed")}
                      disabled={actionLoading}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm h-12 rounded-2xl shadow-lg gap-2"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>Complete Mission &amp; Handover</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Destination Map Preview */}
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/20">
                {myPickup.location?.latitude != null && myPickup.location?.longitude != null ? (
                  <EmergencyMap
                    emergencies={[myPickup]}
                    height="240px"
                    readOnly
                  />
                ) : (
                  <div className="h-[240px] flex flex-col items-center justify-center p-6 text-center text-slate-400">
                    <MapPin className="w-8 h-8 text-slate-500 mb-2" />
                    <p className="text-xs font-semibold">No GPS Coordinates Transmitted</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Refer to landmark instructions: {myPickup.location?.manualLocation || "Campus Area"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. Red Alert Panel: "New Emergency Requests" */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 bg-rose-500/10 border-b border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
              <h2 className="text-sm sm:text-base font-extrabold text-rose-950 dark:text-rose-200 tracking-tight flex items-center gap-2">
                <span>New Emergency Requests</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-rose-600 text-white font-mono">
                  {openRequests.length}
                </span>
              </h2>
            </div>
            <span className="text-[11px] text-rose-700 dark:text-rose-400 font-semibold">
              Live Radar (Polling 3s)
            </span>
          </div>

          <div className="p-4 sm:p-6">
            {status !== "available" && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 rounded-2xl text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                <span>You are currently <strong>{status.toUpperCase()}</strong>. Switch to <strong>Available</strong> above to receive and claim open emergency pickups.</span>
                <Button
                  size="sm"
                  onClick={() => handleStatusChange("available")}
                  className="text-xs bg-amber-600 hover:bg-amber-700 text-white ml-2"
                >
                  Set Available
                </Button>
              </div>
            )}

            {openRequests.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <ShieldCheck className="w-10 h-10 mx-auto text-emerald-500/80" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No active emergency dispatch requests
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Stand by. When a student triggers an SOS within your radius, it will alert here immediately.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {openRequests.map((req) => (
                  <div
                    key={req._id}
                    className="p-5 rounded-2xl border-2 border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-rose-600 text-white">
                          {req.type} Crisis
                        </span>
                        <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5" />
                          <ElapsedSecondsTimer startedAt={req.dispatchStartedAt} />
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Student: {req.studentFirstName}
                      </h3>

                      {req.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic">
                          &ldquo;{req.description}&rdquo;
                        </p>
                      )}

                      <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                        {req.distanceKm != null ? (
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                            <Navigation className="w-3.5 h-3.5 text-blue-600" />
                            <span>{req.distanceKm} km away (Radius: {req.currentRadiusKm} km)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Compass className="w-3.5 h-3.5" />
                            <span>GPS pending / Radius coverage open</span>
                          </div>
                        )}

                        {req.location?.manualLocation && (
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="truncate">{req.location.manualLocation}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between gap-3">
                      {req.location?.latitude != null && req.location?.longitude != null ? (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${req.location.latitude},${req.location.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <span>Google Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400">No GPS Pin</span>
                      )}

                      <Button
                        size="sm"
                        onClick={() => handleAcceptPickup(req._id)}
                        disabled={actionLoading || status !== "available"}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-5 shadow-md"
                      >
                        {actionLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Accept Pickup"
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. "Taken" Cards (Grey Section) */}
        {takenRequests.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Recent Dispatches (Last 3 Minutes)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {takenRequests.map((t) => (
                <div
                  key={t._id}
                  className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-750/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold capitalize text-slate-700 dark:text-slate-300">
                      {t.type} incident
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {t.acceptedAt ? new Date(t.acceptedAt).toLocaleTimeString() : ""}
                    </span>
                  </div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    Pickup taken by {t.vehicleNumber}. Stand down.
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    No need to proceed to this location.
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
