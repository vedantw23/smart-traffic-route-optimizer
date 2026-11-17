export function createTraceCollector({ enabled = false, limit = 0 } = {}) {
  const events = [];
  return {
    events,
    add(type, data) { if (enabled && events.length < limit) events.push({ type, ...data }); },
  };
}

export function reconstructPath(sourceNodeId, destinationNodeId, previous) {
  const path = [];
  const selectedEdges = [];
  let current = destinationNodeId;
  while (current !== sourceNodeId) {
    const record = previous.get(current);
    if (!record) return null;
    path.push(current);
    selectedEdges.push(record.edge);
    current = record.nodeId;
  }
  path.push(sourceNodeId);
  return { path: path.reverse(), selectedEdges: selectedEdges.reverse() };
}
