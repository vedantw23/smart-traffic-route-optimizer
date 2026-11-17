# Smart Traffic Management and Route Optimization

Phases 1–2 establish the full-stack foundation for an academic Design and Analysis of Algorithms (DAA) project focused on Pune, Maharashtra. The application provides a responsive React dashboard, health-checked Express API, and a reproducible OpenStreetMap-to-directed-graph data pipeline. It does not claim real-time traffic monitoring or implement future algorithms early.

## Technology stack

- Frontend: React, Vite, JavaScript, Tailwind CSS, React Router DOM, Lucide React, Axios
- Backend: Node.js, Express, CORS, dotenv, Nodemon
- Data preparation: Python, OSMnx, NetworkX, OpenStreetMap
- Package manager: npm

## Project structure

```text
frontend/                 React dashboard and API client
backend/                  Express API and health endpoint
data-preparation/         Reserved for later road-network preparation
docs/                     Architecture and phase roadmap
data-preparation/         OSM extraction, conversion, validation, and dataset documentation
```

## Prerequisites

- Node.js 18 or newer
- npm 9 or newer

## Installation

From the project root:

```bash
npm run install:all
```

Copy the environment templates before running:

```powershell
Copy-Item frontend/.env.example frontend/.env
Copy-Item backend/.env.example backend/.env
```

On macOS/Linux, use `cp` instead of `Copy-Item`.

## Run the project

Run both applications from the root:

```bash
npm run dev
```

Or run them independently:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

The frontend defaults to [http://localhost:5173](http://localhost:5173). The API defaults to [http://localhost:5000](http://localhost:5000).

Run final automated checks from the root:

```bash
npm test
npm run build
```

## API health check

`GET /api/health` returns the current API availability and configured environment:

```json
{
  "success": true,
  "message": "Smart Traffic Management API is running",
  "project": "Smart Traffic Management and Route Optimization",
  "environment": "development"
}
```

## Road-network preparation (Phase 2)

The backend will only load a real processed Pune dataset. Generate it locally from OpenStreetMap before using graph endpoints:

```powershell
cd data-preparation
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python scripts/download_roads.py --area full
python scripts/convert_graph.py
python scripts/validate_graph.py
```

See [data-preparation/README.md](data-preparation/README.md) for test-area usage, troubleshooting, schema details, and attribution. Generated data stays out of Git because the real dataset can be large.

Graph API endpoints (none returns the complete graph):

- `GET /api/graph/status`
- `GET /api/graph/statistics`
- `GET /api/graph/metadata`
- `GET /api/graph/node/:id`

## Interactive map (Phase 3)

The Route Optimization page now provides an interactive Leaflet/OpenStreetMap map of Pune. Click to select a start and destination; the frontend asks the backend for the nearest actual road-graph node and displays the node ID and coordinate offset. It deliberately does **not** calculate routes in this phase.

The nearest-node endpoint is:

```text
GET /api/graph/nearest-node?lat=18.5204&lon=73.8567
```

It returns HTTP 400 for invalid coordinates and HTTP 503 when the full processed road graph is unavailable. See [map-integration.md](docs/map-integration.md) for tile attribution, Haversine distance, request handling, and current limitations.

## Route algorithms (Phase 4)

The Route Optimization page can calculate and compare directed routes with Dijkstra and A*. Both use the same estimated travel-time model and preserve one-way restrictions and parallel edges. Select two locations whose nearest graph nodes have resolved, then use **Find Dijkstra route**, **Find A* route**, or **Compare algorithms**.

```text
POST /api/routes/dijkstra
POST /api/routes/astar
POST /api/routes/compare
```

Request body:

```json
{ "sourceNodeId": "source", "destinationNodeId": "destination" }
```

Estimated times are baseline calculations using OSM speed limits where available and documented road-type defaults otherwise; they are not real-time traffic predictions. [route-algorithms.md](docs/route-algorithms.md) covers the cost model, A* heuristic, pseudocode, complexity, and result fields.

## Signal management (Phase 6)

The Signal Management page demonstrates a greedy, queue-prioritized scheduler for clearly labelled simulated four-way Pune intersections. It enforces safe North-South versus East-West phases, minimum/maximum green durations, yellow, all-red clearance, and anti-starvation logic. It cannot control real traffic lights. See [signal-management.md](docs/signal-management.md).

## Algorithm visualizer and analysis (Phase 7)

The Algorithm Visualizer replays bounded trace events for Dijkstra, A*, and Kruskal. The Performance Analysis page measures Dijkstra and A* only on identical route inputs. Kruskal is shown as a minimum-spanning-tree demonstration, never as a shortest-route algorithm. See [algorithm-visualizer.md](docs/algorithm-visualizer.md).

## Deployment and submission

See [deployment.md](docs/deployment.md) for Vercel/static-frontend and Node backend preparation. No production deployment has been made. See [daa-submission.md](docs/daa-submission.md) for the academic report outline, implementation summary, complexities, evidence, and limitations.

### Development dataset fallback

If the full `pune_roads.json` is absent, the backend now loads `pune_test_area_roads.json` when it exists. This is a real central-Pune OpenStreetMap extract that enables local map snapping and route demonstrations, but it is clearly identified by API status as `central-pune-test-area` and is not full Pune coverage. The full graph always takes precedence when generated.

## Development roadmap

1. Project foundation and full-stack setup (complete)
2. Pune road-network extraction and directed graph construction (pipeline complete; dataset generation required)
3. Interactive Pune map and nearest-node selection (complete; requires a generated full graph for snapping)
4. Dijkstra and A* route algorithms (complete; requires a generated full graph)
5. Traffic-condition simulation
6. Greedy traffic signal scheduling
7. Algorithm visualizer and Kruskal MST demonstration
8. Performance analysis dashboard and academic delivery

Real road data, traffic simulation, and algorithms are deliberately scheduled for later phases. See [architecture.md](docs/architecture.md) and [development-roadmap.md](docs/development-roadmap.md) for detail.
