# Phase 3: Interactive Pune Map

## Components

The Route Optimization page uses [Leaflet](https://leafletjs.com/) through [React-Leaflet](https://react-leaflet.js.org/) to render an interactive map centered on Pune. Leaflet supplies zooming and panning; React-Leaflet makes Leaflet layers and map events usable as React components.

The base map uses OpenStreetMap raster tiles. The tile layer visibly credits OpenStreetMap contributors. The application makes ordinary interactive tile requests only; it does not bulk-download or scrape map tiles. Review the [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/) before hosting at scale.

## Location selection and node snapping

Users choose whether their next click sets the start or destination. The browser sends the clicked latitude and longitude to:

```text
GET /api/graph/nearest-node?lat=<latitude>&lon=<longitude>
```

When the real processed Pune graph is loaded, the backend builds an in-memory KD-tree once. Each lookup uses it with Haversine distance to return the closest actual graph node and its offset in metres. The frontend associates request versions with each endpoint, so a slow earlier response cannot overwrite a later map click.

The map's displayed straight-line distance is Haversine/geodesic distance between the two selected clicks. It is explicitly not a road distance or a route result.

Nearest geometry does not guarantee the selected road direction is reachable (for example, on divided roads). This academic limitation is recorded in the UI and will remain modular for future improvement.

## Road overlay decision

The current Phase 2 JSON stores topology and node coordinates, but intentionally does not include edge polylines. Sending its entire dataset to the browser would not scale. Therefore, Phase 3 presents OpenStreetMap tiles and interactive graph-node snapping but does not draw a fabricated road overlay. A future lightweight, filtered GeoJSON export can reuse GraphML geometry once the full Pune dataset is generated.

## Dataset prerequisite

The server returns HTTP 503 from nearest-node requests if `data-preparation/data/processed/pune_roads.json` does not exist. Generate the full real dataset using the documented Phase 2 commands, then restart the backend. The small central-Pune test extract is not a replacement for the full-city graph.
