import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Popup, Polyline, useMapEvents, CircleMarker } from 'react-leaflet';
import { collection, addDoc, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Navigation, User, Edit3, Plus, Trash2 } from 'lucide-react';
import { db } from '../firebase'; // Importamos la conexión

const TransportMap = ({ user, isAdmin, isDriver }) => {
    const [routes, setRoutes] = useState([]);
    const [buses, setBuses] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tempPoints, setTempPoints] = useState([]);
    const [isTracking, setIsTracking] = useState(false);
    const [myStatus, setMyStatus] = useState({ routeId: '', breakdown: false });

    const CENTER = [25.9080, -100.3600];

    // Leer datos
    useEffect(() => {
        const unsubRoutes = onSnapshot(collection(db, 'routes'), (s) => setRoutes(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubBuses = onSnapshot(collection(db, 'buses'), (s) => setBuses(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => { unsubRoutes(); unsubBuses(); };
    }, []);

    // Lógica GPS Chofer
    useEffect(() => {
        let watchId;
        if (isDriver && isTracking) {
            if (!navigator.geolocation) return alert("Sin GPS");
            watchId = navigator.geolocation.watchPosition(async (pos) => {
                const { latitude, longitude } = pos.coords;
                await setDoc(doc(db, 'buses', user.uid), {
                    lat: latitude, lng: longitude, driverName: user.name,
                    routeId: myStatus.routeId, status: myStatus.breakdown ? 'breakdown' : 'ok',
                    lastUpdate: new Date()
                }, { merge: true });
            }, (err) => console.error(err), { enableHighAccuracy: true });
        }
        return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
    }, [isDriver, isTracking, myStatus, user]);

    // Eventos del Mapa (Dibujar)
    const MapEvents = () => {
        useMapEvents({
            click(e) {
                if (isAdmin && isDrawing) setTempPoints(prev => [...prev, [e.latlng.lat, e.latlng.lng]]);
            }
        });
        return null;
    };

    const saveRoute = async () => {
        if (tempPoints.length < 2) return alert("Traza al menos 2 puntos");
        const name = prompt("Nombre de la ruta:");
        if (!name) return;
        // Convertir arrays a objetos para Firestore
        const firestorePoints = tempPoints.map(p => ({ lat: p[0], lng: p[1] }));
        await addDoc(collection(db, 'routes'), { name, color: '#10b981', points: firestorePoints });
        setTempPoints([]); setIsDrawing(false);
    };

    return (
        <div className="flex flex-col lg:flex-row h-[600px] gap-6">
            <div className="flex-1 relative rounded-xl overflow-hidden border-2 border-emerald-100 shadow-lg z-0">
                <MapContainer center={CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OSM' />
                    <MapEvents />
                    {routes.map(r => <Polyline key={r.id} positions={r.points} pathOptions={{ color: r.color, weight: 5 }} />)}
                    {isDrawing && <Polyline positions={tempPoints} pathOptions={{ color: 'black', dashArray: '10,10' }} />}
                    {buses.map(b => (
                        <CircleMarker key={b.id} center={[b.lat, b.lng]} radius={10} pathOptions={{ color: 'white', fillColor: b.status === 'breakdown' ? 'red' : '#059669', fillOpacity: 1 }}>
                            <Popup><strong>{b.driverName}</strong><br />{b.status === 'breakdown' ? '⚠️ AVERÍA' : 'En ruta'}</Popup>
                        </CircleMarker>
                    ))}
                </MapContainer>
                {isDrawing && <div className="absolute top-4 right-4 bg-white/90 p-2 rounded z-[500] text-xs font-bold shadow">Modo Edición</div>}
            </div>

            <div className="w-full lg:w-80 bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col gap-6 overflow-y-auto">
                <h3 className="font-bold text-xl flex items-center gap-2 text-emerald-800 border-b pb-4"><Navigation className="text-emerald-500" /> Centro de Control</h3>

                {isDriver && (
                    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 space-y-3">
                        <h4 className="font-bold text-sm text-emerald-800"><User size={14} /> PANEL CHOFER</h4>
                        <select className="w-full p-2 rounded border bg-white" onChange={e => setMyStatus({ ...myStatus, routeId: e.target.value })}>
                            <option value="">Selecciona Ruta...</option>
                            {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                        <button onClick={() => setIsTracking(!isTracking)} className={`w-full py-3 rounded font-bold text-white shadow ${isTracking ? 'bg-red-500' : 'bg-emerald-600'}`}>{isTracking ? 'DETENER' : 'INICIAR'}</button>
                        {isTracking && <button onClick={() => setMyStatus(p => ({ ...p, breakdown: !p.breakdown }))} className="w-full py-2 border-2 rounded font-bold bg-white">⚠️ Reportar Avería</button>}
                    </div>
                )}

                {isAdmin && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="font-bold text-sm text-gray-600 mb-3"><Edit3 size={14} /> GESTIÓN RUTAS</h4>
                        {!isDrawing ? (
                            <button onClick={() => { setIsDrawing(true); setTempPoints([]); }} className="w-full py-2 bg-blue-600 text-white rounded font-bold"><Plus size={16} /> Nueva Ruta</button>
                        ) : (
                            <div className="flex gap-2"><button onClick={saveRoute} className="flex-1 py-2 bg-green-600 text-white rounded">Guardar</button><button onClick={() => setIsDrawing(false)} className="flex-1 py-2 bg-gray-400 text-white rounded">X</button></div>
                        )}
                        <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                            {routes.map(r => (<div key={r.id} className="flex justify-between p-2 bg-white border rounded"><span>{r.name}</span><button onClick={() => deleteDoc(doc(db, 'routes', r.id))} className="text-red-400"><Trash2 size={12} /></button></div>))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default TransportMap;