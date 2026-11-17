# Pune Road-Network Data Preparation

This pipeline creates the real road graph used by the application. It intentionally does not include sample streets or fabricated coordinates: if OpenStreetMap extraction fails, it reports the failure and creates no replacement dataset.

## Why OpenStreetMap and OSMnx?

OpenStreetMap (OSM) is the source of real Pune road geometry and road attributes. OSMnx downloads the OSM `drive` network and preserves its directed NetworkX graph, including directed one-way connectivity and parallel carriageways.

- A **node** is a road intersection or endpoint with latitude and longitude.
- A **directed edge** is a valid road-travel segment from one node to another.
- The edge `distance` is its OSMnx length in metres.
- The graph remains directed so a one-way street never receives an invented reverse connection.

## Setup (Windows PowerShell)

```powershell
cd data-preparation
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Generate the full Pune dataset

```powershell
python scripts/download_roads.py --area full
python scripts/convert_graph.py
python scripts/validate_graph.py
```

The full extractor uses the exact place query `Pune, Maharashtra, India` and writes:

- `data/raw/pune_roads.graphml` — processed OSMnx source graph.
- `data/processed/pune_roads.json` — compact application graph.
- `reports/graph_statistics.json` — factual validation report.

For development only, this smaller, clearly labelled central-Pune bounding-box command is available:

```powershell
python scripts/download_roads.py --area test
python scripts/convert_graph.py --input data/raw/pune_test_area_roads.graphml --output data/processed/pune_test_area_roads.json
python scripts/validate_graph.py --input data/processed/pune_test_area_roads.json
```

The test-area output is not the complete Pune dataset and is not picked up by the backend.

## JSON schema

```json
{
  "metadata": { "city": "Pune", "networkType": "drive", "graphType": "directed", "weightUnit": "meters" },
  "nodes": [{ "id": "stable-osm-id", "lat": 18.52, "lon": 73.85 }],
  "edges": [{ "id": "source:target:key", "from": "source", "to": "target", "distance": 34.5, "roadType": "primary", "roadName": null, "oneway": true, "maxSpeedKmph": null, "maxSpeedRaw": null }]
}
```

`maxSpeedKmph` is null when OSM has no reliably parseable speed. `maxSpeedRaw` retains the source value where present. IDs include the NetworkX edge key so parallel directed edges are retained.

## Troubleshooting

- **Overpass timeout or rate limit:** wait and rerun the same command; no fake dataset is produced.
- **GraphML missing:** run the download command before conversion.
- **Validation error:** regenerate both GraphML and JSON; inspect the printed invariant failure.
- **Backend reports 503:** run the three full-dataset commands, then restart the backend.

## Attribution and licence

Road data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), available under the [Open Database License (ODbL)](https://opendatacommons.org/licenses/odbl/). The extraction timestamp is recorded as `metadata.generatedAt` in every generated JSON file. This project extracts vector road data; it does not download map tiles.
