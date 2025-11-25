import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Popup, Polyline, useMapEvents, CircleMarker, Marker } from 'react-leaflet';
import { collection, addDoc, onSnapshot, doc, setDoc, deleteDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Navigation, User, Edit3, Plus, Trash2, MapPin, AlertTriangle } from 'lucide-react';
import { db } from '../firebase';

// Función simple para calcular distancia en metros entre dos coords
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radio tierra km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c) * 1000; // Metros
};

const TransportMap = ({ user, isAdmin, isDriver }) => {
    const [routes, setRoutes] = useState([]);
    const [buses, setBuses] = useState([]);
    const [checkpoints, setCheckpoints] = useState([]); // Puntos de control del admin

    // Modos Admin
    const [editorMode, setEditorMode] = useState(null); // 'route' | 'checkpoint' | null
    const [tempPoints, setTempPoints] = useState([]);

    // Estado Chofer
    const [isTracking, setIsTracking] = useState(false);
    const [myStatus, setMyStatus] = useState({ routeId: '', breakdown: false });
    const lastCheckpointTime = useRef(0); // Para no spammear logs

    const CENTER = [25.9080, -100.3600]; // Sabinas aprox

    // 1. LEER DATOS (Rutas, Buses, Checkpoints)
    useEffect(() => {
        const unsubRoutes = onSnapshot(collection(db, 'routes'), (s) => setRoutes(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubBuses = onSnapshot(collection(db, 'buses'), (s) => setBuses(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubChecks = onSnapshot(collection(db, 'checkpoints'), (s) => setCheckpoints(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => { unsubRoutes(); unsubBuses(); unsubChecks(); };
    }, []);

    // 2. LÓGICA GPS CHOFER (Con Historial y Limpieza)
    useEffect(() => {
        let watchId;
        if (isDriver && isTracking) {
            if (!navigator.geolocation) return alert("Sin GPS");

            watchId = navigator.geolocation.watchPosition(async (pos) => {
                const { latitude, longitude } = pos.coords;
                const now = new Date();

                // Lógica de Limpieza (12pm y 3pm)
                const currentHour = now.getHours();
                const currentMin = now.getMinutes();
                // Si es 12:00-12:01 o 15:00-15:01, podríamos resetear (lógica simple)
                // Idealmente esto se hace en backend, pero aquí el cliente puede decidir borrar su historial local antes de subirlo
                let shouldClear = false;
                if ((currentHour === 12 || currentHour === 15) && currentMin === 0) shouldClear = true;

                const updateData = {
                    lat: latitude,
                    lng: longitude,
                    driverName: user.name,
                    routeId: myStatus.routeId,
                    status: myStatus.breakdown ? 'breakdown' : 'ok',
                    lastUpdate: now
                };

                // Si debemos limpiar, mandamos path vacío, si no, añadimos punto
                if (shouldClear) {
                    updateData.pathHistory = [];
                } else {
                    updateData.pathHistory = arrayUnion({ lat: latitude, lng: longitude });
                }

                await setDoc(doc(db, 'buses', user.uid), updateData, { merge: true });

                // CHEQUEO DE PUNTOS DE CONTROL (Admin Points)
                checkpoints.forEach(cp => {
                    const dist = getDistanceFromLatLonInKm(latitude, longitude, cp.lat, cp.lng);
                    if (dist < 50) { // Si pasa a menos de 50 metros
                        const timeDiff = now.getTime() - lastCheckpointTime.current;
                        if (timeDiff > 60000) { // Evitar logs duplicados por 1 minuto
                            console.log(`[ALERTA RUTA] El chofer ${user.name} pasó por punto: ${cp.name} a las ${now.toLocaleTimeString()}`);
                            lastCheckpointTime.current = now.getTime();
                            // Opcional: Guardar log en firebase
                        }
                    }
                });

            }, (err) => console.error(err), { enableHighAccuracy: true });
        }
        return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
    }, [isDriver, isTracking, myStatus, checkpoints]);

    // 3. EVENTOS DEL MAPA (Dibujar Ruta o Puntos)
    const MapEvents = () => {
        useMapEvents({
            click(e) {
                if (!isAdmin) return;
                if (editorMode === 'route') {
                    setTempPoints(prev => [...prev, [e.latlng.lat, e.latlng.lng]]);
                } else if (editorMode === 'checkpoint') {
                    const name = prompt("Nombre de este Punto de Control (ej. Parada Centro):");
                    if (name) {
                        addDoc(collection(db, 'checkpoints'), { name, lat: e.latlng.lat, lng: e.latlng.lng });
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
        await addDoc(collection(db, 'routes'), { name, color: '#10b981', points: firestorePoints });
        setTempPoints([]); setEditorMode(null);
    };

    return (
        <div className="flex flex-col lg:flex-row h-[600px] gap-6">
            <div className="flex-1 relative rounded-xl overflow-hidden border-2 border-emerald-100 shadow-lg z-0">
                <MapContainer center={CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OSM' />
                    <MapEvents />

                    {/* Rutas Estáticas (Admin) */}
                    {routes.map(r => <Polyline key={r.id} positions={r.points} pathOptions={{ color: r.color, weight: 5, opacity: 0.6 }} />)}

                    {/* Ruta en Edición */}
                    {editorMode === 'route' && <Polyline positions={tempPoints} pathOptions={{ color: 'black', dashArray: '10,10' }} />}

                    {/* Puntos de Control (Admin) */}
                    {checkpoints.map(cp => (
                        <CircleMarker key={cp.id} center={[cp.lat, cp.lng]} radius={8} pathOptions={{ color: 'blue', fillColor: '#3b82f6', fillOpacity: 0.8 }}>
                            <Popup>📍 Control: {cp.name}</Popup>
                        </CircleMarker>
                    ))}

                    {/* Buses en vivo + Historial */}
                    {buses.map(b => (
                        <React.Fragment key={b.id}>
                            {/* Trayecto recorrido */}
                            {b.pathHistory && <Polyline positions={b.pathHistory} pathOptions={{ color: b.status === 'breakdown' ? 'red' : '#059669', weight: 3, dashArray: '5,5' }} />}
                            {/* Posición actual */}
                            <CircleMarker center={[b.lat, b.lng]} radius={12} pathOptions={{ color: 'white', fillColor: b.status === 'breakdown' ? 'red' : '#059669', fillOpacity: 1 }}>
                                <Popup>
                                    <strong>🚌 {b.driverName}</strong><br />
                                    {b.status === 'breakdown' ? '⚠️ AVERÍA REPORTADA' : 'En ruta normal'}<br />
                                    <span className="text-xs text-gray-500">Actualizado: {b.lastUpdate?.toDate().toLocaleTimeString()}</span>
                                </Popup>
                            </CircleMarker>
                        </React.Fragment>
                    ))}
                </MapContainer>

                {editorMode && (
                    <div className="absolute top-4 right-4 bg-white/90 p-3 rounded shadow z-[500] text-sm border-l-4 border-blue-500">
                        <p className="font-bold text-blue-800 mb-1">Modo Edición Activo</p>
                        <p>{editorMode === 'route' ? 'Haz clic para trazar ruta' : 'Haz clic para poner un punto'}</p>
                        <button onClick={() => setEditorMode(null)} className="mt-2 text-xs text-red-600 underline">Cancelar</button>
                    </div>
                )}
            </div>

            <div className="w-full lg:w-80 bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col gap-6 overflow-y-auto">
                <h3 className="font-bold text-xl flex items-center gap-2 text-emerald-800 border-b pb-4"><Navigation className="text-emerald-500" /> Control</h3>

                {isDriver && (
                    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 space-y-3">
                        <h4 className="font-bold text-sm text-emerald-800"><User size={14} /> PANEL CHOFER</h4>
                        <select className="w-full p-2 rounded border bg-white" onChange={e => setMyStatus({ ...myStatus, routeId: e.target.value })}>
                            <option value="">Selecciona Ruta...</option>
                            {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                        <button onClick={() => setIsTracking(!isTracking)} className={`w-full py-3 rounded font-bold text-white shadow ${isTracking ? 'bg-red-500' : 'bg-emerald-600'}`}>{isTracking ? 'DETENER' : 'INICIAR RUTA'}</button>
                        {isTracking && <button onClick={() => setMyStatus(p => ({ ...p, breakdown: !p.breakdown }))} className={`w-full py-2 border-2 rounded font-bold flex items-center justify-center gap-2 ${myStatus.breakdown ? 'bg-red-100 border-red-500 text-red-800' : 'bg-white'}`}>
                            {myStatus.breakdown ? '🛠 YA ESTÁ REPARADO' : '⚠️ REPORTAR FALLA'}
                        </button>}
                    </div>
                )}

                {isAdmin && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                        <h4 className="font-bold text-sm text-slate-700 mb-3"><Edit3 size={14} /> ADMINISTRAR MAPA</h4>

                        {!editorMode ? (
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => { setEditorMode('route'); setTempPoints([]); }} className="py-2 bg-blue-600 text-white rounded font-bold text-xs flex items-center justify-center gap-1"><Plus size={14} /> Ruta</button>
                                <button onClick={() => setEditorMode('checkpoint')} className="py-2 bg-indigo-600 text-white rounded font-bold text-xs flex items-center justify-center gap-1"><MapPin size={14} /> Punto</button>
                            </div>
                        ) : (
                            editorMode === 'route' && (
                                <div className="flex gap-2">
                                    <button onClick={saveRoute} className="flex-1 py-2 bg-green-600 text-white rounded text-xs font-bold">Guardar Ruta</button>
                                </div>
                            )
                        )}

                        <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Rutas Activas</p>
                            {routes.map(r => (<div key={r.id} className="flex justify-between items-center text-xs bg-white p-2 border rounded"><span>{r.name}</span><button onClick={() => deleteDoc(doc(db, 'routes', r.id))} className="text-red-400"><Trash2 size={12} /></button></div>))}
                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-2">Puntos Control</p>
                            {checkpoints.map(c => (<div key={c.id} className="flex justify-between items-center text-xs bg-white p-2 border rounded"><span>{c.name}</span><button onClick={() => deleteDoc(doc(db, 'checkpoints', c.id))} className="text-red-400"><Trash2 size={12} /></button></div>))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default TransportMap;