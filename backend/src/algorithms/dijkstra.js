import MinHeap from '../utils/MinHeap.js';
import { calculateEdgeCost } from '../services/edgeCostService.js';
import { createTraceCollector, reconstructPath } from './routeAlgorithmUtils.js';

export default function dijkstra({ sourceNodeId, destinationNodeId, adjacency, edgeCostConfig, edgeCost = calculateEdgeCost, trace }) {
  const traceCollector = createTraceCollector(trace);
  const distances = new Map([[sourceNodeId, 0]]);
  const previous = new Map();
  const queue = new MinHeap((first, second) => first.cost - second.cost);
  queue.insert({ nodeId: sourceNodeId, cost: 0 });
  let nodesVisited = 0; let edgesExplored = 0;
  while (!queue.isEmpty()) {
    const current = queue.extractMin();
    if (current.cost !== distances.get(current.nodeId)) continue;
    nodesVisited += 1; traceCollector.add('nodeVisited', { nodeId: current.nodeId });
    if (current.nodeId === destinationNodeId) break;
    for (const edge of adjacency.get(current.nodeId) || []) {
      edgesExplored += 1; traceCollector.add('edgeChecked', { edgeId: edge.id, from: edge.from, to: edge.to });
      const candidate = current.cost + edgeCost(edge, edgeCostConfig).travelTimeSeconds;
      if (candidate < (distances.get(edge.to) ?? Infinity)) {
        distances.set(edge.to, candidate); previous.set(edge.to, { nodeId: current.nodeId, edge });
        queue.insert({ nodeId: edge.to, cost: candidate });
        traceCollector.add('distanceUpdated', { nodeId: edge.to, cost: candidate });
      }
    }
  }
  const route = reconstructPath(sourceNodeId, destinationNodeId, previous);
  if (!route && sourceNodeId !== destinationNodeId) return { found: false, nodesVisited, edgesExplored, trace: traceCollector.events };
  const same = sourceNodeId === destinationNodeId;
  traceCollector.add('pathFound', { path: same ? [sourceNodeId] : route.path });
  return { found: true, path: same ? [sourceNodeId] : route.path, selectedEdges: same ? [] : route.selectedEdges, nodesVisited, edgesExplored, trace: traceCollector.events };
}
