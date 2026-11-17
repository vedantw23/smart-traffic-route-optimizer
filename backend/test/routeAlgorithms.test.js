import assert from 'node:assert/strict';
import test from 'node:test';
import astar from '../src/algorithms/astar.js';
import dijkstra from '../src/algorithms/dijkstra.js';
import MinHeap from '../src/utils/MinHeap.js';
import { RouteInputError, RouteService } from '../src/services/routeService.js';

const nodes = new Map([
  ['a', { id: 'a', lat: 18.5200, lon: 73.8500 }], ['b', { id: 'b', lat: 18.5210, lon: 73.8510 }],
  ['c', { id: 'c', lat: 18.5220, lon: 73.8520 }], ['d', { id: 'd', lat: 18.5230, lon: 73.8530 }],
]);
const edge = (id, from, to, distance, maxSpeedKmph = 36) => ({ id, from, to, distance, maxSpeedKmph, roadType: 'primary' });
const adjacency = new Map([
  ['a', [edge('a-b-slow', 'a', 'b', 100, 18), edge('a-b-fast', 'a', 'b', 120, 90), edge('a-c', 'a', 'c', 100, 36)]],
  ['b', [edge('b-d', 'b', 'd', 100, 90)]], ['c', [edge('c-d', 'c', 'd', 50, 18)]], ['d', []],
]);
const graph = { nodes, adjacency };

test('MinHeap returns items in priority order', () => {
  const heap = new MinHeap((a, b) => a - b); [5, 1, 4, 2].forEach((item) => heap.insert(item));
  assert.deepEqual([heap.extractMin(), heap.extractMin(), heap.extractMin(), heap.extractMin()], [1, 2, 4, 5]);
  assert.equal(heap.isEmpty(), true);
});

test('Dijkstra selects the lowest-time parallel directed edge and reconstructs it', () => {
  const result = dijkstra({ sourceNodeId: 'a', destinationNodeId: 'd', adjacency });
  assert.equal(result.found, true); assert.deepEqual(result.path, ['a', 'b', 'd']);
  assert.deepEqual(result.selectedEdges.map((item) => item.id), ['a-b-fast', 'b-d']);
});

test('A* matches Dijkstra on the same directed weighted graph', () => {
  const dijkstraResult = dijkstra({ sourceNodeId: 'a', destinationNodeId: 'd', adjacency });
  const astarResult = astar({ sourceNodeId: 'a', destinationNodeId: 'd', adjacency, nodes });
  assert.deepEqual(astarResult.path, dijkstraResult.path);
});

test('algorithms preserve one-way restrictions and report unreachable nodes', () => {
  assert.equal(dijkstra({ sourceNodeId: 'd', destinationNodeId: 'a', adjacency }).found, false);
  assert.equal(astar({ sourceNodeId: 'd', destinationNodeId: 'a', adjacency, nodes }).found, false);
});

test('route service handles same-node routes and missing node IDs', async () => {
  const service = new RouteService({ service: { load: async () => graph } });
  const same = await service.calculate('dijkstra', 'a', 'a');
  assert.equal(same.success, true); assert.equal(same.totalDistanceMeters, 0);
  await assert.rejects(service.calculate('dijkstra', 'missing', 'a'), RouteInputError);
});
