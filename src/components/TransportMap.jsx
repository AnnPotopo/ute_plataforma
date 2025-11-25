import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Popup, Polyline, useMapEvents, CircleMarker, Marker } from 'react-leaflet';
import { collection, addDoc, onSnapshot, doc, setDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { Navigation, User, Edit3, Plus, Trash2, MapPin, Locate } from 'lucide-react';
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

const TransportMap = ({ user, isAdmin, isDriver }) => {
    const [routes, setRoutes] = useState([]);
    const [buses, setBuses] = useState([]);
    const [pois, setPois] = useState([]);

    const [editorMode, setEditorMode] = useState(null);
    const [tempPoints, setTempPoints] = useState([]);
    const [poiType, setPoiType] = useState('general');
    const [routeColor, setRouteColor] = useState('#10b981'); // Color por defecto verde

    const [isTracking, setIsTracking] = useState(false);
    const [myStatus, setMyStatus] = useState({ routeId: '', breakdown: false });

    const [map, setMap] = useState(null);
    const SABINAS_CENTER = [26.5096, -100.1769];

    useEffect(() => {
        const unsubRoutes = onSnapshot(collection(db, 'routes'), (s) => setRoutes(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubBuses = onSnapshot(collection(db, 'buses'), (s) => setBuses(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubPois = onSnapshot(collection(db, 'pois'), (s) => setPois(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => { unsubRoutes(); unsubBuses(); unsubPois(); };
    }, []);

    useEffect(() => {
        let watchId;
        if (isDriver && isTracking) {
            if (!navigator.geolocation) return alert("Sin GPS");
            watchId = navigator.geolocation.watchPosition(async (pos) => {
                const { latitude, longitude } = pos.coords;
                const now = new Date();
                const h = now.getHours(), m = now.getMinutes();
                let shouldClear = ((h === 12 || h === 15) && m === 0);

                await setDoc(doc(db, 'buses', user.uid), {
                    lat: latitude, lng: longitude, driverName: user.name,
                    routeId: myStatus.routeId, status: myStatus.breakdown ? 'breakdown' : 'ok',
                    lastUpdate: now,
                    pathHistory: shouldClear ? [] : arrayUnion({ lat: latitude, lng: longitude })
                }, { merge: true });
            }, (err) => console.error(err), { enableHighAccuracy: true });
        }
        return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
    }, [isDriver, isTracking, myStatus]);

    const MapEvents = () => {
        useMapEvents({
            click(e) {
                if (!isAdmin) return;
                if (editorMode === 'route') {
                    setTempPoints(prev => [...prev, [e.latlng.lat, e.latlng.lng]]);
                } else if (editorMode === 'poi') {
                    const name = prompt("Nombre del lugar:");
                    const desc = prompt("Descripción:");
                    if (name) {
                        addDoc(collection(db, 'pois'), { name, description: desc, type: poiType, lat: e.latlng.lat, lng: e.latlng.lng });
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

                    {routes.map(r => <Polyline key={r.id} positions={r.points} pathOptions={{ color: r.color || '#10b981', weight: 6, opacity: 0.7 }} />)}
                    {editorMode === 'route' && <Polyline positions={tempPoints} pathOptions={{ color: routeColor, dashArray: '10,10' }} />}

                    {pois.map(p => (
                        <Marker key={p.id} position={[p.lat, p.lng]} icon={getMarkerIcon(p.type === 'school' ? 'violet' : 'blue')}>
                            <Popup>
                                <div className="text-center">
                                    <strong className="text-emerald-800 uppercase text-xs">{p.type === 'school' ? 'Escuela' : 'Parada'}</strong>
                                    <h3 className="font-bold text-sm">{p.name}</h3>
                                    <p className="text-xs text-gray-500">{p.description}</p>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {buses.map(b => (
                        <React.Fragment key={b.id}>
                            {b.pathHistory && <Polyline positions={b.pathHistory} pathOptions={{ color: b.status === 'breakdown' ? 'red' : '#059669', weight: 3, dashArray: '5,5' }} />}
                            <CircleMarker center={[b.lat, b.lng]} radius={14} pathOptions={{ color: 'white', fillColor: b.status === 'breakdown' ? '#ef4444' : '#10b981', fillOpacity: 1 }}>
                                <Popup><strong>🚌 {b.driverName}</strong><br />{b.status === 'breakdown' ? '⚠️ AVERÍA' : 'EN RUTA'}</Popup>
                            </CircleMarker>
                        </React.Fragment>
                    ))}
                </MapContainer>

                <button onClick={() => map?.flyTo(SABINAS_CENTER, 14)} className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg z-[400] hover:bg-emerald-50 text-emerald-700 transition"><Locate size={24} /></button>

                {editorMode && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 px-6 py-2 rounded-full shadow-xl z-[500] border-2 border-blue-500 animate-pulse text-blue-800 font-bold text-sm">
                        {editorMode === 'route' ? '📍 Clic para trazar ruta' : '📍 Clic para colocar punto'}
                        <button onClick={() => setEditorMode(null)} className="ml-4 text-red-500">Cancelar</button>
                    </div>
                )}
            </div>

            <div className="w-full lg:w-96 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex flex-col gap-6 overflow-y-auto">
                <h3 className="font-extrabold text-xl text-emerald-900 flex items-center gap-2 border-b pb-4"><Navigation className="text-emerald-500" /> Panel Control</h3>

                {isDriver && (
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 space-y-3">
                        <h4 className="font-bold text-sm text-emerald-800 flex items-center gap-2"><User size={14} /> MODO CHOFER</h4>
                        <select className="w-full p-2 rounded border text-sm bg-white" onChange={e => setMyStatus({ ...myStatus, routeId: e.target.value })}>
                            <option value="">Seleccionar Ruta...</option>
                            {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                        <button onClick={() => setIsTracking(!isTracking)} className={`w-full py-2 rounded-lg font-bold text-white text-sm ${isTracking ? 'bg-red-500' : 'bg-emerald-600'}`}>{isTracking ? 'DETENER GPS' : 'INICIAR RUTA'}</button>
                        {isTracking && <button onClick={() => setMyStatus(p => ({ ...p, breakdown: !p.breakdown }))} className="w-full py-2 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold">⚠️ REPORTAR FALLA</button>}
                    </div>
                )}

                {isAdmin && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                        <h4 className="font-bold text-sm text-slate-700 mb-2"><Edit3 size={14} /> EDITOR MAPA</h4>
                        {!editorMode ? (
                            <div className="grid grid-cols-1 gap-2">
                                <div className="flex gap-2">
                                    <select className="text-xs border rounded p-1 flex-1" onChange={e => setRouteColor(e.target.value)}>
                                        <option value="#10b981">Verde</option><option value="#3b82f6">Azul</option><option value="#ef4444">Rojo</option><option value="#eab308">Amarillo</option><option value="#a855f7">Morado</option>
                                    </select>
                                    <button onClick={() => { setEditorMode('route'); setTempPoints([]); }} className="bg-blue-600 text-white py-2 rounded text-xs font-bold px-4">Ruta</button>
                                </div>
                                <div className="flex gap-2">
                                    <select className="text-xs border rounded p-1 flex-1" onChange={e => setPoiType(e.target.value)}><option value="general">Punto</option><option value="school">Escuela</option><option value="stop">Parada</option></select>
                                    <button onClick={() => setEditorMode('poi')} className="bg-indigo-600 text-white px-4 rounded text-xs font-bold">Punto</button>
                                </div>
                            </div>
                        ) : (
                            editorMode === 'route' && <button onClick={saveRoute} className="w-full py-2 bg-green-600 text-white rounded text-xs font-bold">GUARDAR RUTA</button>
                        )}
                        <div className="mt-4 space-y-1 max-h-40 overflow-y-auto">
                            {routes.map(r => (<div key={r.id} className="flex justify-between text-xs p-2 bg-white border rounded"><span style={{ color: r.color }}>● {r.name}</span><button onClick={() => deleteDoc(doc(db, 'routes', r.id))} className="text-red-400"><Trash2 size={10} /></button></div>))}
                            {pois.map(p => (<div key={p.id} className="flex justify-between text-xs p-2 bg-white border rounded"><span className="truncate w-20">{p.name}</span><button onClick={() => deleteDoc(doc(db, 'pois', p.id))} className="text-red-400"><Trash2 size={10} /></button></div>))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default TransportMap;