# Phase 4: Dijkstra and A* Route Algorithms

## Directed weighted road graph

Every road-network edge is directed: it can only be traversed in the direction stored by OpenStreetMap. This preserves one-way roads. Parallel edges are retained independently, and route reconstruction records the exact selected edge.

## Edge-cost model

Both algorithms minimize the same estimated travel time. For each edge:

```text
travelTimeSeconds = distanceMeters / speedMetersPerSecond
```

When a valid OSM `maxspeed` is present, it is used. Missing speeds use documented baseline values by road class (for example primary: 60 km/h and residential: 30 km/h). All values are capped at 90 km/h. These are planning assumptions only, not measured or live Pune traffic speeds.

## Dijkstra

Dijkstra repeatedly selects the unsettled node with the lowest known travel time, then relaxes its outgoing edges.

```text
set source cost to 0; add source to min-heap
while heap is not empty:
  take node with smallest cost
  for each outgoing edge:
    relax its destination if a lower cost is found
reconstruct the selected edge chain from destination to source
```

With a binary min-heap, its time complexity is `O((V + E) log V)` and memory complexity is `O(V)` beyond the graph.

## A*

A* uses `f(n) = g(n) + h(n)`, where `g(n)` is travelled estimated time and `h(n)` estimates the remaining lower-bound time. `h(n)` is Haversine straight-line distance divided by 90 km/h—the maximum allowed speed in the edge-cost model. Because every edge uses a speed no greater than 90 km/h and road segment distance is no less than straight-line separation, this is an admissible lower bound.

A* has the same worst-case complexity as Dijkstra, `O((V + E) log V)`, but may explore fewer nodes when the heuristic guides it well. It is not guaranteed to be faster for every route.

## API

```text
POST /api/routes/dijkstra
POST /api/routes/astar
POST /api/routes/compare
```

Each expects:

```json
{ "sourceNodeId": "actual-node-id", "destinationNodeId": "actual-node-id" }
```

Results contain selected node IDs, exact selected edges, route distance, estimated travel time, explored/visited counts, execution time, and route-node coordinates. They return 400 for invalid requests, 404 for missing node IDs, and 503 when the real processed graph is unavailable.

Trace event collection is prepared for Phase 7. It is disabled in ordinary API calculations and bounded by an explicit limit when enabled.

## Map rendering

Leaflet joins route-node coordinates in their selected directed order. Since the current JSON does not retain edge polylines, this is a simplified rendering of actual graph nodes, not an invented road geometry.
