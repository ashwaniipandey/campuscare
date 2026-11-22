"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Clock, ExternalLink, CheckCircle2, Phone, MapPin, AlertTriangle } from "lucide-react";

// Default campus location (fallback if no coords)
const DEFAULT_CAMPUS = [37.4275, -122.1697];

// Create custom animated div icon based on emergency status
function getEmergencyIcon(status) {
  const isNew = status === "new";
  const color = isNew ? "#dc2626" : "#f97316"; // red-600 vs orange-500
  const pingColor = isNew ? "rgba(239, 68, 68, 0.6)" : "rgba(249, 115, 22, 0.6)";

  return L.divIcon({
    className: "emergency-div-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <span class="emergency-ping" style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background-color: ${pingColor}; pointer-events: none;"></span>
        <span style="position: relative; width: 18px; height: 18px; border-radius: 9999px; background-color: ${color}; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">
          <span style="width: 5px; height: 5px; border-radius: 9999px; background-color: white;"></span>
        </span>
      </div>
    `,
  });
}

// Blue ambulance marker icon
function getAmbulanceIcon() {
  return L.divIcon({
    className: "ambulance-div-icon",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        <span class="emergency-ping" style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background-color: rgba(37, 99, 235, 0.45); pointer-events: none;"></span>
        <div style="position: relative; width: 26px; height: 26px; border-radius: 9999px; background-color: #2563eb; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; font-size: 13px;">
          🚑
        </div>
      </div>
    `,
  });
}

// Running elapsed timer inside popup
function PopupTimer({ createdAt }) {
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
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  return <span>Waiting {elapsed}</span>;
}

// Map controller for bounds fitting and flyTo on selection
function MapController({ emergencies, selectedEmergency }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (
      selectedEmergency?.location?.latitude &&
      selectedEmergency?.location?.longitude
    ) {
      map.flyTo(
        [
          selectedEmergency.location.latitude,
          selectedEmergency.location.longitude,
        ],
        16,
        { duration: 1.2 }
      );
      return;
    }

    if (emergencies && emergencies.length > 0) {
      if (emergencies.length === 1) {
        map.flyTo(
          [
            emergencies[0].location.latitude,
            emergencies[0].location.longitude,
          ],
          15,
          { duration: 1 }
        );
      } else {
        const bounds = L.latLngBounds(
          emergencies.map((e) => [
            e.location.latitude,
            e.location.longitude,
          ])
        );
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    }
  }, [map, emergencies, selectedEmergency]);

  return null;
}

