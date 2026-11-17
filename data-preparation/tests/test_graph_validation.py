import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from validate_graph import GraphValidationError, validate_dataset


def sample_graph():
    return {
        "metadata": {"city": "Test"},
        "nodes": [
            {"id": "a", "lat": 18.5, "lon": 73.8},
            {"id": "b", "lat": 18.6, "lon": 73.9},
        ],
        "edges": [
            {"id": "a:b:0", "from": "a", "to": "b", "distance": 10.0, "roadType": "primary", "roadName": None, "maxSpeedKmph": None},
            {"id": "a:b:1", "from": "a", "to": "b", "distance": 12.0, "roadType": "primary", "roadName": "Parallel Road", "maxSpeedKmph": 40.0},
        ],
    }


class GraphValidationTests(unittest.TestCase):
    def test_parallel_and_one_way_edges_are_valid(self):
        statistics = validate_dataset(sample_graph())
        self.assertEqual(statistics["totalDirectedEdges"], 2)
        self.assertEqual(statistics["totalNodes"], 2)

    def test_duplicate_ids_are_rejected(self):
        graph = sample_graph()
        graph["edges"][1]["id"] = "a:b:0"
        with self.assertRaises(GraphValidationError):
            validate_dataset(graph)

    def test_invalid_coordinates_are_rejected(self):
        graph = sample_graph()
        graph["nodes"][0]["lat"] = 100
        with self.assertRaises(GraphValidationError):
            validate_dataset(graph)

    def test_negative_distances_are_rejected(self):
        graph = sample_graph()
        graph["edges"][0]["distance"] = -1
        with self.assertRaises(GraphValidationError):
            validate_dataset(graph)


if __name__ == "__main__":
    unittest.main()
