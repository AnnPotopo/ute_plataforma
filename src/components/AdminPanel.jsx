import React, { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, where } from 'firebase/firestore';
import { Edit, Users, Layout, Save, Megaphone, Trash2, Star, Upload, GraduationCap, Plus, FolderGit2, CheckCircle, XCircle, AlertCircle, X, Briefcase } from 'lucide-react';
import { db } from '../firebase';

const AdminPanel = ({ posts, usersList, user, careers }) => {
    const [adminTab, setAdminTab] = useState(user.role === 'profesor' ? 'repos' : 'content');
    const [editingId, setEditingId] = useState(null);

    // --- ESTADO REPOSITORIOS (NUEVO Y COMPLEJO) ---
    const [repoPosts, setRepoPosts] = useState([]);
    const [repoForm, setRepoForm] = useState({ title: '', objective: '', problems: '', improvements: '', gitUrl: '' });

    // Sub-estado para agregar contribuciones individuales (una por carrera)
    const [currentContrib, setCurrentContrib] = useState({ career: '', group: '', supervisor: '', tasks: '', comments: '', docUrl: '' });
    const [contributionsList, setContributionsList] = useState([]);

    // --- ESTADOS GENERALES ---
    const [postForm, setPostForm] = useState({ title: '', summary: '', content: '', career: 'General', coverImage: '', extraImages: '', gitUrl: '', important: false });
    const [noticeForm, setNoticeForm] = useState({ text: '', color: 'blue' });
    const [userForm, setUserForm] = useState({ name: '', email: '', role: 'alumno', password: '' });
    const [careerForm, setCareerForm] = useState({ name: '', description: '' });

    // Cargar Repositorios (Todos si es Admin, o filtro visual luego)
    useEffect(() => {
        const q = query(collection(db, 'repo_posts'));
        const unsub = onSnapshot(q, (s) => setRepoPosts(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt)));
        return () => unsub();
    }, []);

    // --- HANDLERS REPOSITORIOS ---
    const addContribution = () => {
        if (!currentContrib.career || !currentContrib.tasks) return alert("Selecciona carrera y describe las tareas.");
        setContributionsList([...contributionsList, currentContrib]);
        setCurrentContrib({ career: '', group: '', supervisor: '', tasks: '', comments: '', docUrl: '' }); // Reset form parcial
    };

    const removeContribution = (index) => {
        setContributionsList(contributionsList.filter((_, i) => i !== index));
    };

    const handleSaveRepo = async () => {
        if (!repoForm.title || contributionsList.length === 0) return alert("Falta título o al menos una contribución por carrera.");

        const status = user.role === 'admin' ? 'approved' : 'pending';

        await addDoc(collection(db, 'repo_posts'), {
            ...repoForm,
            contributions: contributionsList, // Guardamos el array complejo
            author: user.name,
            authorId: user.uid || 'unknown',
            status,
            createdAt: Date.now()
        });

        alert(status === 'approved' ? "Proyecto publicado" : "Enviado a revisión");
        // Reset Total
        setRepoForm({ title: '', objective: '', problems: '', improvements: '', gitUrl: '' });
        setContributionsList([]);
    };

    const approveRepo = async (id) => await updateDoc(doc(db, 'repo_posts', id), { status: 'approved' });
    const deleteRepo = async (id) => { if (confirm("¿Borrar este proyecto?")) await deleteDoc(doc(db, 'repo_posts', id)); };

    // --- HANDLERS POSTS & GENERAL ---
    const handleSavePost = async () => {
        if (!postForm.title) return alert('Falta título');
        const payload = { ...postForm, author: user.name, authorRole: user.role, date: new Date().toISOString().split('T')[0], createdAt: Date.now() };
        try {
            if (editingId) await updateDoc(doc(db, 'posts', editingId), payload);
            else await addDoc(collection(db, 'posts'), payload);
            alert('Guardado'); setPostForm({ title: '', summary: '', content: '', career: 'General', coverImage: '', extraImages: '', gitUrl: '', important: false }); setEditingId(null);
        } catch (e) { alert('Error'); }
    };
    const handleAddCareer = async () => { if (careerForm.name) { await addDoc(collection(db, 'careers'), careerForm); setCareerForm({ name: '', description: '' }); } };
    const handleAddNotice = async () => { if (noticeForm.text) { await addDoc(collection(db, 'notices'), { ...noticeForm, createdAt: Date.now() }); setNoticeForm({ text: '', color: 'blue' }); } };
    const handleManualUser = async () => { if (userForm.name) { await addDoc(collection(db, 'users'), { ...userForm, createdAt: Date.now() }); alert("Usuario creado"); setUserForm({ name: '', email: '', role: 'alumno', password: '' }); } };
    const handleCsvUpload = (e) => { /* Lógica existente */ };
    const startEdit = (p) => { setPostForm(p); setEditingId(p.id); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    const deletePost = async (id) => { if (confirm("¿Borrar?")) await deleteDoc(doc(db, 'posts', id)); };
    const toggleImportant = async (p) => await updateDoc(doc(db, 'posts', p.id), { important: !p.important });

    const pendingRepos = repoPosts.filter(r => r.status === 'pending');
    const approvedRepos = repoPosts.filter(r => r.status === 'approved');

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="flex border-b bg-slate-50">
                    {user.role === 'admin' && (
                        <>
                            <button onClick={() => setAdminTab('content')} className={`flex-1 py-4 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 ${adminTab === 'content' ? 'text-emerald-700 border-b-2 border-emerald-600 bg-white' : 'text-gray-400'}`}><Layout size={18} /> Web</button>
                            <button onClick={() => setAdminTab('users')} className={`flex-1 py-4 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 ${adminTab === 'users' ? 'text-emerald-700 border-b-2 border-emerald-600 bg-white' : 'text-gray-400'}`}><Users size={18} /> Usuarios</button>
                        </>
                    )}
                    <button onClick={() => setAdminTab('repos')} className={`flex-1 py-4 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 ${adminTab === 'repos' ? 'text-emerald-700 border-b-2 border-emerald-600 bg-white' : 'text-gray-400'}`}>
                        <FolderGit2 size={18} /> Repositorios {user.role === 'admin' && pendingRepos.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 rounded-full">{pendingRepos.length}</span>}
                    </button>
                </div>

                <div className="p-8 min-h-[600px]">
                    {/* VISTA: REPOSITORIOS */}
                    {adminTab === 'repos' && (
                        <div className="grid lg:grid-cols-12 gap-8">
                            {/* Formulario Izquierda */}
                            <div className="lg:col-span-5">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-6">
                                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Upload size={18} className="text-blue-600" /> Nuevo Proyecto Multidisciplinario</h3>

                                    {/* Datos Generales */}
                                    <div className="space-y-3 mb-6 pb-6 border-b border-gray-100">
                                        <input className="w-full p-2 border rounded text-sm font-bold" placeholder="Título del Proyecto" value={repoForm.title} onChange={e => setRepoForm({ ...repoForm, title: e.target.value })} />
                                        <textarea className="w-full p-2 border rounded text-sm h-20" placeholder="Objetivo General..." value={repoForm.objective} onChange={e => setRepoForm({ ...repoForm, objective: e.target.value })} />
                                        <textarea className="w-full p-2 border rounded text-sm h-16" placeholder="Problemas Enfrentados..." value={repoForm.problems} onChange={e => setRepoForm({ ...repoForm, problems: e.target.value })} />
                                        <textarea className="w-full p-2 border rounded text-sm h-16" placeholder="Mejoras Futuras..." value={repoForm.improvements} onChange={e => setRepoForm({ ...repoForm, improvements: e.target.value })} />
                                        <input className="w-full p-2 border rounded text-sm" placeholder="URL Repositorio Git (General)" value={repoForm.gitUrl} onChange={e => setRepoForm({ ...repoForm, gitUrl: e.target.value })} />
                                    </div>

                                    {/* Agregar Contribuciones */}
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><Briefcase size={14} /> Agregar Carrera Involucrada</h4>
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <select className="w-1/2 p-2 border rounded text-xs" value={currentContrib.career} onChange={e => setCurrentContrib({ ...currentContrib, career: e.target.value })}>
                                                    <option value="">Seleccionar Carrera</option>{careers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                                </select>
                                                <input className="w-1/2 p-2 border rounded text-xs" placeholder="Grupo (ej. 5A)" value={currentContrib.group} onChange={e => setCurrentContrib({ ...currentContrib, group: e.target.value })} />
                                            </div>
                                            <input className="w-full p-2 border rounded text-xs" placeholder="Responsable / Profesor" value={currentContrib.supervisor} onChange={e => setCurrentContrib({ ...currentContrib, supervisor: e.target.value })} />
                                            <textarea className="w-full p-2 border rounded text-xs h-16" placeholder="Tareas realizadas por esta área..." value={currentContrib.tasks} onChange={e => setCurrentContrib({ ...currentContrib, tasks: e.target.value })} />
                                            <input className="w-full p-2 border rounded text-xs" placeholder="Link Documentación (PDF/Drive) de esta carrera" value={currentContrib.docUrl} onChange={e => setCurrentContrib({ ...currentContrib, docUrl: e.target.value })} />
                                            <input className="w-full p-2 border rounded text-xs" placeholder="Comentarios adicionales" value={currentContrib.comments} onChange={e => setCurrentContrib({ ...currentContrib, comments: e.target.value })} />
                                            <button onClick={addContribution} className="w-full bg-slate-800 text-white py-2 rounded text-xs font-bold hover:bg-slate-700">+ Agregar esta contribución al proyecto</button>
                                        </div>
                                    </div>

                                    {/* Lista Preliminar */}
                                    {contributionsList.length > 0 && (
                                        <div className="mt-4 space-y-2">
                                            <p className="text-xs font-bold text-gray-400">Carreras añadidas:</p>
                                            {contributionsList.map((c, i) => (
                                                <div key={i} className="flex justify-between items-center bg-blue-50 p-2 rounded text-xs border border-blue-100">
                                                    <span className="font-bold text-blue-800">{c.career} <span className="font-normal text-gray-500">({c.group})</span></span>
                                                    <button onClick={() => removeContribution(i)} className="text-red-500 hover:bg-red-50 p-1 rounded"><X size={12} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <button onClick={handleSaveRepo} className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-blue-700 shadow-lg">
                                        {user.role === 'admin' ? 'Publicar Proyecto Final' : 'Enviar a Revisión'}
                                    </button>
                                </div>
                            </div>

                            {/* Lista Derecha */}
                            <div className="lg:col-span-7 space-y-6">
                                {/* PENDIENTES (Solo Admin) */}
                                {user.role === 'admin' && pendingRepos.length > 0 && (
                                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
                                        <h4 className="font-bold text-orange-800 mb-4 flex items-center gap-2"><AlertCircle size={18} /> Pendientes de Aprobación</h4>
                                        <div className="space-y-3">
                                            {pendingRepos.map(r => (
                                                <div key={r.id} className="bg-white p-4 rounded-lg border border-orange-100 shadow-sm">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="font-bold text-slate-800">{r.title}</div>
                                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">Por: {r.author}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1 mb-3">
                                                        {r.contributions?.map((c, i) => <span key={i} className="text-[10px] bg-slate-100 px-2 py-0.5 rounded">{c.career}</span>)}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => approveRepo(r.id)} className="flex-1 bg-green-100 text-green-700 py-1 rounded text-xs font-bold hover:bg-green-200 flex items-center justify-center gap-1"><CheckCircle size={14} /> Aprobar</button>
                                                        <button onClick={() => deleteRepo(r.id)} className="flex-1 bg-red-100 text-red-700 py-1 rounded text-xs font-bold hover:bg-red-200 flex items-center justify-center gap-1"><XCircle size={14} /> Rechazar</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* PUBLICADOS */}
                                <div>
                                    <h4 className="font-bold text-gray-600 mb-4 text-xs uppercase tracking-wider">Historial de Proyectos</h4>
                                    <div className="space-y-4">
                                        {approvedRepos.map(r => (
                                            <div key={r.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-slate-800 text-lg">{r.title}</h4>
                                                    {(user.role === 'admin' || user.name === r.author) && <button onClick={() => deleteRepo(r.id)} className="text-red-400 hover:bg-red-50 p-1 rounded"><Trash2 size={16} /></button>}
                                                </div>
                                                <p className="text-sm text-gray-600 line-clamp-2">{r.objective}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {r.contributions?.map((c, i) => (
                                                        <span key={i} className="text-[10px] font-bold uppercase bg-blue-50 text-blue-700 px-2 py-1 rounded">{c.career}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        {approvedRepos.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">No hay proyectos publicados.</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CONTENIDO WEB (Solo Admin) */}
                    {adminTab === 'content' && user.role === 'admin' && (
                        // ... (Mismo código de antes para Noticias y Carreras) ...
                        // Para ahorrar espacio en la respuesta, usa el mismo bloque del turno anterior
                        // solo asegúrate de pegar aquí el contenido de 'content' que te di en la respuesta previa
                        // que incluía el formulario de posts, avisos y lista.
                        <div className="grid lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-4 space-y-6">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Edit size={18} className="text-emerald-600" /> Editor Noticias</h3>
                                    <div className="space-y-3">
                                        <input className="w-full p-2 border rounded text-sm" placeholder="Título" value={postForm.title} onChange={e => setPostForm({ ...postForm, title: e.target.value })} />
                                        <input className="w-full p-2 border rounded text-sm" placeholder="URL Portada" value={postForm.coverImage} onChange={e => setPostForm({ ...postForm, coverImage: e.target.value })} />
                                        <textarea className="w-full p-2 border rounded text-sm h-20" placeholder="Resumen..." value={postForm.summary} onChange={e => setPostForm({ ...postForm, summary: e.target.value })} />
                                        <textarea className="w-full p-2 border rounded text-sm h-32" placeholder="Contenido completo..." value={postForm.content} onChange={e => setPostForm({ ...postForm, content: e.target.value })} />
                                        <input className="w-full p-2 border rounded text-sm" placeholder="Link Git/Docs" value={postForm.gitUrl} onChange={e => setPostForm({ ...postForm, gitUrl: e.target.value })} />
                                        <input className="w-full p-2 border rounded text-sm" placeholder="Galería Extra (URLs)" value={postForm.extraImages} onChange={e => setPostForm({ ...postForm, extraImages: e.target.value })} />
                                        <select className="w-full p-2 border rounded text-sm" value={postForm.career} onChange={e => setPostForm({ ...postForm, career: e.target.value })}>
                                            <option value="General">General</option>{careers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>
                                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={postForm.important} onChange={e => setPostForm({ ...postForm, important: e.target.checked })} /> Destacar</label>
                                        <div className="flex gap-2"><button onClick={handleSavePost} className="flex-1 bg-emerald-600 text-white py-2 rounded font-bold text-sm">{editingId ? 'Actualizar' : 'Publicar'}</button>{editingId && <button onClick={() => { setEditingId(null); setPostForm({ title: '', summary: '', content: '', career: 'General', coverImage: '', extraImages: '', gitUrl: '', important: false }) }} className="px-3 bg-gray-200 text-sm rounded">X</button>}</div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                    <h3 className="font-bold text-sm mb-2 flex gap-2"><Megaphone size={16} /> Aviso Rápido</h3>
                                    <div className="flex gap-1 mb-2">{['blue', 'green', 'yellow', 'orange', 'red'].map(c => (<button key={c} onClick={() => setNoticeForm({ ...noticeForm, color: c })} className={`w-5 h-5 rounded-full ${noticeForm.color === c ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`} style={{ backgroundColor: c }}></button>))}</div>
                                    <div className="flex gap-2"><input className="flex-1 p-2 border rounded text-xs" placeholder="Mensaje..." value={noticeForm.text} onChange={e => setNoticeForm({ ...noticeForm, text: e.target.value })} /><button onClick={handleAddNotice} className="bg-blue-600 text-white px-3 rounded text-xs font-bold">OK</button></div>
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                    <h3 className="font-bold text-sm mb-2 flex gap-2"><GraduationCap size={16} /> Agregar Carrera</h3>
                                    <div className="flex flex-col gap-2"><input className="p-2 border rounded text-xs" placeholder="Nombre Carrera" value={careerForm.name} onChange={e => setCareerForm({ ...careerForm, name: e.target.value })} /> <button onClick={handleAddCareer} className="bg-slate-800 text-white px-3 py-2 rounded text-xs font-bold">Agregar</button></div>
                                    <div className="mt-3 space-y-1 max-h-20 overflow-y-auto">{careers.map(c => (<div key={c.id} className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded border"><span>{c.name}</span><button onClick={() => deleteDoc(doc(db, 'careers', c.id))} className="text-red-500"><Trash2 size={12} /></button></div>))}</div>
                                </div>
                            </div>
                            <div className="lg:col-span-8 space-y-4">
                                {posts.map(p => (
                                    <div key={p.id} className="bg-white p-3 rounded border flex justify-between items-center">
                                        <div className="flex items-center gap-3"><img src={p.coverImage || "https://via.placeholder.com/50"} className="w-10 h-10 rounded object-cover" /><div><div className="font-bold text-sm">{p.title}</div><div className="text-xs text-gray-500">{p.date} • {p.career}</div></div></div>
                                        <div className="flex gap-2"><button onClick={() => toggleImportant(p)} className={`p-1 rounded ${p.important ? 'text-yellow-500' : 'text-gray-300'}`}><Star size={16} /></button><button onClick={() => startEdit(p)} className="text-blue-500"><Edit size={16} /></button><button onClick={() => deletePost(p.id)} className="text-red-500"><Trash2 size={16} /></button></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* USUARIOS (Solo Admin) */}
                    {adminTab === 'users' && user.role === 'admin' && (
                        <div className="grid lg:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-xl border">
                                    <h3 className="font-bold mb-4">Nuevo Usuario</h3>
                                    <div className="space-y-2"><input className="w-full p-2 border rounded text-sm" placeholder="Nombre" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} /><input className="w-full p-2 border rounded text-sm" placeholder="Email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} /><div className="flex gap-2"><input className="flex-1 p-2 border rounded text-sm" placeholder="Clave" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} /><select className="p-2 border rounded text-sm" value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}><option value="alumno">Alumno</option><option value="profesor">Profesor</option><option value="chofer">Chofer</option><option value="admin">Admin</option></select></div><button onClick={handleManualUser} className="w-full bg-slate-800 text-white py-2 rounded text-sm">Registrar</button></div>
                                </div>
                            </div>
                            <div className="bg-white rounded border h-[500px] overflow-y-auto">{usersList.map(u => (<div key={u.id} className="flex justify-between p-3 border-b text-sm"><div><div className="font-bold">{u.name}</div><div className="text-xs text-gray-500">{u.email} • {u.role}</div></div><button onClick={async () => await deleteDoc(doc(db, 'users', u.id))} className="text-red-400"><Trash2 size={14} /></button></div>))}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;