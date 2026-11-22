/**
 * Campus Health Ambulance Dispatch Utilities
 */

/**
 * Calculate the great-circle distance between two points on the Earth (in km)
 * using the Haversine formula.
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const numLat1 = Number(lat1);
  const numLon1 = Number(lon1);
  const numLat2 = Number(lat2);
  const numLon2 = Number(lon2);
  if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) return null;

  const R = 6371; // Earth's mean radius in km
  const dLat = ((numLat2 - numLat1) * Math.PI) / 180;
  const dLon = ((numLon2 - numLon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((numLat1 * Math.PI) / 180) *
      Math.cos((numLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculates current dispatch radius in km based on elapsed time since dispatch started.
 * 5 km for first 30 seconds, then +5 km every 30 seconds, up to 25 km.
 */
export function getDispatchRadiusKm(dispatchStartedAt) {
  if (!dispatchStartedAt) return 5;
  const startMs = new Date(dispatchStartedAt).getTime();
  if (isNaN(startMs)) return 5;
  const elapsedSeconds = Math.max(0, (Date.now() - startMs) / 1000);
  const step = Math.floor(elapsedSeconds / 30);
  return Math.min(25, 5 + step * 5);
}

/**
 * Checks if an ambulance is eligible for a searching emergency.
 * @param {Object} ambulance - Ambulance document or plain object with status and location
 * @param {Object} emergency - Emergency document or plain object with location, dispatchStartedAt, etc.
 * @returns {boolean}
 */
export function isAmbulanceEligible(ambulance, emergency) {
  // Must be available
  if (!ambulance || ambulance.status !== "available") return false;

  // Emergency must not have an assigned ambulance and must be searching
  if (emergency.assignedAmbulance != null || emergency.ambulanceStatus !== "searching") {
    return false;
  }

  const startMs = new Date(emergency.dispatchStartedAt || emergency.createdAt).getTime();
  const elapsedSeconds = Math.max(0, (Date.now() - startMs) / 1000);

  // If the emergency has no GPS coordinates, every available ambulance is eligible
  const emgLat = emergency.location?.latitude;
  const emgLon = emergency.location?.longitude;
  if (emgLat == null || emgLon == null) {
    return true;
  }

  // If the ambulance has no location yet, treat it as eligible after 60 seconds
  const ambLat = ambulance.location?.latitude;
  const ambLon = ambulance.location?.longitude;
  if (ambLat == null || ambLon == null) {
    return elapsedSeconds >= 60;
  }

  // Check distance against growing radius
  const currentRadius = getDispatchRadiusKm(emergency.dispatchStartedAt || emergency.createdAt);
  const dist = haversineDistance(ambLat, ambLon, emgLat, emgLon);
  if (dist == null) return false;

  return dist <= currentRadius;
}
