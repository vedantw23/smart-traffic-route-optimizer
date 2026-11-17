import { performance } from 'node:perf_hooks';
import astar from '../algorithms/astar.js';
import dijkstra from '../algorithms/dijkstra.js';
import { calculateEdgeCost, DEFAULT_EDGE_COST_CONFIG } from './edgeCostService.js';
import { graphService } from './graphService.js';
import { TrafficSimulationService, trafficSimulationService } from './trafficSimulationService.js';

const algorithmDefinitions = {
  dijkstra: { label: 'Dijkstra', execute: dijkstra },
  astar: { label: 'A*', execute: astar },
};

export class RouteInputError extends Error {
  constructor(message, statusCode = 400) { super(message); this.name = 'RouteInputError'; this.statusCode = statusCode; }
}

function buildResult({ algorithm, result, graph, sourceNodeId, destinationNodeId, executionTimeMs, edgeCostConfig, edgeCost, traffic }) {
  if (!result.found) return { success: false, algorithm, sourceNode: sourceNodeId, destinationNode: destinationNodeId, message: 'No directed route exists between the selected nodes.', path: [], selectedEdges: [], totalDistanceMeters: null, estimatedTravelTimeSeconds: null, nodesVisited: result.nodesVisited, edgesExplored: result.edgesExplored, executionTimeMs, routeCoordinates: [], trace: result.trace };
  const totals = result.selectedEdges.reduce((current, edge) => {
    const cost = edgeCost(edge, edgeCostConfig);
    const baseline = calculateEdgeCost(edge, edgeCostConfig);
    return { distance: current.distance + cost.distanceMeters, travelTime: current.travelTime + cost.travelTimeSeconds, baselineTime: current.baselineTime + baseline.travelTimeSeconds };
  }, { distance: 0, travelTime: 0, baselineTime: 0 });
  return {
    success: true, algorithm, sourceNode: sourceNodeId, destinationNode: destinationNodeId,
    path: result.path, selectedEdges: result.selectedEdges.map((edge) => {
      const simulatedCost = edgeCost(edge, edgeCostConfig);
      return { id: edge.id, from: edge.from, to: edge.to, distance: edge.distance, congestionLevel: simulatedCost.congestionLevel || null, congestionMultiplier: simulatedCost.congestionMultiplier || 1 };
    }),
    totalDistanceMeters: Number(totals.distance.toFixed(3)), baselineTravelTimeSeconds: Number(totals.baselineTime.toFixed(3)), estimatedTravelTimeSeconds: Number(totals.travelTime.toFixed(3)), trafficSimulation: traffic,
    nodesVisited: result.nodesVisited, edgesExplored: result.edgesExplored, executionTimeMs: Number(executionTimeMs.toFixed(3)),
    routeCoordinates: result.path.map((nodeId) => ({ latitude: graph.nodes.get(nodeId).lat, longitude: graph.nodes.get(nodeId).lon })), trace: result.trace,
  };
}

export class RouteService {
  constructor({ service = graphService, edgeCostConfig = DEFAULT_EDGE_COST_CONFIG, trafficService = null } = {}) {
    this.service = service;
    this.edgeCostConfig = edgeCostConfig;
    this.trafficService = trafficService || (service === graphService ? trafficSimulationService : new TrafficSimulationService({ service }));
  }

  async calculate(algorithmKey, sourceNodeId, destinationNodeId, trace = { enabled: false, limit: 0 }) {
    const definition = algorithmDefinitions[algorithmKey];
    if (!definition) throw new RouteInputError('Unsupported route algorithm.');
    if (typeof sourceNodeId !== 'string' || typeof destinationNodeId !== 'string' || !sourceNodeId || !destinationNodeId) throw new RouteInputError('sourceNodeId and destinationNodeId are required strings.');
    const graph = await this.service.load();
    if (!graph.nodes.has(sourceNodeId)) throw new RouteInputError(`Source node '${sourceNodeId}' was not found.`, 404);
    if (!graph.nodes.has(destinationNodeId)) throw new RouteInputError(`Destination node '${destinationNodeId}' was not found.`, 404);
    await this.trafficService.ensureSimulation();
    const traffic = await this.trafficService.getCurrent();
    const edgeCost = (edge) => this.trafficService.getEdgeCost(edge);
    const startedAt = performance.now();
    const result = definition.execute({ sourceNodeId, destinationNodeId, adjacency: graph.adjacency, nodes: graph.nodes, edgeCostConfig: this.edgeCostConfig, edgeCost, trace });
    return buildResult({ algorithm: definition.label, result, graph, sourceNodeId, destinationNodeId, executionTimeMs: performance.now() - startedAt, edgeCostConfig: this.edgeCostConfig, edgeCost, traffic });
  }

  async compare(sourceNodeId, destinationNodeId) {
    const [dijkstraResult, astarResult] = await Promise.all([
      this.calculate('dijkstra', sourceNodeId, destinationNodeId), this.calculate('astar', sourceNodeId, destinationNodeId),
    ]);
    return {
      dijkstra: dijkstraResult, astar: astarResult,
      comparison: { bothFound: dijkstraResult.success && astarResult.success, sameEstimatedTravelTime: dijkstraResult.estimatedTravelTimeSeconds === astarResult.estimatedTravelTimeSeconds },
    };
  }
}

export const routeService = new RouteService();
