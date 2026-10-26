import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { fetchPedidosFromApi, syncEstadoRequest } from '../services/pedidosService.js';
import { createWorkspaceRequest, readWorkspaceRequest, saveWorkspaceRequest } from '../services/storageService.js';
import { loadJson, saveJson } from '../utils/storage.js';
import { todayISO } from '../utils/format.js';
import { useToast } from './ToastContext.jsx';

const LogisticaContext = createContext(null);

const CACHE_KEY = 'rutaoax_workspace_cache';
const WORKSPACE_ID_KEY = 'rutaoax_workspace_id';
const LUGARES_KEY = 'rutaoax_lugares';

const SEED_VEHICULOS = [
  { id: 'v1', tipo: 'Combi', placa: 'OAX-214-A', repartidor: 'Carlos Ramírez', telefono: '9510000001', capacidad: 25 },
  { id: 'v2', tipo: 'Motocicleta', placa: 'OAX-88-M', repartidor: 'Lucía Martínez', telefono: '9510000002', capacidad: 8 },
  { id: 'v3', tipo: 'Camioneta', placa: 'OAX-472-B', repartidor: 'Jorge Sánchez', telefono: '9510000003', capacidad: 15 },
];
const seedRecorridos = () => [{ id: 'r1', vehiculoId: 'v1', fecha: todayISO(), pedidoIds: [1, 2, 3, 4, 5, 6] }];

function readWorkspaceId() {
  try {
    return localStorage.getItem(WORKSPACE_ID_KEY) || import.meta.env.VITE_JSONBLOB_ID || '';
  } catch {
    return '';
  }
}

/**
 * Estado central del negocio:
 *  - pedidos: vienen de DummyJSON (+ calles reales de Nominatim) y se combinan con los cambios guardados.
 *  - vehiculos y recorridos: no existen en ninguna API de pedidos, así que se guardan en un documento
 *    JSON en línea (JSONBlob). Si no hay documento conectado, se guardan solo en este navegador.
 * Siempre se deja una copia en localStorage como respaldo sin conexión.
 */
