import { DEFAULT_SIGNAL_TIMING, schedulePhase } from '../algorithms/greedySignalScheduler.js';
import { addArrivals, createQueues, dischargeQueues } from './vehicleQueueService.js';

const INTERSECTIONS = Object.freeze([
  { id: 'central-pune-demo', name: 'Central Pune Demo Intersection', latitude: 18.5204, longitude: 73.8567, simulated: true },
  { id: 'shivajinagar-demo', name: 'Shivajinagar Demo Intersection', latitude: 18.5308, longitude: 73.8475, simulated: true },
]);
export class SignalInputError extends Error { constructor(message) { super(message); this.name = 'SignalInputError'; this.statusCode = 400; } }

export class SignalSimulationService {
  constructor({ seed = 20261117, timing = DEFAULT_SIGNAL_TIMING } = {}) { this.seed = seed; this.timing = timing; this.reset(); }
  reset() {
    this.cycles = 0; this.totalDischarged = 0;
    this.states = new Map(INTERSECTIONS.map((intersection, index) => [intersection.id, { ...intersection, queues: createQueues({ level: 'medium', seed: this.seed + index }), waitingCycles: { 'north-south': 0, 'east-west': 0 }, previousPhase: null, activePhase: null, lastCycle: null, phaseCounts: { 'north-south': 0, 'east-west': 0 } }]));
    return this.getStatus();
  }
  getIntersections() { return INTERSECTIONS; }
  getStatus() { return [...this.states.values()].map(({ queues, waitingCycles, ...state }) => ({ ...state, queues: { ...queues }, waitingCycles: { ...waitingCycles } })); }
  getQueues() { return this.getStatus().map(({ id, name, queues }) => ({ id, name, queues })); }
  simulate(intersectionId = null, trafficLevel = 'medium') {
    if (!['low', 'medium', 'high'].includes(trafficLevel)) throw new SignalInputError("trafficLevel must be 'low', 'medium', or 'high'.");
    const target = intersectionId ? [this.states.get(intersectionId)] : [...this.states.values()];
    if (target.some((state) => !state)) throw new SignalInputError('Unknown simulated intersection.');
    this.cycles += 1;
    const results = target.map((state, index) => {
      const schedule = schedulePhase({ queues: state.queues, waitingCycles: state.waitingCycles, previousPhase: state.previousPhase, timing: this.timing });
      const afterDischarge = dischargeQueues(state.queues, schedule.selectedPhase, schedule.greenSeconds, this.timing.dischargeRateVehiclesPerSecond);
      const queues = addArrivals(afterDischarge.queues, { level: trafficLevel, seed: this.seed + (this.cycles * 31) + index });
      state.waitingCycles = { 'north-south': schedule.selectedPhase === 'north-south' ? 0 : state.waitingCycles['north-south'] + 1, 'east-west': schedule.selectedPhase === 'east-west' ? 0 : state.waitingCycles['east-west'] + 1 };
      state.queues = queues; state.previousPhase = schedule.selectedPhase; state.activePhase = schedule.selectedPhase; state.phaseCounts[schedule.selectedPhase] += 1; state.lastCycle = { ...schedule, vehiclesDischarged: afterDischarge.discharged, trafficLevel, cycle: this.cycles }; this.totalDischarged += afterDischarge.discharged;
      return { intersectionId: state.id, ...state.lastCycle, queues };
    });
    return results;
  }
  getStatistics() {
    const states = this.getStatus(); const allQueues = states.flatMap((state) => Object.values(state.queues)); const phaseCounts = states.reduce((total, state) => ({ 'north-south': total['north-south'] + state.phaseCounts['north-south'], 'east-west': total['east-west'] + state.phaseCounts['east-west'] }), { 'north-south': 0, 'east-west': 0 });
    return { totalSimulatedIntersections: states.length, totalWaitingVehicles: allQueues.reduce((sum, queue) => sum + queue, 0), averageQueueSize: Number((allQueues.reduce((sum, queue) => sum + queue, 0) / allQueues.length).toFixed(2)), totalSimulatedVehiclesDischarged: this.totalDischarged, totalCycles: this.cycles, phaseAllocationStatistics: phaseCounts, timing: this.timing, simulated: true };
  }
}
export const signalSimulationService = new SignalSimulationService();
