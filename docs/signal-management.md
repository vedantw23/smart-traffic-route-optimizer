# Phase 6: Greedy Traffic Signal Management

This is a software simulation. It never connects to, controls, or represents real Pune traffic-light hardware.

## Model

Each clearly labelled simulated intersection has North, South, East, and West queues. Safe phases are `north-south` and `east-west`; conflicting directions can never be green together.

The greedy rule chooses the safe phase with the highest total queue. A waiting phase with queued vehicles is promoted after three missed cycles, preventing starvation. Green time is:

```text
minimumGreen + (phaseQueue / totalQueue) × (maximumGreen - minimumGreen)
```

Example simulation-only safety values: 15–60 seconds green, 4 seconds yellow, 2 seconds all-red, and 0.45 discharged vehicles/second. These are academic model values, not approved signal-engineering timings.

## Complexity

There are two safe phases, so one scheduling decision is `O(1)` time and `O(1)` additional space. In a generalized system with `p` phases, selecting the largest eligible demand is `O(p)`.

## APIs

- `GET /api/signals/intersections`
- `GET /api/signals/status`
- `GET /api/signals/queues`
- `POST /api/signals/simulate` with optional `{ "intersectionId": "...", "trafficLevel": "low|medium|high" }`
- `GET /api/signals/statistics`
- `POST /api/signals/reset`

Queues are seeded and reproducible. They are separate from road congestion simulation and are never live traffic measurements.