export function LogisticaProvider({ children }) {
  const { notify } = useToast();
  const [pedidos, setPedidos] = useState([]);
  const [deletedIds, setDeletedIds] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [recorridos, setRecorridos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [workspaceId, setWorkspaceId] = useState(readWorkspaceId);
  const [sync, setSync] = useState({ status: 'local', message: '' }); // local | saving | saved | error

  const hydrated = useRef(false); // ya se cargó todo: ahora sí se puede guardar
  const remoteWritable = useRef(false); // la lectura en línea salió bien: es seguro escribir
  const pedidosLoaded = useRef(false); // los pedidos se obtuvieron de la API
  const pedidosCache = useRef({ items: [], deletedIds: [] });

  // ---------- Carga inicial: documento en línea + pedidos de la API ----------
  const loadAll = useCallback(async (wsId) => {
    setLoading(true);
    setError('');
    setNotice('');
    hydrated.current = false;
    remoteWritable.current = false;

    // 1) Vehículos, recorridos y cambios a pedidos: JSONBlob (o el respaldo local)
    let workspace = loadJson(CACHE_KEY, null);
    if (wsId) {
      try {
        workspace = await readWorkspaceRequest(wsId);
        remoteWritable.current = true;
        setSync({ status: 'saved', message: 'Datos sincronizados con JSONBlob.' });
      } catch (err) {
        setSync({
          status: 'error',
          message: `No se pudo leer JSONBlob (${err.message}). Se usan los datos de este navegador y no se guardará en línea hasta reconectar.`,
        });
      }
    } else {
      setSync({ status: 'local', message: 'Los datos solo se guardan en este navegador. Conecta JSONBlob para guardarlos en línea.' });
    }
    const ws = workspace && typeof workspace === 'object' ? workspace : {};
    const cache = ws.pedidos ?? { items: [], deletedIds: [] };
    const cachedItems = cache.items ?? [];
    const cachedById = new Map(cachedItems.map((p) => [p.id, p]));
    const deleted = new Set(cache.deletedIds ?? []);
    pedidosCache.current = { items: cachedItems, deletedIds: [...deleted] };

    // 2) Pedidos desde la API, combinados con lo guardado
    let nextPedidos = [];
    pedidosLoaded.current = false;
    try {
      const { pedidos: apiItems, ubicacionFuente } = await fetchPedidosFromApi();
      const locales = cachedItems.filter((p) => p.local);
      const deLaApi = apiItems.filter((p) => !deleted.has(p.id)).map((p) => cachedById.get(p.id) ?? p);
      nextPedidos = [...locales, ...deLaApi];
      pedidosLoaded.current = true;
      if (ubicacionFuente === 'respaldo') {
        setNotice('No se pudo consultar Nominatim (OpenStreetMap): las direcciones de muestra usan datos de respaldo.');
      }
    } catch (err) {
      if (cachedItems.length > 0) {
        nextPedidos = cachedItems;
        pedidosLoaded.current = true;
        setError(`No se pudo actualizar desde la API; se muestran los últimos datos guardados. (${err.message})`);
      } else {
        setError(err.message);
      }
    }

    setVehiculos(ws.vehiculos ?? SEED_VEHICULOS);
    setRecorridos(ws.recorridos ?? seedRecorridos());
    setPedidos(nextPedidos);
    setDeletedIds([...deleted]);
    hydrated.current = true;
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll(workspaceId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Guardado automático (respaldo local + JSONBlob) ----------
  const buildData = () => ({
    version: 1,
    vehiculos,
    recorridos,
    pedidos: pedidosLoaded.current ? { items: pedidos, deletedIds } : pedidosCache.current,
  });

  useEffect(() => {
    if (!hydrated.current) return undefined;
    const data = buildData();
    saveJson(CACHE_KEY, data);
    if (!workspaceId || !remoteWritable.current) return undefined;

    setSync((current) => ({ ...current, status: 'saving' }));
    const timer = setTimeout(async () => {
      try {
        await saveWorkspaceRequest(workspaceId, data);
        setSync({ status: 'saved', message: 'Cambios guardados en JSONBlob.' });
      } catch (err) {
        setSync({ status: 'error', message: `No se pudo guardar en JSONBlob: ${err.message}` });
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [pedidos, deletedIds, vehiculos, recorridos, workspaceId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Conexión con JSONBlob ----------
  const createWorkspace = async () => {
    const id = await createWorkspaceRequest(buildData());
    localStorage.setItem(WORKSPACE_ID_KEY, id);
    remoteWritable.current = true;
    setWorkspaceId(id);
    setSync({ status: 'saved', message: 'Espacio creado. Comparte este ID con tu compañero de equipo.' });
    return id;
  };

  const connectWorkspace = async (rawId) => {
    const id = rawId.trim().split('/').pop();
    if (!id) return;
    localStorage.setItem(WORKSPACE_ID_KEY, id);
    setWorkspaceId(id);
    await loadAll(id);
  };

  const disconnectWorkspace = () => {
    localStorage.removeItem(WORKSPACE_ID_KEY);
    remoteWritable.current = false;
    setWorkspaceId('');
    setSync({ status: 'local', message: 'Los datos solo se guardan en este navegador. Conecta JSONBlob para guardarlos en línea.' });
  };

  // ---------- Pedidos ----------
  const addPedido = (data) => {
    const id = Math.max(1000, ...pedidos.map((p) => p.id)) + 1;
    const pedido = { notas: '', ...data, id, local: true, estado: 'pendiente' };
    setPedidos((current) => [pedido, ...current]);
    return pedido;
  };

  const updatePedido = (id, changes) =>
    setPedidos((current) => current.map((p) => (p.id === id ? { ...p, ...changes } : p)));

  // Cambia el estado en la app y lo envía a la API (PATCH /todos/{id}).
  const setEstadoPedido = async (id, estado) => {
    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido) return;
    updatePedido(id, { estado });
    try {
      await syncEstadoRequest(pedido, estado);
    } catch (err) {
      notify(`El estado cambió en la app, pero la API no respondió: ${err.message}`, 'info');
    }
  };

  const removePedido = (id) => {
    setPedidos((current) => current.filter((p) => p.id !== id));
    setDeletedIds((current) => (current.includes(id) ? current : [...current, id]));
    setRecorridos((current) => current.map((r) => ({ ...r, pedidoIds: r.pedidoIds.filter((pid) => pid !== id) })));
  };

  // ---------- Vehículos ----------
  const addVehiculo = (data) => {
    const vehiculo = { ...data, id: `v${Date.now()}` };
    setVehiculos((current) => [...current, vehiculo]);
    return vehiculo;
  };
  const updateVehiculo = (id, changes) =>
    setVehiculos((current) => current.map((v) => (v.id === id ? { ...v, ...changes } : v)));
  const removeVehiculo = (id) => {
    setVehiculos((current) => current.filter((v) => v.id !== id));
    setRecorridos((current) => current.filter((r) => r.vehiculoId !== id));
  };

  // ---------- Recorridos ----------
  // Devuelve { ok, recorrido } o { ok: false, error }.
  const addRecorrido = ({ vehiculoId, fecha, pedidoIds }) => {
    if (recorridos.some((r) => r.vehiculoId === vehiculoId && r.fecha === fecha)) {
      return { ok: false, error: 'Ese vehículo ya tiene un recorrido para esa fecha. Elige otra fecha u otro vehículo.' };
    }
    const recorrido = { id: `r${Date.now()}`, vehiculoId, fecha, pedidoIds };
    setRecorridos((current) => [...current, recorrido]);
    return { ok: true, recorrido };
  };
  const updateRecorrido = (id, changes) =>
    setRecorridos((current) => current.map((r) => (r.id === id ? { ...r, ...changes } : r)));
  const removeRecorrido = (id) => setRecorridos((current) => current.filter((r) => r.id !== id));

  // ---------- Datos derivados ----------
  const pedidosById = useMemo(() => new Map(pedidos.map((p) => [p.id, p])), [pedidos]);
  const vehiculosById = useMemo(() => new Map(vehiculos.map((v) => [v.id, v])), [vehiculos]);
  // pedidoId -> recorrido al que está asignado
  const asignaciones = useMemo(() => {
    const map = new Map();
    recorridos.forEach((r) => r.pedidoIds.forEach((pid) => map.set(pid, r)));
    return map;
  }, [recorridos]);

  // Borra la copia local, desconecta JSONBlob y vuelve a empezar con los datos de ejemplo.
  const resetDemoData = () => {
    [CACHE_KEY, WORKSPACE_ID_KEY, LUGARES_KEY].forEach((key) => localStorage.removeItem(key));
    window.location.reload();
  };

  const value = {
    pedidos, loading, error, notice, loadPedidos: () => loadAll(workspaceId),
    addPedido, updatePedido, setEstadoPedido, removePedido,
    vehiculos, addVehiculo, updateVehiculo, removeVehiculo,
    recorridos, addRecorrido, updateRecorrido, removeRecorrido,
    pedidosById, vehiculosById, asignaciones, resetDemoData,
    sync, workspaceId, createWorkspace, connectWorkspace, disconnectWorkspace,
  };
  return <LogisticaContext.Provider value={value}>{children}</LogisticaContext.Provider>;
}

export const useLogistica = () => useContext(LogisticaContext);
