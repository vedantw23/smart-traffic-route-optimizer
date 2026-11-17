import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { DEFAULT_GRAPH_PATH, GraphDataUnavailableError, GraphService } from '../src/services/graphService.js';

const sampleDataset = {
  metadata: { city: 'Pune', source: 'OpenStreetMap contributors', networkType: 'drive', graphType: 'directed', weightUnit: 'meters', nodeCount: 2, edgeCount: 2 },
  nodes: [{ id: 'one', lat: 18.52, lon: 73.85 }, { id: 'two', lat: 18.53, lon: 73.86 }],
  edges: [
    { id: 'one:two:0', from: 'one', to: 'two', distance: 10, roadType: 'primary', oneway: true, maxSpeedKmph: null },
    { id: 'one:two:1', from: 'one', to: 'two', distance: 12, roadType: 'service', oneway: true, maxSpeedKmph: 20 },
  ],
};

async function createService() {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'traffic-graph-'));
  const graphPath = path.join(directory, 'graph.json');
  const statisticsPath = path.join(directory, 'statistics.json');
  await writeFile(graphPath, JSON.stringify(sampleDataset));
  await writeFile(statisticsPath, JSON.stringify({ validationPassed: true }));
  return new GraphService({ graphPath, statisticsPath });
}

test('loads directed graph data and preserves parallel outgoing edges', async () => {
  const service = await createService();
  assert.equal((await service.getNode('one')).lat, 18.52);
  const outgoing = await service.getOutgoingEdges('one');
  assert.equal(outgoing.length, 2);
  assert.deepEqual(outgoing.map((edge) => edge.id), ['one:two:0', 'one:two:1']);
  assert.equal(await service.getOutgoingEdges('two').then((edges) => edges.length), 0);
});

test('returns null for an invalid node ID', async () => {
  const service = await createService();
  assert.equal(await service.getNode('missing'), null);
});

test('builds its spatial index once and returns the nearest real graph node', async () => {
  const service = await createService();
  const nearest = await service.findNearestNode(18.52001, 73.85001);
  assert.equal(nearest.nodeId, 'one');
  assert.ok(nearest.distanceMeters >= 0);
});

test('reports missing graph files without inventing data', async () => {
  const service = new GraphService({ graphPath: path.join(os.tmpdir(), 'not-a-pune-graph.json') });
  await assert.rejects(service.load(), GraphDataUnavailableError);
  const status = await service.getStatus();
  assert.equal(status.loaded, false);
});

test('does not silently use a fallback for a caller-supplied missing graph path', async () => {
  assert.notEqual(DEFAULT_GRAPH_PATH, path.join(os.tmpdir(), 'not-a-pune-graph.json'));
});
