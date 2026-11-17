import { calculateEdgeCost } from './edgeCostService.js';
import { graphService } from './graphService.js';

export const TRAFFIC_SCENARIOS = Object.freeze({
  low: Object.freeze({ label: 'Low Traffic', multiplier: 1.0 }),
  medium: Object.freeze({ label: 'Medium Traffic', multiplier: 1.5 }),
  high: Object.freeze({ label: 'High Traffic', multiplier: 2.5 }),
});
const DEFAULT_SEED = 20261117;

export class TrafficInputError extends Error {
  constructor(message, statusCode = 400) { super(message); this.name = 'TrafficInputError'; this.statusCode = statusCode; }
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function classificationBias(roadType) {
  const road = String(roadType || '').split(';')[0];
  if (['motorway', 'trunk', 'primary', 'secondary'].includes(road)) return 0.12;
  if (['residential', 'service', 'living_street'].includes(road)) return -0.05;
  return 0;
}

function segmentProfile(edge, random) {
  const score = random() + classificationBias(edge.roadType);
  if (score < 0.34) return { level: 'low', variation: 1.0 };
  if (score < 0.74) return { level: 'medium', variation: 1.15 };
  return { level: 'high', variation: 1.35 };
}

export class TrafficSimulationService {
  constructor({ service = graphService, seed = DEFAULT_SEED } = {}) {
    this.service = service;
    this.seed = seed;
    this.currentScenario = 'low';
    this.simulation = null;
  }

  async ensureSimulation() {
    const graph = await this.service.load();
    if (!this.simulation || this.simulation.graph !== graph) this.#generate(graph, this.seed);
    return this.simulation;
  }

  #generate(graph, seed) {
    const random = seededRandom(seed);
    const segments = new Map();
    for (const edges of graph.adjacency.values()) {
      for (const edge of edges) {
        const baseline = calculateEdgeCost(edge);
        segments.set(edge.id, { edgeId: edge.id, ...segmentProfile(edge, random), baselineTravelTimeSeconds: baseline.travelTimeSeconds });
      }
    }
    this.seed = seed;
    this.simulation = { graph, segments, generatedAt: new Date().toISOString() };
  }

  async setScenario(scenario) {
    if (!Object.hasOwn(TRAFFIC_SCENARIOS, scenario)) throw new TrafficInputError("scenario must be 'low', 'medium', or 'high'.");
    await this.ensureSimulation();
    this.currentScenario = scenario;
    return this.getCurrent();
  }

  async regenerate(seed = this.seed) {
    if (!Number.isInteger(seed) || seed < 0) throw new TrafficInputError('seed must be a non-negative integer.');
    const graph = await this.service.load();
    this.#generate(graph, seed);
    return this.getCurrent();
  }

  async getCurrent() {
    const simulation = await this.ensureSimulation();
    return { scenario: this.currentScenario, ...TRAFFIC_SCENARIOS[this.currentScenario], seed: this.seed, generatedAt: simulation.generatedAt, simulated: true };
  }

  getEdgeCost(edge) {
    if (!this.simulation) throw new Error('Traffic simulation must be initialized before route calculation.');
    const simulation = this.simulation;
    const profile = simulation.segments.get(edge.id);
    if (!profile) throw new Error(`Traffic simulation has no profile for edge ${edge.id}.`);
    const scenario = TRAFFIC_SCENARIOS[this.currentScenario];
    const congestionMultiplier = scenario.multiplier * profile.variation;
    return { distanceMeters: edge.distance, speedKmph: calculateEdgeCost(edge).speedKmph, travelTimeSeconds: profile.baselineTravelTimeSeconds * congestionMultiplier, baselineTravelTimeSeconds: profile.baselineTravelTimeSeconds, congestionMultiplier, congestionLevel: profile.level };
  }

  async getStatistics() {
    const simulation = await this.ensureSimulation();
    const scenario = TRAFFIC_SCENARIOS[this.currentScenario];
    const values = [...simulation.segments.values()];
    const summary = values.reduce((totals, segment) => {
      const multiplier = scenario.multiplier * segment.variation;
      totals[`${segment.level}CongestionSegments`] += 1;
      totals.baseline += segment.baselineTravelTimeSeconds;
      totals.simulated += segment.baselineTravelTimeSeconds * multiplier;
      totals.multiplier += multiplier;
      return totals;
    }, { lowCongestionSegments: 0, mediumCongestionSegments: 0, highCongestionSegments: 0, baseline: 0, simulated: 0, multiplier: 0 });
    const count = values.length;
    return {
      totalSimulatedRoadSegments: count, lowCongestionSegments: summary.lowCongestionSegments, mediumCongestionSegments: summary.mediumCongestionSegments, highCongestionSegments: summary.highCongestionSegments,
      averageBaselineTravelTimeSeconds: Number((summary.baseline / count).toFixed(3)), averageSimulatedTravelTimeSeconds: Number((summary.simulated / count).toFixed(3)), averageCongestionMultiplier: Number((summary.multiplier / count).toFixed(3)),
      scenario: this.currentScenario, seed: this.seed, generatedAt: simulation.generatedAt, simulated: true,
    };
  }

  getScenarios() { return Object.entries(TRAFFIC_SCENARIOS).map(([id, scenario]) => ({ id, ...scenario })); }
}

export const trafficSimulationService = new TrafficSimulationService();
