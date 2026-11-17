const KMH_TO_MPS = 1000 / 3600;

// Baseline planning values, not real-time traffic measurements.
export const DEFAULT_EDGE_COST_CONFIG = Object.freeze({
  maximumSpeedKmph: 90,
  fallbackSpeedKmph: Object.freeze({
    motorway: 80, trunk: 70, primary: 60, secondary: 50, tertiary: 45,
    residential: 30, service: 20, unclassified: 35, living_street: 15,
  }),
  defaultSpeedKmph: 35,
});

export function resolveRoadSpeedKmph(edge, config = DEFAULT_EDGE_COST_CONFIG) {
  const configuredMaximum = config.maximumSpeedKmph;
  const rawSpeed = Number(edge.maxSpeedKmph);
  const roadType = String(edge.roadType || '').split(';')[0].trim();
  const fallback = config.fallbackSpeedKmph[roadType] || config.defaultSpeedKmph;
  const selected = Number.isFinite(rawSpeed) && rawSpeed > 0 ? rawSpeed : fallback;
  return Math.min(selected, configuredMaximum);
}

export function calculateEdgeCost(edge, config = DEFAULT_EDGE_COST_CONFIG) {
  if (!Number.isFinite(edge.distance) || edge.distance < 0) throw new Error(`Edge ${edge.id || 'unknown'} has invalid distance.`);
  const speedKmph = resolveRoadSpeedKmph(edge, config);
  return { distanceMeters: edge.distance, speedKmph, travelTimeSeconds: edge.distance / (speedKmph * KMH_TO_MPS) };
}

export function heuristicTravelTimeSeconds(node, destinationNode, config = DEFAULT_EDGE_COST_CONFIG) {
  const distanceMeters = haversineDistanceMeters(node.lat, node.lon, destinationNode.lat, destinationNode.lon);
  // Every modelled edge speed is capped at maximumSpeedKmph, so this is a lower bound.
  return distanceMeters / (config.maximumSpeedKmph * KMH_TO_MPS);
}

export function haversineDistanceMeters(latA, lonA, latB, lonB) {
  const radians = Math.PI / 180;
  const deltaLat = (latB - latA) * radians;
  const deltaLon = (lonB - lonA) * radians;
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(latA * radians) * Math.cos(latB * radians) * Math.sin(deltaLon / 2) ** 2;
  return 12_742_017.6 * Math.asin(Math.min(1, Math.sqrt(a)));
}
