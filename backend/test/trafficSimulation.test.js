import assert from 'node:assert/strict';
import test from 'node:test';
import { TrafficInputError, TrafficSimulationService } from '../src/services/trafficSimulationService.js';

const edge = { id: 'a:b:0', from: 'a', to: 'b', distance: 100, roadType: 'primary', maxSpeedKmph: 60 };
const graph = { adjacency: new Map([['a', [edge]], ['b', []]]), nodes: new Map([['a', { id: 'a', lat: 18.5, lon: 73.8 }], ['b', { id: 'b', lat: 18.6, lon: 73.9 }]]) };

test('traffic simulation is deterministic and preserves original graph edges', async () => {
  const service = new TrafficSimulationService({ service: { load: async () => graph }, seed: 42 });
  await service.ensureSimulation();
  const first = service.getEdgeCost(edge);
  await service.regenerate(42);
  const second = service.getEdgeCost(edge);
  assert.equal(first.travelTimeSeconds, second.travelTimeSeconds);
  assert.equal(edge.simulatedTravelTimeSeconds, undefined);
});

test('scenario multipliers increase simulated travel time and statistics remain factual', async () => {
  const service = new TrafficSimulationService({ service: { load: async () => graph }, seed: 7 });
  await service.setScenario('low'); const low = service.getEdgeCost(edge).travelTimeSeconds;
  await service.setScenario('high'); const high = service.getEdgeCost(edge).travelTimeSeconds;
  const statistics = await service.getStatistics();
  assert.ok(high > low); assert.equal(statistics.totalSimulatedRoadSegments, 1); assert.equal(statistics.lowCongestionSegments + statistics.mediumCongestionSegments + statistics.highCongestionSegments, 1);
});

test('invalid traffic scenarios are rejected', async () => {
  const service = new TrafficSimulationService({ service: { load: async () => graph } });
  await assert.rejects(service.setScenario('live'), TrafficInputError);
});
