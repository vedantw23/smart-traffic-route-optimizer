#!/usr/bin/env python3
"""Validate a processed directed road graph and create a factual statistics report."""

from __future__ import annotations

import argparse
import json
import math
import sys
from collections import defaultdict, deque
from pathlib import Path
from typing import Any

DATA_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_GRAPH_PATH = DATA_ROOT / "data" / "processed" / "pune_roads.json"
DEFAULT_REPORT_PATH = DATA_ROOT / "reports" / "graph_statistics.json"


class GraphValidationError(ValueError):
    """Raised when a graph violates a required structural invariant."""


def _finite_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def _component_count(nodes: set[str], edges: list[dict[str, Any]]) -> int:
    neighbours: dict[str, set[str]] = defaultdict(set)
    for edge in edges:
        source, target = edge["from"], edge["to"]
        neighbours[source].add(target)
        neighbours[target].add(source)
    remaining = set(nodes)
    count = 0
    while remaining:
        count += 1
        queue = deque([remaining.pop()])
        while queue:
            node = queue.popleft()
            for neighbour in neighbours[node]:
                if neighbour in remaining:
                    remaining.remove(neighbour)
                    queue.append(neighbour)
    return count


def validate_dataset(dataset: dict[str, Any], dataset_size_bytes: int | None = None) -> dict[str, Any]:
    """Validate required data and return statistics. Optional OSM fields never invalidate a graph."""
    if not isinstance(dataset, dict):
        raise GraphValidationError("Graph JSON must be an object.")
    metadata = dataset.get("metadata")
    nodes = dataset.get("nodes")
    edges = dataset.get("edges")
    if not isinstance(metadata, dict) or not isinstance(nodes, list) or not isinstance(edges, list):
        raise GraphValidationError("Graph JSON requires metadata object plus nodes and edges arrays.")
    if not nodes or not edges:
        raise GraphValidationError("Graph must not be empty.")

    node_ids: set[str] = set()
    for node in nodes:
        if not isinstance(node, dict) or not isinstance(node.get("id"), str) or not node["id"]:
            raise GraphValidationError("Every node needs a non-empty string id.")
        if node["id"] in node_ids:
            raise GraphValidationError(f"Duplicate node id: {node['id']}")
        node_ids.add(node["id"])
        lat, lon = node.get("lat"), node.get("lon")
        if not _finite_number(lat) or not _finite_number(lon) or not -90 <= lat <= 90 or not -180 <= lon <= 180:
            raise GraphValidationError(f"Invalid coordinates for node {node['id']}.")

    edge_ids: set[str] = set()
    distances: list[float] = []
    road_types: set[str] = set()
    named_roads = missing_names = missing_speeds = 0
    degree: dict[str, int] = defaultdict(int)
    for edge in edges:
        if not isinstance(edge, dict) or not isinstance(edge.get("id"), str) or not edge["id"]:
            raise GraphValidationError("Every edge needs a non-empty string id.")
        if edge["id"] in edge_ids:
            raise GraphValidationError(f"Duplicate edge id: {edge['id']}")
        edge_ids.add(edge["id"])
        if edge.get("from") not in node_ids or edge.get("to") not in node_ids:
            raise GraphValidationError(f"Edge {edge['id']} references a missing node.")
        distance = edge.get("distance")
        if not _finite_number(distance) or distance < 0:
            raise GraphValidationError(f"Edge {edge['id']} has an invalid distance.")
        distances.append(float(distance))
        degree[edge["from"]] += 1
        degree[edge["to"]] += 1
        if edge.get("roadType"):
            road_types.add(str(edge["roadType"]))
        if edge.get("roadName"):
            named_roads += 1
        else:
            missing_names += 1
        if edge.get("maxSpeedKmph") is None:
            missing_speeds += 1

    return {
        "validationPassed": True,
        "totalNodes": len(nodes),
        "totalDirectedEdges": len(edges),
        "distinctRoadClassifications": len(road_types),
        "namedRoadEdges": named_roads,
        "edgesWithMissingRoadNames": missing_names,
        "edgesWithMissingSpeedLimits": missing_speeds,
        "minimumRoadSegmentDistanceMeters": min(distances),
        "maximumRoadSegmentDistanceMeters": max(distances),
        "averageRoadSegmentDistanceMeters": sum(distances) / len(distances),
        "isolatedNodes": sum(1 for node_id in node_ids if degree[node_id] == 0),
        "underlyingUndirectedConnectedComponents": _component_count(node_ids, edges),
        "datasetSizeMB": round((dataset_size_bytes or 0) / (1024 * 1024), 4),
    }


def print_summary(statistics: dict[str, Any]) -> None:
    print("Graph validation passed")
    for label, value in statistics.items():
        print(f"{label}: {value}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate a processed Pune road graph.")
    parser.add_argument("--input", type=Path, default=DEFAULT_GRAPH_PATH)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT_PATH)
    args = parser.parse_args()
    try:
        with args.input.open("r", encoding="utf-8") as graph_file:
            dataset = json.load(graph_file)
        statistics = validate_dataset(dataset, args.input.stat().st_size)
        args.report.parent.mkdir(parents=True, exist_ok=True)
        with args.report.open("w", encoding="utf-8") as report_file:
            json.dump(statistics, report_file, indent=2, allow_nan=False)
        print_summary(statistics)
    except (OSError, json.JSONDecodeError, GraphValidationError) as error:
        print(f"Validation failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