export default function EmergencyMap({
  emergencies = [],
  selectedEmergency = null,
  height = "420px",
  readOnly = false,
  center = null,
  zoom = 15,
}) {
  const markerRefs = useRef({});

  // Filter only emergencies that have valid lat/lng numbers
  const validEmergencies = useMemo(() => {
    return (emergencies || []).filter(
      (e) =>
        e?.location?.latitude != null &&
        e?.location?.longitude != null &&
        !isNaN(Number(e.location.latitude)) &&
        !isNaN(Number(e.location.longitude))
    );
  }, [emergencies]);

  // Extract unique assigned ambulances with valid location coordinates
  const validAmbulances = useMemo(() => {
    const list = [];
    const seen = new Set();
    (emergencies || []).forEach((e) => {
      const amb = e?.assignedAmbulance;
      if (
        amb &&
        amb.location?.latitude != null &&
        amb.location?.longitude != null &&
        !isNaN(Number(amb.location.latitude)) &&
        !isNaN(Number(amb.location.longitude))
      ) {
        const key = amb._id ? String(amb._id) : amb.vehicleNumber;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({ ...amb, relatedEmergency: e });
        }
      }
    });
    return list;
  }, [emergencies]);

  const initialCenter = useMemo(() => {
    if (center) return center;
    if (validEmergencies.length > 0) {
      return [
        validEmergencies[0].location.latitude,
        validEmergencies[0].location.longitude,
      ];
    }
    return DEFAULT_CAMPUS;
  }, [center, validEmergencies]);

  // Open popup when selectedEmergency changes
  useEffect(() => {
    if (selectedEmergency?._id && markerRefs.current[selectedEmergency._id]) {
      markerRefs.current[selectedEmergency._id].openPopup();
    }
  }, [selectedEmergency]);

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden border border-slate-200/90 shadow-md bg-slate-100 z-0"
      style={{ height }}
    >
      <style jsx global>{`
        @keyframes emergencyPulse {
          0% {
            transform: scale(0.9);
            opacity: 0.9;
          }
          70% {
            transform: scale(2.2);
            opacity: 0;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
        .emergency-ping {
          animation: emergencyPulse 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 1rem;
          padding: 0;
          box-shadow: 0 12px 30px -5px rgba(0, 0, 0, 0.2);
          overflow: hidden;
          border: 1px solid rgba(226, 232, 240, 0.9);
        }
        .leaflet-popup-content {
          margin: 12px 14px;
          line-height: 1.4;
        }
        .leaflet-container {
          width: 100%;
          height: 100%;
          border-radius: 1.5rem;
          font-family: inherit;
        }
      `}</style>

      <MapContainer
        center={initialCenter}
        zoom={zoom}
        scrollWheelZoom={!readOnly}
        dragging={!readOnly}
        zoomControl={!readOnly}
        attributionControl={false}
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapController
          emergencies={validEmergencies}
          selectedEmergency={selectedEmergency}
        />

        {validEmergencies.map((emg) => {
          const lat = Number(emg.location.latitude);
          const lng = Number(emg.location.longitude);
          const icon = getEmergencyIcon(emg.status);

          return (
            <Marker
              key={emg._id}
              position={[lat, lng]}
              icon={icon}
              ref={(ref) => {
                if (ref) markerRefs.current[emg._id] = ref;
              }}
            >
              <Popup>
                <div className="p-1 min-w-[200px] text-xs font-sans space-y-2">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                    <span className="font-bold text-slate-900 text-sm truncate">
                      {emg.student?.name || "Student SOS"}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        emg.status === "new"
                          ? "bg-red-100 text-red-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {emg.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700">Type:</span>
                      <span className="capitalize font-medium">{emg.type}</span>
                    </div>

                    {emg.student?.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-teal-600" />
                        <a
                          href={`tel:${emg.student.phone}`}
                          className="text-teal-600 hover:underline font-bold"
                        >
                          {emg.student.phone}
                        </a>
                      </div>
                    )}

                    {emg.description && (
                      <p className="italic text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        "{emg.description}"
                      </p>
                    )}

                    {emg.location?.manualLocation && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <span className="truncate">{emg.location.manualLocation}</span>
                      </p>
                    )}

                    {emg.status === "new" && (
                      <div className="flex items-center gap-1 text-red-600 font-mono font-bold text-[11px] pt-0.5">
                        <Clock className="w-3 h-3" />
                        <PopupTimer createdAt={emg.createdAt} />
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <a
                      href={`https://www.google.com/maps?q=${lat},${lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:underline"
                    >
                      <span>Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {lat.toFixed(4)}, {lng.toFixed(4)}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Render blue assigned ambulance markers */}
        {validAmbulances.map((amb) => {
          const lat = Number(amb.location.latitude);
          const lng = Number(amb.location.longitude);
          const ambIcon = getAmbulanceIcon();

          return (
            <Marker key={amb._id || amb.vehicleNumber} position={[lat, lng]} icon={ambIcon}>
              <Popup>
                <div className="p-1 min-w-[190px] text-xs font-sans space-y-2">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                    <span className="font-extrabold text-blue-700 text-sm flex items-center gap-1">
                      <span>🚑</span>
                      <span>{amb.vehicleNumber}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800">
                      Ambulance
                    </span>
                  </div>

                  <div className="space-y-1 text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-700">Driver: </span>
                      <span>{amb.driverName || "Dispatched Driver"}</span>
                    </div>

                    {amb.driverPhone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-blue-600" />
                        <a href={`tel:${amb.driverPhone}`} className="text-blue-600 hover:underline font-bold">
                          {amb.driverPhone}
                        </a>
                      </div>
                    )}

                    {amb.relatedEmergency && (
                      <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>Assigned to: </span>
                        <span className="font-semibold text-slate-700">
                          {amb.relatedEmergency.student?.name || "Student SOS"}
                        </span>
                        <div className="text-[10px] text-slate-400 capitalize">
                          Status: {amb.relatedEmergency.ambulanceStatus || "In Progress"}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Friendly overlay when no geo-emergencies are active */}
      {validEmergencies.length === 0 && validAmbulances.length === 0 && (
        <div className="absolute inset-0 bg-slate-900/15 backdrop-blur-[1px] z-[1000] flex items-center justify-center pointer-events-none p-4">
          <div className="bg-white/95 px-5 py-3.5 rounded-2xl shadow-xl border border-slate-200/90 text-center flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800">
                No active geo-located emergencies
              </p>
              <p className="text-[11px] text-slate-500">
                All campus sectors clear. Map stands ready for live beacons.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
