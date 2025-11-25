import React, { useState } from 'react';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Edit, Users, Layout, Save, Megaphone, Trash2, Star, Upload, GraduationCap, Plus } from 'lucide-react';
import { db } from '../firebase';

const AdminPanel = ({ posts, usersList, user, careers }) => {
    const [adminTab, setAdminTab] = useState('content');
    const [editingId, setEditingId] = useState(null);

    // Forms
    const [postForm, setPostForm] = useState({ title: '', summary: '', content: '', career: 'General', coverImage: '', extraImages: '', gitUrl: '', important: false });
    const [noticeForm, setNoticeForm] = useState({ text: '', color: 'blue' });
    const [userForm, setUserForm] = useState({ name: '', email: '', role: 'alumno', password: '' });
    const [careerForm, setCareerForm] = useState({ name: '', description: '' });

    // --- HANDLERS ---
    const handleSavePost = async () => {
        if (!postForm.title) return alert('Falta título');
        const payload = { ...postForm, author: user.name, authorRole: user.role, date: new Date().toISOString().split('T')[0], createdAt: Date.now() };
        try {
            if (editingId) await updateDoc(doc(db, 'posts', editingId), payload);
            else await addDoc(collection(db, 'posts'), payload);
            alert('Guardado correctamente');
            setPostForm({ title: '', summary: '', content: '', career: 'General', coverImage: '', extraImages: '', gitUrl: '', important: false });
            setEditingId(null);
        } catch (e) { alert('Error al guardar'); }
    };

    const handleAddCareer = async () => {
        if (!careerForm.name) return;
        await addDoc(collection(db, 'careers'), careerForm);
        setCareerForm({ name: '', description: '' });
    };

    const handleAddNotice = async () => {
        if (!noticeForm.text) return;
        await addDoc(collection(db, 'notices'), { ...noticeForm, createdAt: Date.now() });
        setNoticeForm({ text: '', color: 'blue' });
    };

    const handleManualUser = async () => {
        if (!userForm.name || !userForm.email) return;
        await addDoc(collection(db, 'users'), { ...userForm, createdAt: Date.now() });
        alert("Usuario registrado"); setUserForm({ name: '', email: '', role: 'alumno', password: '' });
    };

    const handleCsvUpload = (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
            const rows = evt.target.result.split('\n').slice(1);
            let count = 0;
            for (let row of rows) {
                const cols = row.split(',');
                if (cols.length >= 5) {
                    const [mat, nom, apP, apM, pass, tel, email] = cols;
                    if (mat) { await addDoc(collection(db, 'users'), { matricula: mat, name: `${nom} ${apP}`, email, role: 'alumno', pass }); count++; }
                }
            }
            alert(`Carga masiva: ${count} usuarios procesados.`);
        };
        reader.readAsText(file);
    };

    const startEdit = (p) => { setPostForm(p); setEditingId(p.id); };
    const deletePost = async (id) => { if (confirm("¿Borrar?")) await deleteDoc(doc(db, 'posts', id)); };
    const toggleImportant = async (p) => await updateDoc(doc(db, 'posts', p.id), { important: !p.important });

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="flex border-b bg-slate-50">
                    {['content', 'users'].map(t => (
                        <button key={t} onClick={() => setAdminTab(t)} className={`flex-1 py-5 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 ${adminTab === t ? 'text-emerald-700 border-b-2 border-emerald-600 bg-white' : 'text-gray-400 hover:text-gray-600'}`}>
                            {t === 'content' ? <><Layout size={18} /> Contenido y Carreras</> : <><Users size={18} /> Usuarios</>}
                        </button>
                    ))}
                </div>

                <div className="p-8 min-h-[600px]">
                    {adminTab === 'content' && (
                        <div className="grid lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-4 space-y-6">
                                {/* Editor Post */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Edit size={18} className="text-emerald-600" /> Editor Noticias</h3>
                                    <div className="space-y-3">
                                        <input className="w-full p-2 border rounded text-sm" placeholder="Título" value={postForm.title} onChange={e => setPostForm({ ...postForm, title: e.target.value })} />
                                        <input className="w-full p-2 border rounded text-sm" placeholder="URL Portada" value={postForm.coverImage} onChange={e => setPostForm({ ...postForm, coverImage: e.target.value })} />
                                        <textarea className="w-full p-2 border rounded text-sm h-20" placeholder="Resumen (tarjeta)..." value={postForm.summary} onChange={e => setPostForm({ ...postForm, summary: e.target.value })} />
                                        <textarea className="w-full p-2 border rounded text-sm h-32" placeholder="Contenido completo..." value={postForm.content} onChange={e => setPostForm({ ...postForm, content: e.target.value })} />
                                        <input className="w-full p-2 border rounded text-sm" placeholder="Link Git/Docs (Opcional)" value={postForm.gitUrl} onChange={e => setPostForm({ ...postForm, gitUrl: e.target.value })} />
                                        <input className="w-full p-2 border rounded text-sm" placeholder="Galería Extra (URLs separadas por comas)" value={postForm.extraImages} onChange={e => setPostForm({ ...postForm, extraImages: e.target.value })} />
                                        <select className="w-full p-2 border rounded text-sm" value={postForm.career} onChange={e => setPostForm({ ...postForm, career: e.target.value })}>
                                            <option value="General">General</option>{careers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>
                                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={postForm.important} onChange={e => setPostForm({ ...postForm, important: e.target.checked })} /> Destacar</label>
                                        <div className="flex gap-2">
                                            <button onClick={handleSavePost} className="flex-1 bg-emerald-600 text-white py-2 rounded font-bold text-sm">{editingId ? 'Actualizar' : 'Publicar'}</button>
                                            {editingId && <button onClick={() => { setEditingId(null); setPostForm({ title: '', summary: '', content: '', career: 'General', coverImage: '', extraImages: '', gitUrl: '', important: false }) }} className="px-3 bg-gray-200 text-sm rounded">X</button>}
                                        </div>
                                    </div>
                                </div>

                                {/* Editor Carreras */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                    <h3 className="font-bold text-sm mb-2 flex gap-2"><GraduationCap size={16} /> Agregar Carrera</h3>
                                    <div className="flex flex-col gap-2">
                                        <input className="p-2 border rounded text-xs" placeholder="Nombre Carrera" value={careerForm.name} onChange={e => setCareerForm({ ...careerForm, name: e.target.value })} />
                                        <input className="p-2 border rounded text-xs" placeholder="Descripción Breve" value={careerForm.description} onChange={e => setCareerForm({ ...careerForm, description: e.target.value })} />
                                        <button onClick={handleAddCareer} className="bg-slate-800 text-white px-3 py-2 rounded text-xs font-bold">Agregar</button>
                                    </div>
                                    <div className="mt-3 space-y-1 max-h-32 overflow-y-auto">
                                        {careers.map(c => (
                                            <div key={c.id} className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded border">
                                                <span>{c.name}</span>
                                                <button onClick={() => deleteDoc(doc(db, 'careers', c.id))} className="text-red-500"><Trash2 size={12} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Avisos */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                    <h3 className="font-bold text-sm mb-2 flex gap-2"><Megaphone size={16} /> Aviso Rápido</h3>
                                    <div className="flex gap-1 mb-2">{['blue', 'green', 'yellow', 'orange', 'red'].map(c => (<button key={c} onClick={() => setNoticeForm({ ...noticeForm, color: c })} className={`w-5 h-5 rounded-full ${noticeForm.color === c ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`} style={{ backgroundColor: c }}></button>))}</div>
                                    <div className="flex gap-2"><input className="flex-1 p-2 border rounded text-xs" placeholder="Mensaje..." value={noticeForm.text} onChange={e => setNoticeForm({ ...noticeForm, text: e.target.value })} /><button onClick={handleAddNotice} className="bg-blue-600 text-white px-3 rounded text-xs font-bold">OK</button></div>
                                </div>
                            </div>

                            {/* Lista de Posts */}
                            <div className="lg:col-span-8 space-y-4">
                                {posts.map(p => (
                                    <div key={p.id} className="bg-white p-3 rounded border flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <img src={p.coverImage || "https://via.placeholder.com/50"} className="w-10 h-10 rounded object-cover" />
                                            <div><div className="font-bold text-sm">{p.title}</div><div className="text-xs text-gray-500">{p.date} • {p.career}</div></div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => toggleImportant(p)} className={`p-1 rounded ${p.important ? 'text-yellow-500' : 'text-gray-300'}`}><Star size={16} /></button>
                                            <button onClick={() => startEdit(p)} className="text-blue-500"><Edit size={16} /></button>
                                            <button onClick={() => deletePost(p.id)} className="text-red-500"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {adminTab === 'users' && (
                        <div className="grid lg:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-xl border">
                                    <h3 className="font-bold mb-4">Nuevo Usuario</h3>
                                    <div className="space-y-2">
                                        <input className="w-full p-2 border rounded text-sm" placeholder="Nombre" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} />
                                        <input className="w-full p-2 border rounded text-sm" placeholder="Email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} />
                                        <div className="flex gap-2">
                                            <input className="flex-1 p-2 border rounded text-sm" placeholder="Clave" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} />
                                            <select className="p-2 border rounded text-sm" value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}><option value="alumno">Alumno</option><option value="profesor">Profesor</option><option value="chofer">Chofer</option><option value="admin">Admin</option></select>
                                        </div>
                                        <button onClick={handleManualUser} className="w-full bg-slate-800 text-white py-2 rounded text-sm">Registrar</button>
                                    </div>
                                </div>
                                <div className="border-2 border-dashed p-6 rounded-xl text-center">
                                    <Upload className="mx-auto text-gray-400 mb-2" />
                                    <p className="text-sm font-bold text-gray-500">Subir CSV Alumnos</p>
                                    <input type="file" onChange={handleCsvUpload} className="block w-full text-xs mt-2 text-gray-500" />
                                </div>
                            </div>
                            <div className="bg-white rounded border h-[500px] overflow-y-auto">
                                {usersList.map(u => (
                                    <div key={u.id} className="flex justify-between p-3 border-b text-sm">
                                        <div><div className="font-bold">{u.name}</div><div className="text-xs text-gray-500">{u.email} • {u.role}</div></div>
                                        <button onClick={async () => await deleteDoc(doc(db, 'users', u.id))} className="text-red-400"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;