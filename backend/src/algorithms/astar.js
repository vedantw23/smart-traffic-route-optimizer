import MinHeap from '../utils/MinHeap.js';
import { calculateEdgeCost, heuristicTravelTimeSeconds } from '../services/edgeCostService.js';
import { createTraceCollector, reconstructPath } from './routeAlgorithmUtils.js';

export default function astar({ sourceNodeId, destinationNodeId, adjacency, nodes, edgeCostConfig, edgeCost = calculateEdgeCost, trace }) {
  const traceCollector = createTraceCollector(trace);
  const destination = nodes.get(destinationNodeId);
  const costs = new Map([[sourceNodeId, 0]]);
  const previous = new Map();
  const queue = new MinHeap((first, second) => first.priority - second.priority);
  queue.insert({ nodeId: sourceNodeId, cost: 0, priority: heuristicTravelTimeSeconds(nodes.get(sourceNodeId), destination, edgeCostConfig) });
  let nodesVisited = 0; let edgesExplored = 0;
  while (!queue.isEmpty()) {
    const current = queue.extractMin();
    if (current.cost !== costs.get(current.nodeId)) continue;
    nodesVisited += 1; traceCollector.add('nodeVisited', { nodeId: current.nodeId });
    if (current.nodeId === destinationNodeId) break;
    for (const edge of adjacency.get(current.nodeId) || []) {
      edgesExplored += 1; traceCollector.add('edgeChecked', { edgeId: edge.id, from: edge.from, to: edge.to });
      const candidate = current.cost + edgeCost(edge, edgeCostConfig).travelTimeSeconds;
      if (candidate < (costs.get(edge.to) ?? Infinity)) {
        costs.set(edge.to, candidate); previous.set(edge.to, { nodeId: current.nodeId, edge });
        const heuristic = heuristicTravelTimeSeconds(nodes.get(edge.to), destination, edgeCostConfig);
        queue.insert({ nodeId: edge.to, cost: candidate, priority: candidate + heuristic });
        traceCollector.add('nodeAddedToQueue', { nodeId: edge.to, cost: candidate, heuristic });
      }
    }
  }
  const route = reconstructPath(sourceNodeId, destinationNodeId, previous);
  if (!route && sourceNodeId !== destinationNodeId) return { found: false, nodesVisited, edgesExplored, trace: traceCollector.events };
  const same = sourceNodeId === destinationNodeId;
  traceCollector.add('pathFound', { path: same ? [sourceNodeId] : route.path });
  return { found: true, path: same ? [sourceNodeId] : route.path, selectedEdges: same ? [] : route.selectedEdges, nodesVisited, edgesExplored, trace: traceCollector.events };
}
