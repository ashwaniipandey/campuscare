/**
 * Emergency Alert Model Schema (UI Foundation & Future Database Contract)
 * Captures real-time SOS requests, dispatch telemetry, and incident resolution.
 */
export const EmergencyAlertSchema = {
  id: "string", // Incident identifier (e.g., "EMERG-2026-0042")
  callerId: "string", // Reference to User (or anonymous guest)
  campusLocation: {
    buildingName: "string", // e.g., "Engineering Quad, Lab 3"
    floorOrRoom: "string",
    coordinates: {
      latitude: "number",
      longitude: "number",
    },
  },
  emergencyType: [
    "cardiac_or_breathing",
    "severe_injury_trauma",
    "allergic_reaction",
    "mental_health_crisis",
    "intoxication_overdose",
    "general_urgent_medical",
  ],
  status: ["triggered", "dispatched", "on_scene", "transported", "resolved"],
  dispatchedUnits: [
    {
      unitName: "string", // e.g. "Campus Medic Unit 2"
      officerName: "string",
      dispatchedAt: "Date",
      arrivedAt: "Date",
    },
  ],
  notes: "string",
  createdAt: "Date",
  resolvedAt: "Date",
};

export default EmergencyAlertSchema;
