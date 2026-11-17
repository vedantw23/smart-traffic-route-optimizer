# Architecture

## Overview

The Phase 1 architecture separates the presentation layer from the API layer so later algorithm, map, and simulation modules can grow without entangling UI code and server logic.

```text
React + Vite UI  --Axios-->  Express API
  components/pages             routes/controllers/services
       |                              |
       +-- React Router                +-- GraphService (cached adjacency Map)
                                                  |
Python OSMnx + NetworkX  --GraphML/JSON--> data-preparation/data
```

## Frontend

`frontend/src` is organized by responsibility:

- `components/layout`: persistent sidebar and header shell.
- `components/dashboard`: reusable dashboard cards.
- `components/common`: shared status display elements.
- `pages`: route-level content.
- `services/api.js`: the single Axios client and API operations.

The layout makes one health-check call on startup. Its state is displayed in the header as Checking, API Connected, or API Disconnected, while preserving the rest of the application if the API is unavailable.

## Backend

The Express app uses a lightweight layered structure:

- `config/env.js`: validates and exposes environment configuration.
- `routes`: maps HTTP paths to controllers.
- `controllers`: prepares API responses.
- `middleware`: handles missing routes and unexpected errors centrally.

The Express layer exposes `GET /api/health` and focused graph endpoints. `GraphService` reads the processed JSON by an absolute module-derived path, caches it in memory, and uses `Map<NodeId, Edge[]>` adjacency lists. It never returns the entire graph in one response. A missing or malformed graph produces a clear unavailable-data response rather than fabricated data.

For Phase 3, `GraphService` additionally builds one immutable KD-tree from loaded graph-node coordinates. `GET /api/graph/nearest-node` validates coordinates and performs a Haversine-based nearest-node lookup without rescanning every node. The React Route Optimization page calls this endpoint for map clicks and guards each start/destination request against stale responses.

## Data preparation

`data-preparation/scripts/download_roads.py` downloads the real directed `drive` network for the exact OSMnx place query `Pune, Maharashtra, India` and saves its GraphML source. `convert_graph.py` preserves source direction and NetworkX edge keys in JSON edge IDs. `validate_graph.py` rejects duplicate identifiers, invalid coordinates, invalid distances, missing endpoint references, and empty graphs before reporting factual statistics.

OpenStreetMap source data is attributed to OpenStreetMap contributors under ODbL. No Phase 2 component calculates routes, alters road weights, simulates traffic, or renders a Leaflet map.

## Configuration

The browser API base URL comes from `VITE_API_BASE_URL`. Backend port, environment, and allowed frontend origin come from `PORT`, `NODE_ENV`, and `FRONTEND_URL`. `.env.example` documents each value; actual `.env` files remain ignored.
