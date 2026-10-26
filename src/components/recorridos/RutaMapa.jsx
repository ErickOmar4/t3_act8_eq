import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { DEPOSITO, ESTADOS, OAXACA_CENTER } from '../../config/constants.js';
import { fetchRoute } from '../../services/routingService.js';
import Icon from '../ui/Icon.jsx';

// Pines numerados como HTML (evita depender de las imágenes por defecto de Leaflet).
const makePin = (label, tone) =>
  L.divIcon({
    className: 'map-pin-wrapper',
    html: `<span class="map-pin map-pin-${tone}">${label}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -14],
  });

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) map.fitBounds(points, { padding: [40, 40] });
  }, [map, points]);
  return null;
}

export default function RutaMapa({ paradas }) {
  const [route, setRoute] = useState(null);
  const [routeStatus, setRouteStatus] = useState('loading'); // loading | ok | fallback
  const [simIndex, setSimIndex] = useState(null);
  const [simRunning, setSimRunning] = useState(false);
  const [gps, setGps] = useState(null);
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsError, setGpsError] = useState('');

  const routeKey = paradas.map((p) => p.id).join(',');
  const stopPoints = useMemo(() => [DEPOSITO, ...paradas].map((p) => [p.lat, p.lng]), [routeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pide a OSRM el camino por calles pasando por todas las paradas en orden.
  useEffect(() => {
    if (paradas.length === 0) return undefined;
    let cancelled = false;
    setRouteStatus('loading');
    fetchRoute([DEPOSITO, ...paradas])
      .then((result) => {
        if (cancelled) return;
        setRoute(result);
        setRouteStatus('ok');
      })
      .catch(() => {
        if (cancelled) return;
        setRoute(null);
        setRouteStatus('fallback');
      });
    return () => {
      cancelled = true;
    };
  }, [routeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const routePath = route?.path ?? stopPoints;
  const boundsPoints = routeStatus === 'ok' ? routePath : stopPoints;

  // Simulación sencilla de seguimiento: un punto recorre la ruta trazada.
  useEffect(() => {
    if (!simRunning) return undefined;
    const step = Math.max(1, Math.ceil(routePath.length / 150));
    const timer = setInterval(() => {
      setSimIndex((prev) => Math.min((prev ?? 0) + step, routePath.length - 1));
    }, 120);
    return () => clearInterval(timer);
  }, [simRunning, routePath]);

  useEffect(() => {
    if (simRunning && simIndex !== null && simIndex >= routePath.length - 1) setSimRunning(false);
  }, [simIndex, simRunning, routePath]);

  // Ubicación real del dispositivo con la API de geolocalización del navegador.
  useEffect(() => {
    if (!gpsActive) return undefined;
    if (!('geolocation' in navigator)) {
      setGpsError('Este navegador no permite obtener la ubicación.');
      setGpsActive(false);
      return undefined;
    }
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setGps({ lat: position.coords.latitude, lng: position.coords.longitude });
        setGpsError('');
      },
      (err) => {
        setGpsError(err.code === 1 ? 'Permiso de ubicación denegado.' : 'No se pudo obtener la ubicación.');
        setGpsActive(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [gpsActive]);

  const startSimulation = () => {
    setSimIndex(0);
    setSimRunning(true);
  };

  if (paradas.length === 0) {
    return <p className="map-empty">Este recorrido todavía no tiene paradas. Agrega pedidos para ver su ruta en el mapa.</p>;
  }

  return (
    <div className="route-map">
      <div className="map-toolbar">
        {routeStatus === 'loading' && <span className="text-muted">Calculando ruta por calles…</span>}
        {routeStatus === 'ok' && (
          <span><strong>{route.distanceKm.toFixed(1)} km</strong> · aprox. <strong>{Math.round(route.durationMin)} min</strong> de manejo, sin contar paradas</span>
        )}
        {routeStatus === 'fallback' && (
          <span className="text-warning">No se pudo calcular la ruta por calles; se muestran las paradas unidas en línea recta.</span>
        )}
        <div className="map-toolbar-actions">
          <button type="button" className={`btn btn-sm ${gpsActive ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setGpsActive((v) => !v)}>
            <Icon name="navigation" size={14} /> {gpsActive ? 'Dejar de ubicarme' : 'Mi ubicación en vivo'}
          </button>
          {simRunning ? (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSimRunning(false)}><Icon name="stop" size={14} /> Detener</button>
          ) : (
            <button type="button" className="btn btn-secondary btn-sm" onClick={startSimulation} disabled={routeStatus === 'loading'}><Icon name="play" size={14} /> Simular seguimiento</button>
          )}
        </div>
      </div>
      {gpsError && <p className="text-warning">{gpsError}</p>}
      <MapContainer center={OAXACA_CENTER} zoom={13} scrollWheelZoom className="map-canvas">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds points={boundsPoints} />
        <Polyline positions={routePath} pathOptions={{ color: '#1F6F5C', weight: 5, opacity: 0.85, dashArray: routeStatus === 'fallback' ? '8 8' : undefined }} />
        <Marker position={[DEPOSITO.lat, DEPOSITO.lng]} icon={makePin('S', 'depot')}>
          <Popup><strong>{DEPOSITO.nombre}</strong><br />Salida del recorrido</Popup>
        </Marker>
        {paradas.map((parada, index) => (
          <Marker key={parada.id} position={[parada.lat, parada.lng]} icon={makePin(index + 1, ESTADOS[parada.estado]?.tone ?? 'neutral')}>
            <Popup>
              <strong>Parada {index + 1}: {parada.cliente}</strong><br />
              {parada.direccion}, {parada.zona}<br />
              Estado: {ESTADOS[parada.estado]?.label}
            </Popup>
          </Marker>
        ))}
        {simIndex !== null && (
          <CircleMarker center={routePath[simIndex]} radius={9} pathOptions={{ color: '#fff', weight: 3, fillColor: '#1E2A47', fillOpacity: 1 }} />
        )}
        {gps && (
          <CircleMarker center={[gps.lat, gps.lng]} radius={10} pathOptions={{ color: '#fff', weight: 3, fillColor: '#2f6bd1', fillOpacity: 1 }}>
            <Popup>Tu ubicación actual</Popup>
          </CircleMarker>
        )}
      </MapContainer>
      <ul className="map-legend">
        <li><span className="map-pin map-pin-depot small">S</span> Salida</li>
        <li><span className="map-pin map-pin-warning small">1</span> Pendiente</li>
        <li><span className="map-pin map-pin-info small">2</span> En camino</li>
        <li><span className="map-pin map-pin-success small">3</span> Entregado</li>
        <li><span className="map-pin map-pin-danger small">4</span> No entregado</li>
      </ul>
    </div>
  );
}
