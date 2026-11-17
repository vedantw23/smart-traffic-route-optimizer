# Eight-Phase Development Roadmap

## Phase 1 — Foundation and full-stack setup

Create the Vite/React dashboard, Express API, documentation, and health-check connection. This phase contains no traffic algorithms or fabricated traffic data.

## Phase 2 — Pune road-network extraction and graph construction

Download Pune's real OpenStreetMap driving network, retain GraphML for reproducibility, and convert it to a validated, weighted directed adjacency-list dataset. Preserve parallel edges and one-way connectivity. This phase prepares graph data only; it does not implement shortest-path algorithms.

## Phase 3 — Interactive Pune map and node selection

Provide a Leaflet/OpenStreetMap map centered on Pune, endpoint selection, and backend nearest-road-node lookup through a cached spatial index. No route is calculated in this phase.

## Phase 4 — Dijkstra and A* route algorithms

Implement Dijkstra and A* on the existing directed graph using a reusable min-heap, one consistent estimated-time edge model, Haversine lower-bound heuristic, selected-edge reconstruction, API endpoints, map routes, and bounded trace support.

## Phase 5 — Traffic simulation

Add controlled low, medium, and high traffic scenarios that adjust road costs without claiming live monitoring.

## Phase 6 — Greedy signal management

Implement reproducible vehicle-queue simulation and a safe greedy phase scheduler with anti-starvation, green/yellow/all-red timings, APIs, dashboard visualization, and test coverage. This is an academic simulation only.

## Phase 7 — Algorithm visualizer

Visualize Dijkstra, A*, and Kruskal's minimum spanning tree with understandable graph states.

## Phase 8 — Performance analysis and academic delivery

Add repeatable performance comparisons, including runtime, visited nodes, and route-cost results.

