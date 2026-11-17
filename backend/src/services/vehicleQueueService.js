const DIRECTIONS = ['north', 'south', 'east', 'west'];
const VOLUME_BY_LEVEL = { low: [2, 8], medium: [7, 18], high: [15, 32] };

function seededRandom(seed) { let state = seed >>> 0; return () => { state += 0x6D2B79F5; let value = state; value = Math.imul(value ^ (value >>> 15), value | 1); value ^= value + Math.imul(value ^ (value >>> 7), value | 61); return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296; }; }
export function createQueues({ level = 'medium', seed = 1 }) {
  const range = VOLUME_BY_LEVEL[level] || VOLUME_BY_LEVEL.medium;
  const random = seededRandom(seed);
  return Object.fromEntries(DIRECTIONS.map((direction) => [direction, Math.floor(range[0] + (random() * ((range[1] - range[0]) + 1)))]));
}
export function addArrivals(queues, { level = 'medium', seed = 1 }) {
  const arrivals = createQueues({ level, seed });
  return Object.fromEntries(DIRECTIONS.map((direction) => [direction, queues[direction] + arrivals[direction]]));
}
export function dischargeQueues(queues, selectedPhase, greenSeconds, dischargeRate) {
  const active = selectedPhase === 'north-south' ? ['north', 'south'] : ['east', 'west'];
  let discharged = 0;
  const updated = { ...queues };
  for (const direction of active) { const count = Math.min(updated[direction], Math.floor(greenSeconds * dischargeRate)); updated[direction] -= count; discharged += count; }
  return { queues: updated, discharged };
}
