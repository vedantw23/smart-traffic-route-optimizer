import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceDirectory = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_GRAPH_PATH = path.resolve(sourceDirectory, '../../../data-preparation/data/processed/pune_roads.json');
export const DEFAULT_STATISTICS_PATH = path.resolve(sourceDirectory, '../../../data-preparation/reports/graph_statistics.json');
export const TEST_GRAPH_PATH = path.resolve(sourceDirectory, '../../../data-preparation/data/processed/pune_test_area_roads.json');
export const TEST_STATISTICS_PATH = path.resolve(sourceDirectory, '../../../data-preparation/reports/pune_test_area_statistics.json');

export class GraphDataUnavailableError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GraphDataUnavailableError';
    this.statusCode = 503;
  }
}

const requiredMetadata = ['city', 'source', 'networkType', 'graphType', 'weightUnit', 'nodeCount', 'edgeCount'];
const EARTH_RADIUS_METERS = 6_371_008.8;

function haversineDistanceMeters(latA, lonA, latB, lonB) {
  const radians = Math.PI / 180;
  const deltaLat = (latB - latA) * radians;
  const deltaLon = (lonB - lonA) * radians;
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(latA * radians) * Math.cos(latB * radians) * Math.sin(deltaLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(a)));
}

function longitudeDelta(lonA, lonB) {
  const delta = Math.abs(lonA - lonB);
  return Math.min(delta, 360 - delta);
}

function buildKdTree(points, depth = 0) {
  if (points.length === 0) return null;
  const axis = depth % 2;
  points.sort((first, second) => (axis === 0 ? first.lat - second.lat : first.lon - second.lon));
  const middle = Math.floor(points.length / 2);
  return {
    point: points[middle],
    axis,
    left: buildKdTree(points.slice(0, middle), depth + 1),
    right: buildKdTree(points.slice(middle + 1), depth + 1),
  };
}

function nearestKdPoint(tree, latitude, longitude, best = null) {
  if (!tree) return best;
  const distance = haversineDistanceMeters(latitude, longitude, tree.point.lat, tree.point.lon);
  const candidate = !best || distance < best.distance ? { point: tree.point, distance } : best;
  const coordinate = tree.axis === 0 ? latitude : longitude;
  const split = tree.axis === 0 ? tree.point.lat : tree.point.lon;
  const firstBranch = coordinate < split ? tree.left : tree.right;
  const secondBranch = coordinate < split ? tree.right : tree.left;
  const nextBest = nearestKdPoint(firstBranch, latitude, longitude, candidate);
  const degreeDifference = tree.axis === 0 ? Math.abs(latitude - split) : longitudeDelta(longitude, split);
  const lowerBound = tree.axis === 0
    ? degreeDifference * 111_320
    : degreeDifference * 111_320 * Math.cos(latitude * Math.PI / 180);
  return lowerBound <= nextBest.distance
    ? nearestKdPoint(secondBranch, latitude, longitude, nextBest)
    : nextBest;
}

function validateDataset(dataset) {
  if (!dataset || typeof dataset !== 'object' || !Array.isArray(dataset.nodes) || !Array.isArray(dataset.edges) || !dataset.metadata) {
    throw new GraphDataUnavailableError('Processed graph data is malformed. Regenerate it with the data preparation scripts.');
  }
  for (const key of requiredMetadata) {
    if (dataset.metadata[key] === undefined || dataset.metadata[key] === null) {
      throw new GraphDataUnavailableError(`Processed graph metadata is missing '${key}'. Regenerate the dataset.`);
    }
  }
  if (!Number.isInteger(dataset.metadata.nodeCount) || !Number.isInteger(dataset.metadata.edgeCount)) {
    throw new GraphDataUnavailableError('Processed graph metadata has invalid node or edge counts. Regenerate the dataset.');
  }
}

export class GraphService {
  constructor({ graphPath = DEFAULT_GRAPH_PATH, statisticsPath = DEFAULT_STATISTICS_PATH } = {}) {
    this.graphPath = graphPath;
    this.statisticsPath = statisticsPath;
    this.graph = null;
    this.loadingPromise = null;
    this.usingDevelopmentTestDataset = false;
  }

  async load() {
    if (this.graph) return this.graph;
    if (!this.loadingPromise) this.loadingPromise = this.#loadFromDisk();
    try {
      this.graph = await this.loadingPromise;
      return this.graph;
    } finally {
      this.loadingPromise = null;
    }
  }

