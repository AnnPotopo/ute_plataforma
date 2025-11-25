import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import {
  Bus, BookOpen, LogOut, LogIn, Star, Image as ImageIcon, Plus, Lock,
  Download, Upload, Github, ExternalLink, Trash2, User, FileText, Edit, X, Users, Layout, Save
} from 'lucide-react';

import { auth, db } from './firebase';
import TransportMap from './components/TransportMap';
import LoginModal from './components/LoginModal';
import Lightbox from './components/Lightbox';

export default function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [view, setView] = useState('home');
  const [lightboxImg, setLightboxImg] = useState(null);

  // Datos Globales
  const [posts, setPosts] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [careersList] = useState([
    { id: 'ti', name: 'Tecnologías de la Información' },
    { id: 'mtto', name: 'Mantenimiento Industrial' },
    { id: 'dn', name: 'Desarrollo de Negocios' },
    { id: 'meca', name: 'Mecatrónica' },
    { id: 'er', name: 'Energías Renovables' }
  ]);

  // --- ESTADOS DE ADMIN ---
  const [adminTab, setAdminTab] = useState('content'); // 'content' | 'users'

  // Estado Formulario Post (Crear/Editar)
  const [editingId, setEditingId] = useState(null);
  const [postForm, setPostForm] = useState({ title: '', content: '', career: 'General', gitUrl: '', important: false });

  // Estado Formulario Usuario (Manual)
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'alumno', password: '' });

  // --- CAROUSEL ---
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselImages = [
    "https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
    "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80"
  ];

  useEffect(() => {
    const interval = setInterval(() => setCurrentSlide((p) => (p + 1) % carouselImages.length), 5000);
    return () => clearInterval(interval);
  }, []);

  // --- LISTENERS FIREBASE ---
  useEffect(() => {
    // Escuchar Posts
    const q = query(collection(db, 'posts'));
    const unsubPosts = onSnapshot(q, (s) => {
      const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
      // Orden: Primero Importantes, luego por fecha
      data.sort((a, b) => {
        if (a.important === b.important) return new Date(b.date) - new Date(a.date);
        return a.important ? -1 : 1;
      });
      setPosts(data);
    });

    // Escuchar Usuarios (Solo si es admin para ahorrar recursos, o siempre para simplificar)
    // Nota: En producción esto debería protegerse con reglas de seguridad
    const unsubUsers = onSnapshot(collection(db, 'users'), (s) => setUsersList(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    const savedUser = localStorage.getItem('ute_user');
    if (savedUser) setUser(JSON.parse(savedUser));

    return () => { unsubPosts(); unsubUsers(); };
  }, []);

  // --- HANDLERS AUTH ---
  const handleLogin = (u) => { setUser(u); localStorage.setItem('ute_user', JSON.stringify(u)); setShowLogin(false); };
  const handleLogout = () => { setUser(null); localStorage.removeItem('ute_user'); setView('home'); signOut(auth).catch(() => { }); };

  // --- HANDLERS POSTS (CRUD) ---
  const handleSavePost = async () => {
    if (!postForm.title) return alert('Falta título');
    try {
      if (editingId) {
        // MODO EDICIÓN
        await updateDoc(doc(db, 'posts', editingId), { ...postForm });
        alert('Publicación actualizada');
      } else {
        // MODO CREACIÓN
        await addDoc(collection(db, 'posts'), {
          ...postForm,
          author: user.name,
          authorRole: user.role,
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date()
        });
        alert('Publicado correctamente');
      }
      resetPostForm();
    } catch (e) { alert('Error al guardar'); console.error(e); }
  };

  const handleEditClick = (post) => {
    setPostForm({
      title: post.title,
      content: post.content,
      career: post.career,
      gitUrl: post.gitUrl || '',
      important: post.important
    });
    setEditingId(post.id);
    // Scroll al formulario (simple UX)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePost = async (id) => {
    if (confirm("¿Seguro que quieres eliminar esta publicación?")) {
      await deleteDoc(doc(db, 'posts', id));
    }
  };

  const handleToggleImportant = async (post) => {
    await updateDoc(doc(db, 'posts', post.id), { important: !post.important });
  };

  const resetPostForm = () => {
    setPostForm({ title: '', content: '', career: 'General', gitUrl: '', important: false });
    setEditingId(null);
  };

  // --- HANDLERS USUARIOS ---
  const handleManualUserRegister = async () => {
    if (!userForm.name || !userForm.email || !userForm.password) return alert("Todos los campos son obligatorios");
    try {
      await addDoc(collection(db, 'users'), { ...userForm, createdAt: new Date() });
      alert("Usuario registrado manualmente");
      setUserForm({ name: '', email: '', role: 'alumno', password: '' });
    } catch (e) { alert("Error al registrar usuario"); }
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target.result;
      const rows = text.split('\n').slice(1);
      let count = 0;
      for (let row of rows) {
        const cols = row.split(',');
        if (cols.length >= 5) {
          const [matricula, nombres, apP, apM, pass, tel, email] = cols;
          if (matricula && nombres) {
            await addDoc(collection(db, 'users'), {
              matricula, name: `${nombres} ${apP} ${apM}`, email: email?.trim(),
              role: 'alumno', password: pass?.trim(), phone: tel?.trim()
            });
            count++;
          }
        }
      }
      alert(`Carga masiva completada: ${count} alumnos.`);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,matricula,nombres,apellidoPaterno,apellidoMaterno,contrasena,telefono,correo\n12345,Juan,Perez,Lopez,pass123,8111111111,juan@ute.edu.mx";
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "plantilla_ute.csv");
    document.body.appendChild(link);
    link.click();
  };

  // Filtro para vista pública
  const [filterCareer, setFilterCareer] = useState('Todas');
  const displayedPosts = filterCareer === 'Todas' ? posts : posts.filter(p => p.career === filterCareer || p.career === 'General');

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-800 flex flex-col selection:bg-emerald-200">
      {showLogin && <LoginModal onLogin={handleLogin} onClose={() => setShowLogin(false)} />}
      {lightboxImg && <Lightbox src={lightboxImg} onClose={() => setLightboxImg(null)} />}

      {/* NAVBAR */}
      <nav className="bg-white shadow-md sticky top-0 z-[500] border-b-4 border-emerald-600">
        <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('home')}>
            <div className="w-10 h-10 bg-emerald-800 rounded text-white flex items-center justify-center font-bold shadow">UTE</div>
            <div><div className="font-bold text-emerald-900 leading-none">UTE</div><div className="text-[10px] text-emerald-600 font-bold uppercase">Escobedo</div></div>
          </div>
          <div className="hidden md:flex gap-1">
            {[
              { id: 'home', label: 'Inicio' },
              { id: 'academic', label: 'Oferta Educativa' },
              { id: 'gallery', label: 'Galería' },
              { id: 'transport', label: 'Transporte', icon: Bus }
            ].map(i => (
              <button key={i.id} onClick={() => setView(i.id)} className={`px-4 py-2 rounded-lg flex gap-2 text-sm font-bold transition ${view === i.id ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'text-gray-500 hover:bg-gray-50 hover:text-emerald-600'}`}>
                {i.icon && <i.icon size={16} />} {i.label}
              </button>
            ))}
            {user?.role === 'admin' && <button onClick={() => setView('admin')} className="px-4 py-2 text-purple-600 font-bold text-sm hover:bg-purple-50 rounded ml-2 border border-purple-100">Admin</button>}
          </div>
          <div className="flex gap-4 items-center">
            {user ? (
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-gray-800">{user.name}</div>
                  <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{user.role}</div>
                </div>
                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition"><LogOut size={18} /></button>
              </div>
            ) : (
              <button onClick={() => setShowLogin(true)} className="flex gap-2 px-5 py-2 bg-emerald-700 text-white rounded-full font-bold text-sm shadow hover:bg-emerald-800"><LogIn size={16} /> Acceso</button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 flex-grow w-full animate-fade-in">

        {/* HOME */}
        {view === 'home' && (
          <div className="space-y-10">
            <div className="relative h-64 md:h-[450px] rounded-2xl overflow-hidden shadow-2xl group border border-gray-200">
              {carouselImages.map((img, i) => (<img key={i} src={img} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === currentSlide ? 'opacity-100' : 'opacity-0'}`} />))}
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/90 via-transparent to-black/20 flex items-end p-10">
                <h2 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-md">Innovación y <span className="text-emerald-400">Liderazgo</span></h2>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-6 border-b pb-2">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Star className="text-yellow-500 fill-yellow-500" /> Noticias</h3>
                <select className="text-sm border rounded p-1 bg-white" value={filterCareer} onChange={e => setFilterCareer(e.target.value)}>
                  <option value="Todas">Todas las áreas</option>
                  <option value="General">General</option>
                  {careersList.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid gap-6">
                {displayedPosts.map(p => (
                  <div key={p.id} className={`bg-white p-6 rounded-xl shadow-sm border ${p.important ? 'border-l-4 border-l-yellow-400 bg-yellow-50/30' : 'border-gray-100'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${p.important ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100'}`}>{p.career}</span>
                      <span className="text-xs text-gray-400">{p.date}</span>
                    </div>
                    <h4 className="font-bold text-xl mb-2">{p.title}</h4>
                    <p className="text-gray-600 text-sm mb-4">{p.content}</p>
                    {p.gitUrl && <a href={p.gitUrl} target="_blank" className="text-emerald-600 text-xs font-bold flex items-center gap-1"><Github size={14} /> Ver Proyecto</a>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ACADEMIC */}
        {view === 'academic' && (
          <div className="space-y-8">
            <div className="text-center bg-emerald-900 text-white p-10 rounded-2xl shadow-lg"><h2 className="text-3xl font-bold">Oferta Educativa</h2></div>
            <div className="grid md:grid-cols-3 gap-6">
              {careersList.map(c => (
                <div key={c.id} className="bg-white p-6 rounded-xl shadow-sm border hover:border-emerald-400 cursor-pointer transition" onClick={() => setFilterCareer(c.name)}>
                  <div className="text-emerald-700 mb-4"><BookOpen size={32} /></div>
                  <h3 className="font-bold text-lg">{c.name}</h3>
                </div>
              ))}
            </div>
            {filterCareer !== 'Todas' && (
              <div>
                <h3 className="font-bold text-xl mb-4">Noticias de {filterCareer}</h3>
                {posts.filter(p => p.career === filterCareer).map(p => (
                  <div key={p.id} className="bg-white p-4 rounded border mb-2">
                    <h4 className="font-bold">{p.title}</h4>
                    <p className="text-sm text-gray-600">{p.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* GALLERY */}
        {view === 'gallery' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} onClick={() => setLightboxImg(`https://picsum.photos/seed/${i + 20}/800/800`)} className="aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer hover:opacity-90">
                <img src={`https://picsum.photos/seed/${i + 20}/400/400`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* TRANSPORT */}
        {view === 'transport' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Bus className="text-emerald-600" /> Transporte en Vivo</h2>
              {user && <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold animate-pulse">● Servicio Activo</span>}
            </div>
            {user ? <TransportMap user={user} isAdmin={user.role === 'admin'} isDriver={user.role === 'chofer'} /> :
              <div className="h-[400px] bg-slate-50 rounded-xl flex flex-col items-center justify-center text-center p-8 border-dashed border-2 border-gray-300">
                <Lock size={40} className="text-gray-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-600">Acceso Restringido</h3>
                <button onClick={() => setShowLogin(true)} className="mt-4 bg-emerald-700 text-white px-6 py-2 rounded font-bold">Iniciar Sesión</button>
              </div>
            }
          </div>
        )}

        {/* ADMIN PANEL (RENOVADO) */}
        {view === 'admin' && user?.role === 'admin' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-slate-50 border-b flex">
                <button onClick={() => setAdminTab('content')} className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 ${adminTab === 'content' ? 'bg-white text-emerald-700 border-t-2 border-t-emerald-600' : 'text-gray-500 hover:bg-gray-100'}`}>
                  <Layout size={16} /> Gestión de Contenido
                </button>
                <button onClick={() => setAdminTab('users')} className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 ${adminTab === 'users' ? 'bg-white text-emerald-700 border-t-2 border-t-emerald-600' : 'text-gray-500 hover:bg-gray-100'}`}>
                  <Users size={16} /> Gestión de Usuarios
                </button>
              </div>

              <div className="p-6">
                {/* PESTAÑA CONTENIDO */}
                {adminTab === 'content' && (
                  <div className="grid lg:grid-cols-3 gap-8">
                    {/* Formulario Izquierda */}
                    <div className="lg:col-span-1 space-y-4">
                      <div className={`p-4 rounded-lg border ${editingId ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                        <h3 className="font-bold text-gray-800 mb-3 flex justify-between items-center">
                          {editingId ? 'Editando Publicación' : 'Nueva Publicación'}
                          {editingId && <button onClick={resetPostForm} className="text-xs text-red-500 flex items-center"><X size={12} /> Cancelar</button>}
                        </h3>
                        <div className="space-y-3">
                          <input className="w-full p-2 border rounded text-sm" placeholder="Título" value={postForm.title} onChange={e => setPostForm({ ...postForm, title: e.target.value })} />
                          <select className="w-full p-2 border rounded text-sm" value={postForm.career} onChange={e => setPostForm({ ...postForm, career: e.target.value })}>
                            <option value="General">General</option>
                            {careersList.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                          </select>
                          <textarea className="w-full p-2 border rounded text-sm h-24 resize-none" placeholder="Contenido..." value={postForm.content} onChange={e => setPostForm({ ...postForm, content: e.target.value })} />
                          <input className="w-full p-2 border rounded text-sm" placeholder="Link Git / Docs (Opcional)" value={postForm.gitUrl} onChange={e => setPostForm({ ...postForm, gitUrl: e.target.value })} />
                          <div className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={postForm.important} onChange={e => setPostForm({ ...postForm, important: e.target.checked })} /> Destacar
                          </div>
                          <button onClick={handleSavePost} className={`w-full py-2 rounded font-bold text-white text-sm flex items-center justify-center gap-2 ${editingId ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                            <Save size={14} /> {editingId ? 'Actualizar Post' : 'Publicar'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Lista Derecha */}
                    <div className="lg:col-span-2">
                      <h3 className="font-bold text-gray-700 mb-4">Publicaciones Recientes ({posts.length})</h3>
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {posts.map(post => (
                          <div key={post.id} className={`flex justify-between items-start p-4 rounded border bg-white hover:shadow-md transition group ${post.important ? 'border-l-4 border-l-yellow-400' : ''}`}>
                            <div>
                              <h4 className="font-bold text-gray-800">{post.title}</h4>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-1">{post.content}</p>
                              <div className="flex gap-2 mt-2 text-[10px] font-bold uppercase text-gray-400">
                                <span>{post.date}</span>
                                <span>• {post.career}</span>
                                <span>• Por: {post.author} ({post.authorRole})</span>
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleToggleImportant(post)} title="Destacar" className={`p-2 rounded hover:bg-gray-100 ${post.important ? 'text-yellow-500' : 'text-gray-300'}`}><Star size={16} fill={post.important ? "currentColor" : "none"} /></button>
                              <button onClick={() => handleEditClick(post)} title="Editar" className="p-2 text-blue-500 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                              <button onClick={() => handleDeletePost(post.id)} title="Eliminar" className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* PESTAÑA USUARIOS */}
                {adminTab === 'users' && (
                  <div className="grid lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      {/* Registro Manual */}
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="font-bold text-gray-800 mb-3">Registro Manual</h3>
                        <div className="space-y-3">
                          <input className="w-full p-2 border rounded text-sm" placeholder="Nombre Completo" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} />
                          <input className="w-full p-2 border rounded text-sm" placeholder="Correo Institucional" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} />
                          <input className="w-full p-2 border rounded text-sm" type="password" placeholder="Contraseña Temporal" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} />
                          <select className="w-full p-2 border rounded text-sm" value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
                            <option value="alumno">Alumno</option>
                            <option value="profesor">Profesor</option>
                            <option value="chofer">Chofer</option>
                            <option value="admin">Administrador</option>
                          </select>
                          <button onClick={handleManualUserRegister} className="w-full bg-blue-600 text-white py-2 rounded font-bold text-sm hover:bg-blue-700">Registrar Usuario</button>
                        </div>
                      </div>

                      {/* Carga CSV */}
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50">
                        <Upload size={32} className="text-gray-400 mb-2" />
                        <p className="font-bold text-sm text-gray-600">Carga Masiva (CSV)</p>
                        <input type="file" accept=".csv" onChange={handleCsvUpload} className="mt-2 text-xs w-full text-center" />
                        <button onClick={downloadTemplate} className="mt-4 text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"><Download size={12} /> Descargar Plantilla</button>
                      </div>
                    </div>

                    {/* Lista Usuarios */}
                    <div>
                      <h3 className="font-bold text-gray-700 mb-4">Base de Usuarios ({usersList.length})</h3>
                      <div className="bg-white border rounded-lg overflow-hidden">
                        <div className="max-h-[400px] overflow-y-auto">
                          {usersList.map(u => (
                            <div key={u.id} className="flex justify-between items-center p-3 border-b last:border-0 hover:bg-gray-50 text-sm">
                              <div>
                                <div className="font-bold">{u.name}</div>
                                <div className="text-xs text-gray-500">{u.email} • {u.role}</div>
                              </div>
                              <button onClick={() => deleteDoc(doc(db, 'users', u.id))} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-emerald-900 text-emerald-100 py-8 border-t-8 border-emerald-600 text-sm">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">
          <div>
            <h4 className="font-bold text-white text-lg mb-2 flex items-center gap-2"><div className="w-6 h-6 bg-white text-emerald-900 rounded flex items-center justify-center text-xs font-bold">U</div> UTE Escobedo</h4>
            <p className="opacity-70 text-xs leading-relaxed">Universidad Tecnológica Gral. Mariano Escobedo.<br />Formando líderes para el futuro.</p>
          </div>
          <div>
            <h5 className="font-bold text-white mb-2 text-xs uppercase tracking-widest">Legal</h5>
            <ul className="space-y-1 opacity-70 text-xs">
              <li><a href="#" className="hover:text-white hover:underline">Transparencia</a></li>
              <li><a href="#" className="hover:text-white hover:underline">Privacidad</a></li>
            </ul>
          </div>
          <div className="text-right opacity-50 text-xs self-end">
            © 2025 Plataforma Web UTE
          </div>
        </div>
      </footer>
    </div>
  );
}