import { useCallback, useEffect, useMemo } from 'react';
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const PUNE_CENTER = [18.5204, 73.8567];

function MapClickHandler({ onCoordinateSelect, bounds }) {
  useMapEvents({ click: (event) => {
    const [[south, west], [north, east]] = bounds || [[-90, -180], [90, 180]];
    if (event.latlng.lat >= south && event.latlng.lat <= north && event.latlng.lng >= west && event.latlng.lng <= east) {
      onCoordinateSelect({ lat: event.latlng.lat, lon: event.latlng.lng });
    }
  } });
  return null;
}

function CoverageController({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (!bounds) return;
    map.setMaxBounds(null);
    map.fitBounds(bounds, { padding: [18, 18], animate: false });
    map.setMinZoom(map.getZoom());
    map.setMaxBounds(bounds);
    map.panInsideBounds(bounds, { animate: false });
  }, [map, bounds]);
  return null;
}

function SelectionMarker({ selection, color, label }) {
  if (!selection) return null;
  return (
    <CircleMarker center={[selection.lat, selection.lon]} radius={10} pathOptions={{ color, fillColor: color, fillOpacity: 0.9, weight: 3 }}>
      <Tooltip direction="top" offset={[0, -8]} opacity={1}>{label}</Tooltip>
      <Popup><strong>{label}</strong><br />{selection.lat.toFixed(6)}, {selection.lon.toFixed(6)}</Popup>
    </CircleMarker>
  );
}

const trafficColors = { low: '#16a34a', medium: '#eab308', high: '#dc2626' };
function RouteLine({ route, color, dashArray }) {
  const map = useMap();
  const positions = useMemo(() => route?.routeCoordinates?.map(({ latitude, longitude }) => [latitude, longitude]) || [], [route]);
  useEffect(() => { if (positions.length > 1) map.fitBounds(positions, { padding: [36, 36] }); }, [map, route]);
  if (positions.length < 2) return null;
  const segments = route.selectedEdges || [];
  return <>{segments.length === positions.length - 1 ? segments.map((edge, index) => <Polyline key={edge.id} positions={[positions[index], positions[index + 1]]} pathOptions={{ color: trafficColors[edge.congestionLevel] || color, weight: 5, opacity: 0.9, dashArray }} />) : <Polyline positions={positions} pathOptions={{ color, weight: 5, opacity: 0.85, dashArray }} />}</>;
}

export default function PuneMap({ start, destination, selectionMode, onCoordinateSelect, disabled = false, dijkstraRoute, astarRoute, showDijkstra = true, showAstar = true, coverageBounds }) {
  const handleClick = useCallback((coordinate) => {
    if (!disabled) onCoordinateSelect(coordinate);
  }, [disabled, onCoordinateSelect]);

  return (
    <div className="relative h-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm sm:h-[650px]">
      <MapContainer key={coverageBounds?.flat().join(',')} center={PUNE_CENTER} zoom={13} scrollWheelZoom className="h-full w-full" aria-label="Interactive Pune map" maxBounds={coverageBounds} maxBoundsViscosity={1}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onCoordinateSelect={handleClick} bounds={coverageBounds} />
        <CoverageController bounds={coverageBounds} />
        {showDijkstra && dijkstraRoute?.success && <RouteLine route={dijkstraRoute} color="#2563eb" />}
        {showAstar && astarRoute?.success && <RouteLine route={astarRoute} color="#a855f7" dashArray="10 8" />}
        <SelectionMarker selection={start} color="#16a34a" label="Start location" />
        <SelectionMarker selection={destination} color="#dc2626" label="Destination" />
      </MapContainer>
      <div className="pointer-events-none absolute left-3 top-3 z-[1000] rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
        Loaded road area · Click map to set {selectionMode === 'start' ? 'start' : 'destination'}
      </div>
      {(dijkstraRoute?.success || astarRoute?.success) && <div className="pointer-events-none absolute bottom-7 left-3 z-[1000] rounded-lg bg-white/95 px-3 py-2 text-xs text-slate-700 shadow-sm"><p className="font-semibold">Simulated route traffic</p><p className="mt-1"><span className="text-emerald-600">●</span> Low&nbsp;&nbsp;<span className="text-yellow-500">●</span> Medium&nbsp;&nbsp;<span className="text-rose-600">●</span> High</p></div>}
    </div>
  );
}
