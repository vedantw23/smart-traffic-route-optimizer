export const DEFAULT_SIGNAL_TIMING = Object.freeze({
  minimumGreenSeconds: 15,
  maximumGreenSeconds: 60,
  yellowSeconds: 4,
  allRedSeconds: 2,
  starvationCycles: 3,
  dischargeRateVehiclesPerSecond: 0.45,
});

export function validateTiming(timing) {
  const required = ['minimumGreenSeconds', 'maximumGreenSeconds', 'yellowSeconds', 'allRedSeconds', 'starvationCycles', 'dischargeRateVehiclesPerSecond'];
  for (const key of required) if (!Number.isFinite(timing[key]) || timing[key] < 0) throw new Error(`Invalid signal timing value: ${key}.`);
  if (timing.maximumGreenSeconds < timing.minimumGreenSeconds || timing.dischargeRateVehiclesPerSecond <= 0 || timing.starvationCycles < 1) throw new Error('Signal timing configuration has inconsistent bounds.');
}

export function schedulePhase({ queues, waitingCycles, previousPhase, timing = DEFAULT_SIGNAL_TIMING }) {
  validateTiming(timing);
  const phases = [
    { id: 'north-south', directions: ['north', 'south'], demand: queues.north + queues.south },
    { id: 'east-west', directions: ['east', 'west'], demand: queues.east + queues.west },
  ];
  const starved = phases.filter((phase) => waitingCycles[phase.id] >= timing.starvationCycles && phase.demand > 0);
  const eligible = starved.length ? starved : phases;
  const selected = eligible.sort((first, second) => second.demand - first.demand || (first.id === previousPhase ? 1 : -1))[0];
  const totalDemand = phases.reduce((sum, phase) => sum + phase.demand, 0);
  const extra = timing.maximumGreenSeconds - timing.minimumGreenSeconds;
  const ratio = totalDemand === 0 ? 0.5 : selected.demand / totalDemand;
  const greenSeconds = Math.min(timing.maximumGreenSeconds, Math.max(timing.minimumGreenSeconds, Math.round(timing.minimumGreenSeconds + (ratio * extra))));
  return {
    selectedPhase: selected.id, greenSeconds, yellowSeconds: timing.yellowSeconds, allRedSeconds: timing.allRedSeconds,
    explanation: starved.length
      ? `${selected.id === 'north-south' ? 'North-South' : 'East-West'} selected to prevent starvation after waiting ${waitingCycles[selected.id]} cycles.`
      : totalDemand === 0 ? 'No simulated queues are waiting; a balanced fallback phase was selected.'
        : `${selected.id === 'north-south' ? 'North-South' : 'East-West'} selected because its simulated vehicle queue (${selected.demand}) is higher than the competing safe phase.`,
  };
}