  async #loadFromDisk() {
    let dataset;
    try {
      dataset = JSON.parse(await readFile(this.graphPath, 'utf8'));
    } catch (error) {
      if (error.code === 'ENOENT' && this.graphPath === DEFAULT_GRAPH_PATH) {
        try {
          dataset = JSON.parse(await readFile(TEST_GRAPH_PATH, 'utf8'));
          this.usingDevelopmentTestDataset = true;
        } catch (fallbackError) {
          if (fallbackError.code === 'ENOENT') throw new GraphDataUnavailableError('Pune road network dataset has not been generated. Run the data preparation scripts to create it.');
          throw new GraphDataUnavailableError(`Unable to read the central-Pune test dataset: ${fallbackError.message}`);
        }
      } else if (error.code === 'ENOENT') {
        throw new GraphDataUnavailableError('Pune road network dataset has not been generated. Run the data preparation scripts to create it.');
      } else {
        throw new GraphDataUnavailableError(`Unable to read the processed graph dataset: ${error.message}`);
      }
    }
    validateDataset(dataset);
    const nodes = new Map();
    const adjacency = new Map();
    const edgeIds = new Set();
    for (const node of dataset.nodes) {
      if (!node?.id || nodes.has(String(node.id))) throw new GraphDataUnavailableError('Processed graph contains duplicate or invalid node IDs.');
      if (!Number.isFinite(node.lat) || !Number.isFinite(node.lon)) throw new GraphDataUnavailableError(`Node ${node.id} has invalid coordinates.`);
      const id = String(node.id);
      nodes.set(id, { ...node, id });
      adjacency.set(id, []);
    }
    for (const edge of dataset.edges) {
      const source = String(edge?.from ?? '');
      const target = String(edge?.to ?? '');
      if (!edge?.id || edgeIds.has(String(edge.id)) || !nodes.has(source) || !nodes.has(target) || !Number.isFinite(edge.distance) || edge.distance < 0) {
        throw new GraphDataUnavailableError('Processed graph contains invalid directed edges. Regenerate the dataset.');
      }
      edgeIds.add(String(edge.id));
      adjacency.get(source).push({ ...edge, id: String(edge.id), from: source, to: target });
    }
    if (nodes.size !== dataset.metadata.nodeCount || edgeIds.size !== dataset.metadata.edgeCount) {
      throw new GraphDataUnavailableError('Processed graph metadata does not match its nodes or edges. Regenerate the dataset.');
    }
    const bounds = [...nodes.values()].reduce((current, node) => ({
      south: Math.min(current.south, node.lat), north: Math.max(current.north, node.lat),
      west: Math.min(current.west, node.lon), east: Math.max(current.east, node.lon),
    }), { south: Infinity, north: -Infinity, west: Infinity, east: -Infinity });
    const metadata = this.usingDevelopmentTestDataset
      ? { ...dataset.metadata, datasetScope: 'central-pune-test-area', datasetNotice: 'Using a real central-Pune OpenStreetMap test dataset because the full Pune dataset is unavailable.' }
      : { ...dataset.metadata, datasetScope: 'full-pune' };
    return { metadata: { ...metadata, bounds }, nodes, adjacency, spatialIndex: buildKdTree([...nodes.values()]) };
  }

  async getStatus() {
    try {
      const graph = await this.load();
      return { loaded: true, ...graph.metadata };
    } catch (error) {
      if (error instanceof GraphDataUnavailableError) return { loaded: false, message: error.message };
      throw error;
    }
  }

  async getMetadata() { return (await this.load()).metadata; }
  async getNode(id) { return (await this.load()).nodes.get(String(id)) || null; }
  async getOutgoingEdges(id) {
    const graph = await this.load();
    return graph.nodes.has(String(id)) ? graph.adjacency.get(String(id)) : null;
  }

  async findNearestNode(latitude, longitude) {
    const graph = await this.load();
    const { south, north, west, east } = graph.metadata.bounds;
    if (latitude < south || latitude > north || longitude < west || longitude > east) {
      const error = new Error('Selected point is outside the loaded road-network coverage. Choose a point inside the displayed map area.');
      error.statusCode = 400;
      throw error;
    }
    const nearest = nearestKdPoint(graph.spatialIndex, latitude, longitude);
    if (!nearest) throw new GraphDataUnavailableError('Processed graph contains no nodes for nearest-node lookup.');
    return {
      nodeId: nearest.point.id,
      latitude: nearest.point.lat,
      longitude: nearest.point.lon,
      distanceMeters: Number(nearest.distance.toFixed(3)),
    };
  }

  async getStatistics() {
    await this.load();
    try {
      const statisticsPath = this.usingDevelopmentTestDataset ? TEST_STATISTICS_PATH : this.statisticsPath;
      return JSON.parse(await readFile(statisticsPath, 'utf8'));
    } catch (error) {
      if (error.code === 'ENOENT') throw new GraphDataUnavailableError('Graph statistics are unavailable. Run the conversion and validation scripts.');
      throw new GraphDataUnavailableError(`Unable to read graph statistics: ${error.message}`);
    }
  }
}

export const graphService = new GraphService();
