# DAA Project Submission Notes

## Problem and objectives

The system demonstrates how graph algorithms and greedy scheduling can support an academic smart-traffic simulation for Pune. It optimizes simulated estimated travel time, demonstrates safe queue-based signal allocation, and illustrates a minimum spanning tree. It does not provide live traffic monitoring or real signal control.

## Architecture and data structures

React provides the dashboard, Leaflet renders the OpenStreetMap base map, and Express exposes focused APIs. OSMnx/NetworkX prepare a directed graph. The backend uses `Map<NodeId, Edge[]>` adjacency lists, a binary min-heap, KD-tree nearest-node lookup, DSU for Kruskal, and seeded state for traffic/queue simulation.

## Algorithms

| Algorithm | Role | Complexity |
|---|---|---|
| Dijkstra | Directed shortest estimated-time path | `O((V+E) log V)` |
| A* | Heuristic directed shortest estimated-time path | worst case `O((V+E) log V)` |
| Greedy scheduling | Serves highest eligible simulated safe phase | `O(p)` for `p` phases |
| Kruskal | Minimum spanning tree/forest of a selected subgraph | `O(E log E)` |

Dijkstra/A* use the same simulated traffic-aware costs. Kruskal is not a route algorithm. The greedy schedule is a heuristic, not a global optimum.

## Test evidence

Run `npm test` in `backend`, `npm run build` in `frontend`, and the Python data tests in `data-preparation`. Capture screenshots of Dashboard, Route Optimization, Traffic Simulation, Signal Management, Algorithm Visualizer, and Performance Analysis for submission.

## Limitations and future scope

The available development fallback is a real central-Pune OSM extract, not all of Pune. Road routes are rendered as node-coordinate lines where edge geometry is unavailable. Traffic and queues are explicitly simulated. Future scope includes a complete Pune extract, map edge geometry, richer benchmarking, and carefully validated real-data integrations.
