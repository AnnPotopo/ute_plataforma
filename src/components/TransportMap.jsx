import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Popup, Polyline, useMapEvents, CircleMarker, Marker } from 'react-leaflet';
import { collection, addDoc, onSnapshot, doc, setDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { Navigation, User, Edit3, Plus, Trash2, MapPin, Locate, Wifi, WifiOff } from 'lucide-react';
import { db } from '../firebase';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const getMarkerIcon = (color) => {
    return new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
    });
};

// Helper: Calcular distancia entre dos coordenadas (Haversine Formula)
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const TransportMap = ({ user, isAdmin, isDriver }) => {
    const [routes, setRoutes] = useState([]);
    const [buses, setBuses] = useState([]);
    const [pois, setPois] = useState([]);

    // Admin State
    const [editorMode, setEditorMode] = useState(null);
    const [tempPoints, setTempPoints] = useState([]);
    const [poiType, setPoiType] = useState('general');
    const [targetRouteId, setTargetRouteId] = useState(''); // Para asignar POI a ruta
    const [routeColor, setRouteColor] = useState('#10b981');

    // Driver State
    const [isTracking, setIsTracking] = useState(false);
    const [realTimeMode, setRealTimeMode] = useState(false); // False = Ahorro Datos (30s)
    const [myStatus, setMyStatus] = useState({ routeId: '', breakdown: false });

    // Referencias para lógica GPS (no render)
    const lastUploadTime = useRef(0);
    const lastCheckpointId = useRef(null);

    const [map, setMap] = useState(null);
    const SABINAS_CENTER = [26.5096, -100.1769];

    useEffect(() => {
        const unsubRoutes = onSnapshot(collection(db, 'routes'), (s) => setRoutes(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubBuses = onSnapshot(collection(db, 'buses'), (s) => setBuses(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubPois = onSnapshot(collection(db, 'pois'), (s) => setPois(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => { unsubRoutes(); unsubBuses(); unsubPois(); };
    }, []);

    // --- LÓGICA GPS CHOFER MEJORADA ---
    useEffect(() => {
        let watchId;
        if (isDriver && isTracking) {
            if (!navigator.geolocation) return alert("Tu dispositivo no tiene GPS habilitado");

            watchId = navigator.geolocation.watchPosition(async (pos) => {
                const { latitude, longitude } = pos.coords;
                const now = Date.now();
                const h = new Date().getHours(), m = new Date().getMinutes();

                // 1. Detectar Checkpoints cercanos (Paradas de MI ruta)
                let hitCheckpoint = null;
                // Filtramos solo POIs que sean 'stop' o 'school' y pertenezcan a mi ruta (o sean globales)
                const relevantPois = pois.filter(p =>
                    (p.type === 'stop' || p.type === 'school') &&
                    (p.routeId === myStatus.routeId || !p.routeId) // !p.routeId si es global
                );

                for (const p of relevantPois) {
                    const dist = getDistance(latitude, longitude, p.lat, p.lng);
                    // Si estoy a menos de 50m y NO es el mismo que acabo de marcar (para no spammear)
                    if (dist < 50 && lastCheckpointId.current !== p.id) {
                        hitCheckpoint = p;
                        lastCheckpointId.current = p.id; // Marcamos para no repetir inmediatamente
                        break; // Solo un checkpoint a la vez
                    }
                }

                // 2. Decidir si subimos a Firebase
                // Subimos SI: (Modo RealTime Activo) O (Pasaron 30 seg) O (Llegué a un Checkpoint)
                const timeElapsed = (now - lastUploadTime.current) > 30000; // 30 seg

                if (realTimeMode || timeElapsed || hitCheckpoint) {

                    let shouldClearHistory = ((h === 12 || h === 15) && m === 0); // Limpieza 12pm/3pm

                    const updateData = {
                        lat: latitude,
                        lng: longitude,
                        driverName: user.name,
                        routeId: myStatus.routeId,
                        status: myStatus.breakdown ? 'breakdown' : 'ok',
                        lastUpdate: new Date(), // Timestamp real
                        // Si llegamos a un checkpoint, guardamos cual fue y la hora
                        ...(hitCheckpoint && {
                            lastCheckpoint: hitCheckpoint.name,
                            lastCheckpointTime: new Date()
                        }),
                        pathHistory: shouldClearHistory ? [] : arrayUnion({ lat: latitude, lng: longitude })
                    };

                    await setDoc(doc(db, 'buses', user.uid), updateData, { merge: true });
                    lastUploadTime.current = now;

                    if (hitCheckpoint) {
                        console.log(`📍 Checkpoint alcanzado: ${hitCheckpoint.name}. Notificación lista para WhatsApp.`);
                        // Aquí tu backend (Cloud Functions) leería este cambio para mandar el WhatsApp
                    }
                }

            }, (err) => console.error(err), { enableHighAccuracy: true });
        }
        return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
    }, [isDriver, isTracking, myStatus, realTimeMode, pois, user]);

    // --- EVENTOS ADMIN ---
    const MapEvents = () => {
        useMapEvents({
            click(e) {
                if (!isAdmin) return;
                if (editorMode === 'route') {
                    setTempPoints(prev => [...prev, [e.latlng.lat, e.latlng.lng]]);
                } else if (editorMode === 'poi') {
                    const name = prompt("Nombre de la Parada/Punto:");
                    if (name) {
                        // Guardamos la ID de la ruta a la que pertenece este punto
                        addDoc(collection(db, 'pois'), {
                            name,
                            type: poiType,
                            lat: e.latlng.lat,
                            lng: e.latlng.lng,
                            routeId: targetRouteId || null // Si es null es general
                        });
                        setEditorMode(null);
                    }
                }
            }
        });
        return null;
    };

    const saveRoute = async () => {
        if (tempPoints.length < 2) return alert("Traza al menos 2 puntos");
        const name = prompt("Nombre de la ruta:");
        if (!name) return;
        const firestorePoints = tempPoints.map(p => ({ lat: p[0], lng: p[1] }));
        await addDoc(collection(db, 'routes'), { name, color: routeColor, points: firestorePoints });
        setTempPoints([]); setEditorMode(null);
    };

    return (
        <div className="flex flex-col lg:flex-row h-[600px] gap-6">
            <div className="flex-1 relative rounded-2xl overflow-hidden border border-emerald-100 shadow-2xl z-0">
                <MapContainer center={SABINAS_CENTER} zoom={14} style={{ height: '100%', width: '100%' }} ref={setMap}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OSM' />
                    <MapEvents />

                    {/* RUTAS */}
                    {routes.map(r => <Polyline key={r.id} positions={r.points} pathOptions={{ color: r.color || '#10b981', weight: 6, opacity: 0.6 }} />)}
                    {editorMode === 'route' && <Polyline positions={tempPoints} pathOptions={{ color: routeColor, dashArray: '10,10' }} />}

                    {/* POIS */}
                    {pois.map(p => {
                        // Filtro visual simple: si estoy creando paradas para una ruta, resalto las de esa ruta
                        let opacity = 1;
                        if (isAdmin && targetRouteId && p.routeId && p.routeId !== targetRouteId) opacity = 0.5;

                        return (
                            <Marker key={p.id} position={[p.lat, p.lng]} icon={getMarkerIcon(p.type === 'school' ? 'violet' : 'blue')} opacity={opacity}>
                                <Popup>
                                    <div className="text-center">
                                        <strong className="text-emerald-800 uppercase text-xs">{p.type === 'school' ? 'Escuela' : 'Parada'}</strong>
                                        <h3 className="font-bold text-sm">{p.name}</h3>
                                        {p.routeId && <div className="text-[10px] bg-gray-100 rounded px-1 mt-1">Ruta: {routes.find(r => r.id === p.routeId)?.name || 'Desconocida'}</div>}
                                    </div>
                                </Popup>
                            </Marker>
                        )
                    })}

                    {/* BUSES */}
                    {buses.map(b => (
                        <React.Fragment key={b.id}>
                            {b.pathHistory && <Polyline positions={b.pathHistory} pathOptions={{ color: b.status === 'breakdown' ? 'red' : '#059669', weight: 3, dashArray: '5,5' }} />}
                            <CircleMarker center={[b.lat, b.lng]} radius={14} pathOptions={{ color: 'white', fillColor: b.status === 'breakdown' ? '#ef4444' : '#10b981', fillOpacity: 1 }}>
                                <Popup>
                                    <div className="text-center font-sans">
                                        <div className="font-bold text-lg">🚌 {b.driverName}</div>
                                        <div className="text-xs text-gray-500 mb-1">
                                            {b.lastCheckpoint ? `Última parada: ${b.lastCheckpoint}` : 'En trayecto'}
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded text-white ${b.status === 'breakdown' ? 'bg-red-500' : 'bg-green-500'}`}>
                                            {b.status === 'breakdown' ? 'AVERÍA' : 'OPERATIVO'}
                                        </span>
                                    </div>
                                </Popup>
                            </CircleMarker>
                        </React.Fragment>
                    ))}
                </MapContainer>

                <button onClick={() => map?.flyTo(SABINAS_CENTER, 14)} className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg z-[400] hover:bg-emerald-50 text-emerald-700 transition"><Locate size={24} /></button>

                {/* Aviso Flotante Edición */}
                {editorMode && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 px-6 py-2 rounded-full shadow-xl z-[500] border-2 border-blue-500 animate-pulse text-blue-800 font-bold text-sm flex gap-4 items-center">
                        <span>{editorMode === 'route' ? '📍 Clic para trazar ruta' : `📍 Coloca la parada para la ruta seleccionada`}</span>
                        <button onClick={() => setEditorMode(null)} className="text-red-500 font-bold hover:bg-red-50 px-2 rounded">Cancelar</button>
                    </div>
                )}
            </div>

            {/* PANEL DERECHO */}
            <div className="w-full lg:w-96 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex flex-col gap-6 overflow-y-auto">
                <h3 className="font-extrabold text-xl text-emerald-900 flex items-center gap-2 border-b pb-4"><Navigation className="text-emerald-500" /> Panel Control</h3>

                {/* MODO CHOFER */}
                {isDriver && (
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 space-y-4">
                        <h4 className="font-bold text-sm text-emerald-800 flex items-center gap-2"><User size={14} /> MODO CHOFER</h4>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-emerald-700">1. Selecciona tu Ruta</label>
                            <select className="w-full p-2 rounded border text-sm bg-white" onChange={e => setMyStatus({ ...myStatus, routeId: e.target.value })}>
                                <option value="">-- Seleccionar --</option>
                                {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>

                        <div className="flex items-center justify-between bg-white p-2 rounded border border-emerald-100">
                            <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
                                {realTimeMode ? <Wifi size={14} className="text-green-500" /> : <WifiOff size={14} className="text-orange-500" />}
                                {realTimeMode ? 'Tiempo Real (Alto Consumo)' : 'Ahorro Datos (30s)'}
                            </span>
                            <button onClick={() => setRealTimeMode(!realTimeMode)} className={`text-[10px] px-2 py-1 rounded border ${realTimeMode ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                Cambiar
                            </button>
                        </div>

                        <button onClick={() => setIsTracking(!isTracking)} className={`w-full py-3 rounded-lg font-bold text-white text-sm shadow-md transition ${isTracking ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                            {isTracking ? 'DETENER RUTA' : 'INICIAR RUTA'}
                        </button>

                        {isTracking && (
                            <button onClick={() => setMyStatus(p => ({ ...p, breakdown: !p.breakdown }))} className={`w-full py-2 border-2 rounded-lg text-xs font-bold transition ${myStatus.breakdown ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-red-500 border-red-200'}`}>
                                {myStatus.breakdown ? '✅ MARCAR RESUELTO' : '⚠️ REPORTAR AVERÍA'}
                            </button>
                        )}
                        <p className="text-[10px] text-center text-emerald-600/70 italic">La ubicación se actualiza cada 30s o al llegar a una parada.</p>
                    </div>
                )}

                {/* MODO ADMIN */}
                {isAdmin && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                        <h4 className="font-bold text-sm text-slate-700 mb-2"><Edit3 size={14} /> CONFIGURAR RUTAS</h4>

                        {!editorMode ? (
                            <div className="space-y-4">
                                {/* Crear Ruta */}
                                <div className="flex gap-2 items-center bg-white p-2 rounded border">
                                    <select className="text-xs border rounded p-1 bg-gray-50" onChange={e => setRouteColor(e.target.value)}>
                                        <option value="#10b981">Verde</option><option value="#3b82f6">Azul</option><option value="#ef4444">Rojo</option><option value="#eab308">Amarillo</option>
                                    </select>
                                    <button onClick={() => { setEditorMode('route'); setTempPoints([]); }} className="bg-blue-600 text-white py-1 px-3 rounded text-xs font-bold flex-1">Nueva Ruta</button>
                                </div>

                                {/* Crear Parada */}
                                <div className="bg-white p-2 rounded border space-y-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Agregar Parada a Ruta:</p>
                                    <select className="w-full text-xs border rounded p-1 mb-1" onChange={e => setTargetRouteId(e.target.value)}>
                                        <option value="">-- Parada General (Sin Ruta) --</option>
                                        {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                    <div className="flex gap-2">
                                        <select className="text-xs border rounded p-1 flex-1" onChange={e => setPoiType(e.target.value)}>
                                            <option value="stop">Parada Autobús</option>
                                            <option value="school">Escuela / Base</option>
                                        </select>
                                        <button onClick={() => setEditorMode('poi')} className="bg-indigo-600 text-white px-3 rounded text-xs font-bold"><MapPin size={12} /></button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            editorMode === 'route' && <button onClick={saveRoute} className="w-full py-3 bg-green-600 text-white rounded text-sm font-bold shadow-lg">GUARDAR RUTA TRAZADA</button>
                        )}

                        <div className="mt-4 space-y-1 max-h-40 overflow-y-auto border-t pt-2">
                            {routes.map(r => (
                                <div key={r.id} className="flex justify-between items-center text-xs p-2 bg-white border rounded group">
                                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }}></div> {r.name}</span>
                                    <button onClick={() => deleteDoc(doc(db, 'routes', r.id))} className="text-gray-300 hover:text-red-500"><Trash2 size={12} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default TransportMap;