#!/usr/bin/env python3
"""Download an OpenStreetMap driving network for Pune without synthetic fallback data."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

FULL_PUNE_PLACE = "Pune, Maharashtra, India"
# [left, bottom, right, top] bounding box for a clearly labelled central-Pune test area.
# It is only a development fallback, never a substitute for the full city place query.
TEST_PUNE_BBOX = (73.846, 18.512, 73.866, 18.532)
RAW_DATA_DIR = Path(__file__).resolve().parents[1] / "data" / "raw"


def configure_osmnx(ox) -> None:
    """Set bounded, practical requests settings compatible with OSMnx 2.x."""
    ox.settings.requests_timeout = 180
    ox.settings.overpass_rate_limit = True
    ox.settings.use_cache = True


def download_full_pune(output_path: Path) -> None:
    try:
        import osmnx as ox
    except ImportError as error:
        raise RuntimeError("OSMnx is not installed. Run: pip install -r requirements.txt") from error

    configure_osmnx(ox)
    print(f"Requesting OpenStreetMap driving network for: {FULL_PUNE_PLACE}")
    try:
        graph = ox.graph_from_place(FULL_PUNE_PLACE, network_type="drive", simplify=True, retain_all=False)
    except Exception as error:  # OSM services can raise library-specific HTTP/timeout errors.
        raise RuntimeError(
            f"Could not download '{FULL_PUNE_PLACE}' from OpenStreetMap/Overpass. "
            "No data was generated. Check your network, wait for Overpass availability, and retry. "
            f"Original error: {error}"
        ) from error

    if graph.number_of_nodes() == 0 or graph.number_of_edges() == 0:
        raise RuntimeError("OpenStreetMap returned an empty driving graph; no file was written.")

    save_graph(ox, graph, output_path)


def save_graph(ox, graph, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        ox.save_graphml(graph, output_path)
    except Exception as error:
        raise RuntimeError(f"Downloaded graph could not be saved to {output_path}: {error}") from error

    print("Extraction complete.")
    print(f"GraphML: {output_path}")
    print(f"Nodes: {graph.number_of_nodes():,}")
    print(f"Directed edges: {graph.number_of_edges():,}")


def download_test_area(output_path: Path) -> None:
    try:
        import osmnx as ox
    except ImportError as error:
        raise RuntimeError("OSMnx is not installed. Run: pip install -r requirements.txt") from error
    configure_osmnx(ox)
    print(f"Requesting OpenStreetMap driving network for central Pune test bbox: {TEST_PUNE_BBOX}")
    try:
        graph = ox.graph_from_bbox(TEST_PUNE_BBOX, network_type="drive", simplify=True, retain_all=False)
    except Exception as error:
        raise RuntimeError(
            "Could not download the central Pune test area from OpenStreetMap/Overpass. "
            f"No data was generated. Original error: {error}"
        ) from error
    if graph.number_of_nodes() == 0 or graph.number_of_edges() == 0:
        raise RuntimeError("OpenStreetMap returned an empty test graph; no file was written.")
    save_graph(ox, graph, output_path)


def main() -> int:
    parser = argparse.ArgumentParser(description="Download a real Pune OSM driving network.")
    parser.add_argument("--area", choices=("full", "test"), default="full", help="full downloads Pune; test downloads only Shivajinagar, Pune.")
    args = parser.parse_args()
    output = RAW_DATA_DIR / ("pune_roads.graphml" if args.area == "full" else "pune_test_area_roads.graphml")
    try:
        if args.area == "full":
            download_full_pune(output)
        else:
            download_test_area(output)
    except RuntimeError as error:
        print(f"Extraction failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
