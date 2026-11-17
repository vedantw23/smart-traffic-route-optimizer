#!/usr/bin/env python3
"""Convert a real OSMnx GraphML road network to the application's directed JSON schema."""

from __future__ import annotations

import argparse
import ast
import json
import math
import re
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from validate_graph import GraphValidationError, validate_dataset

DATA_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = DATA_ROOT / "data" / "raw" / "pune_roads.graphml"
DEFAULT_OUTPUT = DATA_ROOT / "data" / "processed" / "pune_roads.json"
DEFAULT_REPORT = DATA_ROOT / "reports" / "graph_statistics.json"
MPH_TO_KMPH = 1.609344


def listify(value: Any) -> list[Any]:
    if value is None:
        return []
    if isinstance(value, (list, tuple, set)):
        return list(value)
    if isinstance(value, str):
        try:
            parsed = ast.literal_eval(value)
            if isinstance(parsed, (list, tuple, set)):
                return list(parsed)
        except (ValueError, SyntaxError):
            pass
    return [value]


def normalise_text(value: Any) -> str | None:
    values = [str(item).strip() for item in listify(value) if str(item).strip()]
    return "; ".join(values) if values else None


def normalise_bool(value: Any) -> bool | None:
    if isinstance(value, bool):
        return value
    if value is None:
        return None
    text = str(value).strip().lower()
    if text in {"true", "yes", "1"}:
        return True
    if text in {"false", "no", "0"}:
        return False
    return None


def parse_maxspeed_kmph(value: Any) -> float | None:
    """Parse a reliable speed value; unknown and ambiguous OSM values remain null."""
    values = listify(value)
    if len(values) != 1:
        return None
    raw = str(values[0]).strip().lower()
    match = re.fullmatch(r"(\d+(?:\.\d+)?)\s*(km/?h|kph|kmh|mph)?", raw)
    if not match:
        return None
    speed = float(match.group(1))
    if not math.isfinite(speed) or speed < 0:
        return None
    if match.group(2) == "mph":
        speed *= MPH_TO_KMPH
    return round(speed, 3)


def as_finite_float(value: Any, field: str, identifier: str) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError) as error:
        raise GraphValidationError(f"{field} is missing or non-numeric for {identifier}.") from error
    if not math.isfinite(number):
        raise GraphValidationError(f"{field} is not finite for {identifier}.")
    return number


def edge_iterator(graph):
    if graph.is_multigraph():
        yield from graph.edges(keys=True, data=True)
    else:
        for source, target, attributes in graph.edges(data=True):
            yield source, target, 0, attributes


def convert_graph(graph) -> dict[str, Any]:
    if not graph.is_directed():
        raise GraphValidationError("Source GraphML is not directed. Refusing to lose one-way restrictions.")

    nodes: list[dict[str, Any]] = []
    for node_id, attributes in graph.nodes(data=True):
        node_key = str(node_id)
        lat = as_finite_float(attributes.get("y", attributes.get("lat")), "latitude", node_key)
        lon = as_finite_float(attributes.get("x", attributes.get("lon")), "longitude", node_key)
        nodes.append({"id": node_key, "lat": lat, "lon": lon})

    edges: list[dict[str, Any]] = []
    for source, target, key, attributes in edge_iterator(graph):
        source_id, target_id, key_id = str(source), str(target), str(key)
        edge_id = f"{source_id}:{target_id}:{key_id}"
        distance = as_finite_float(attributes.get("length"), "length", edge_id)
        if distance < 0:
            raise GraphValidationError(f"Negative length for edge {edge_id}.")
        raw_speed = attributes.get("maxspeed")
        edges.append({
            "id": edge_id,
            "from": source_id,
            "to": target_id,
            "distance": distance,
            "roadType": normalise_text(attributes.get("highway")),
            "roadName": normalise_text(attributes.get("name")),
            "oneway": normalise_bool(attributes.get("oneway")),
            "maxSpeedKmph": parse_maxspeed_kmph(raw_speed),
            "maxSpeedRaw": normalise_text(raw_speed),
        })

    return {
        "metadata": {
            "city": "Pune",
            "state": "Maharashtra",
            "country": "India",
            "source": "OpenStreetMap contributors",
            "networkType": "drive",
            "graphType": "directed",
            "weightUnit": "meters",
            "generatedAt": datetime.now(UTC).isoformat(),
            "nodeCount": len(nodes),
            "edgeCount": len(edges),
        },
        "nodes": nodes,
        "edges": edges,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert OSMnx GraphML into a directed road-graph JSON file.")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    args = parser.parse_args()
    try:
        import networkx as nx
    except ImportError:
        print("Conversion failed: NetworkX is not installed. Run: pip install -r requirements.txt", file=sys.stderr)
        return 1
    try:
        if not args.input.is_file():
            raise FileNotFoundError(f"GraphML file not found: {args.input}. Run download_roads.py first.")
        graph = nx.read_graphml(args.input, node_type=str, force_multigraph=True)
        dataset = convert_graph(graph)
        validate_dataset(dataset)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        with args.output.open("w", encoding="utf-8") as output_file:
            json.dump(dataset, output_file, separators=(",", ":"), allow_nan=False)
        statistics = validate_dataset(dataset, args.output.stat().st_size)
        args.report.parent.mkdir(parents=True, exist_ok=True)
        with args.report.open("w", encoding="utf-8") as report_file:
            json.dump(statistics, report_file, indent=2, allow_nan=False)
        print(f"Conversion complete: {args.output}")
        print(f"Nodes: {statistics['totalNodes']:,}; directed edges: {statistics['totalDirectedEdges']:,}")
    except (OSError, GraphValidationError, ValueError) as error:
        print(f"Conversion failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
