import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_SIGNAL_TIMING, schedulePhase } from '../src/algorithms/greedySignalScheduler.js';
import { SignalSimulationService } from '../src/services/signalSimulationService.js';

test('greedy scheduler serves the highest safe phase demand', () => {
  const result = schedulePhase({ queues: { north: 12, south: 10, east: 2, west: 1 }, waitingCycles: { 'north-south': 0, 'east-west': 0 }, previousPhase: 'east-west' });
  assert.equal(result.selectedPhase, 'north-south'); assert.ok(result.greenSeconds >= DEFAULT_SIGNAL_TIMING.minimumGreenSeconds);
});
test('starvation prevention supersedes greedy demand', () => {
  const result = schedulePhase({ queues: { north: 40, south: 40, east: 1, west: 1 }, waitingCycles: { 'north-south': 0, 'east-west': 3 }, previousPhase: 'north-south' });
  assert.equal(result.selectedPhase, 'east-west');
});
test('signal simulation is deterministic, safe, and resettable', () => {
  const first = new SignalSimulationService({ seed: 44 }); const second = new SignalSimulationService({ seed: 44 });
  const cycleOne = first.simulate(); const cycleTwo = second.simulate();
  assert.deepEqual(cycleOne.map((item) => item.queues), cycleTwo.map((item) => item.queues));
  assert.ok(cycleOne.every((item) => ['north-south', 'east-west'].includes(item.selectedPhase) && item.yellowSeconds > 0 && item.allRedSeconds > 0));
  first.reset(); assert.equal(first.getStatistics().totalCycles, 0);
});
