import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import {
  Bus, BookOpen, LogOut, LogIn, Star, Image as ImageIcon, Lock,
  Megaphone, ArrowLeft, Calendar, Github, FolderGit2, X
} from 'lucide-react';

// Módulos
import { auth, db } from './firebase';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import TransportMap from './components/TransportMap';
import AdminPanel from './components/AdminPanel';
import Repositories from './components/Repositories'; // <--- Nuevo Módulo
import LoginModal from './components/LoginModal';
import Lightbox from './components/Lightbox';

export default function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [view, setView] = useState('home');

  // Estados de Selección y UI
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [filterCareer, setFilterCareer] = useState('Todas');

  // Datos de Firebase
  const [posts, setPosts] = useState([]);
  const [repoPosts, setRepoPosts] = useState([]); // <--- Datos para Repositorios
  const [notices, setNotices] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [careers, setCareers] = useState([]);

  const carouselImages = [
    "https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
    "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80"
  ];

  // --- EFECTOS ---
  useEffect(() => {
    const interval = setInterval(() => setCurrentSlide((p) => (p + 1) % carouselImages.length), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('ute_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // Listeners de Base de Datos
  useEffect(() => {
    // 1. Noticias Generales
    const unsubPosts = onSnapshot(query(collection(db, 'posts')), (s) => {
      setPosts(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt));
    });

    // 2. Repositorios (Solo aprobados para vista pública)
    // Nota: El AdminPanel lee su propia lista completa (incluyendo pendientes)
    const unsubRepos = onSnapshot(query(collection(db, 'repo_posts'), where('status', '==', 'approved')), (s) => {
      setRepoPosts(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt));
    });

    // 3. Avisos y Carreras
    const unsubNotices = onSnapshot(query(collection(db, 'notices')), (s) => setNotices(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubCareers = onSnapshot(query(collection(db, 'careers')), (s) => setCareers(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    // 4. Usuarios (Solo si es admin)
    let unsubUsers = () => { };
    if (user?.role === 'admin') {
      unsubUsers = onSnapshot(collection(db, 'users'), (s) => setUsersList(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    }

    return () => { unsubPosts(); unsubRepos(); unsubNotices(); unsubCareers(); unsubUsers(); };
  }, [user]);

  // --- HANDLERS ---
  const handleLogin = (u) => { setUser(u); localStorage.setItem('ute_user', JSON.stringify(u)); setShowLogin(false); };
  const handleLogout = () => { setUser(null); localStorage.removeItem('ute_user'); setView('home'); signOut(auth).catch(() => { }); };

  // Filtros para vista Home
  const displayedPosts = filterCareer === 'Todas' ? posts : posts.filter(p => p.career === filterCareer || p.career === 'General');
  const featuredPosts = displayedPosts.filter(p => p.important);
  const regularPosts = displayedPosts.filter(p => !p.important);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col selection:bg-emerald-200">
      {showLogin && <LoginModal onLogin={handleLogin} onClose={() => setShowLogin(false)} />}
      {lightboxImg && <Lightbox src={lightboxImg} onClose={() => setLightboxImg(null)} />}

      {/* MÓDULO NAVBAR */}
      <Navbar user={user} view={view} setView={setView} setShowLogin={setShowLogin} handleLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 py-8 flex-grow w-full animate-fade-in">

        {/* --- VISTA: DETALLE DE NOTICIA (Click en tarjeta Home) --- */}
        {view === 'post_detail' && selectedPost && (
          <div className="animate-fade-in">
            <button onClick={() => setView(selectedCareer ? 'career_detail' : 'home')} className="flex items-center gap-2 text-gray-500 hover:text-emerald-700 font-bold mb-6"><ArrowLeft size={18} /> Volver</button>
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              {selectedPost.coverImage && <img src={selectedPost.coverImage} className="w-full h-64 md:h-96 object-cover" />}
              <div className="p-8 md:p-12">
                <div className="flex gap-2 mb-4">
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">{selectedPost.career}</span>
                  <span className="text-gray-400 text-xs font-bold flex items-center gap-1"><Calendar size={12} /> {selectedPost.date}</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">{selectedPost.title}</h1>
                <div className="prose prose-lg max-w-none text-gray-600 whitespace-pre-wrap leading-relaxed">{selectedPost.content}</div>

                {/* Galería Extra */}
                {selectedPost.extraImages && (
                  <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedPost.extraImages.split(',').map((img, i) => (
                      img.trim() && <img key={i} src={img.trim()} onClick={() => setLightboxImg(img.trim())} className="rounded-xl cursor-pointer hover:opacity-90 shadow-md transition hover:scale-105" />
                    ))}
                  </div>
                )}

                {/* Enlaces */}
                {selectedPost.gitUrl && (
                  <div className="mt-10 pt-8 border-t border-gray-100">
                    <a href={selectedPost.gitUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg">
                      <Github size={20} /> Ver Documentación / Repositorio
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- VISTA: DETALLE DE CARRERA (Filtro) --- */}
        {view === 'career_detail' && selectedCareer && (
          <div className="animate-fade-in space-y-8">
            <button onClick={() => setView('academic')} className="flex items-center gap-2 text-gray-500 hover:text-emerald-700 font-bold"><ArrowLeft size={18} /> Volver a Oferta Educativa</button>
            <div className="bg-emerald-900 text-white p-10 rounded-3xl shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-4xl font-bold mb-2">{selectedCareer.name}</h2>
                <p className="text-emerald-100 text-lg">{selectedCareer.description || "Formación especializada para el futuro."}</p>
              </div>
              <BookOpen className="absolute -bottom-10 -right-10 text-emerald-800 w-64 h-64 opacity-50" />
            </div>

            <h3 className="text-2xl font-bold text-slate-800">Publicaciones y Noticias</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.filter(p => p.career === selectedCareer.name).map(p => (
                <div key={p.id} onClick={() => { setSelectedPost(p); setView('post_detail'); }} className="bg-white rounded-2xl shadow-sm hover:shadow-2xl transition cursor-pointer flex flex-col overflow-hidden group">
                  <div className="h-40 bg-gray-100 relative overflow-hidden">
                    {p.coverImage ? <img src={p.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="text-gray-300" /></div>}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h4 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2">{p.title}</h4>
                    <p className="text-gray-500 text-xs mb-4 line-clamp-3 flex-grow">{p.summary}</p>
                    <div className="flex justify-between pt-3 border-t text-xs text-gray-400"><span>{p.date}</span><span className="text-emerald-600 font-bold">Leer más</span></div>
                  </div>
                </div>
              ))}
              {posts.filter(p => p.career === selectedCareer.name).length === 0 && (
                <div className="col-span-3 text-center py-10 text-gray-400">No hay publicaciones disponibles para esta carrera.</div>
              )}
            </div>
          </div>
        )}

        {/* --- VISTA: REPOSITORIOS (NUEVO) --- */}
        {view === 'repositories' && user && (
          <Repositories repoPosts={repoPosts} careers={careers} />
        )}

        {/* --- VISTA: HOME --- */}
        {view === 'home' && (
          <div className="space-y-10">
            {/* Carrusel */}
            <div className="relative h-64 md:h-[500px] rounded-3xl overflow-hidden shadow-2xl group">
              {carouselImages.map((img, i) => (<img key={i} src={img} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === currentSlide ? 'opacity-100' : 'opacity-0'}`} />))}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent flex items-end p-8 md:p-16">
                <div className="max-w-3xl">
                  <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-lg">Innovación <span className="text-emerald-400">UTE</span></h2>
                  <p className="text-emerald-50 text-lg font-medium max-w-xl hidden md:block">Formando líderes técnicos con visión global desde Nuevo León.</p>
                </div>
              </div>
            </div>

            {/* Barra de Avisos */}
            <div className="space-y-2">
              {notices.map(n => (
                <div key={n.id} className={`text-white p-3 rounded-lg shadow-md flex items-center justify-between animate-fade-in`} style={{ backgroundColor: n.color === 'blue' ? '#2563eb' : n.color === 'green' ? '#059669' : n.color === 'yellow' ? '#eab308' : n.color === 'orange' ? '#f97316' : '#dc2626' }}>
                  <div className="flex items-center gap-3 font-bold text-sm"><Megaphone size={20} className="animate-pulse" /> {n.text}</div>
                  {/* Los avisos son solo informativos aquí, el borrado es en Admin */}
                </div>
              ))}
            </div>

            {/* Filtro Global */}
            <div className="flex flex-col md:flex-row justify-between items-center border-b pb-4 gap-4">
              <h3 className="text-3xl font-bold text-slate-800 flex items-center gap-2"><Star className="text-yellow-500 fill-yellow-500" size={28} /> Noticias</h3>
              <select className="border rounded p-2 bg-white shadow-sm font-medium text-gray-600" value={filterCareer} onChange={e => setFilterCareer(e.target.value)}>
                <option value="Todas">Todas las Carreras</option>
                <option value="General">General</option>
                {careers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            {/* DESTACADAS (Arriba) */}
            {featuredPosts.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Relevantes</h4>
                <div className="grid md:grid-cols-2 gap-8">
                  {featuredPosts.map(p => (
                    <div key={p.id} onClick={() => { setSelectedPost(p); setView('post_detail'); }} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition cursor-pointer flex flex-col overflow-hidden border-l-4 border-yellow-400 relative group">
                      <div className="h-64 bg-gray-100 relative overflow-hidden">
                        {p.coverImage ? <img src={p.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="text-gray-300" /></div>}
                        <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">Destacado</div>
                      </div>
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="text-[10px] font-bold text-emerald-600 uppercase mb-2">{p.career}</div>
                        <h4 className="text-2xl font-bold text-slate-900 mb-3 leading-tight group-hover:text-emerald-700 transition">{p.title}</h4>
                        <p className="text-gray-500 text-sm line-clamp-3">{p.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GENERALES (Abajo) */}
            <div className="pt-4">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Más Recientes</h4>
              <div className="grid md:grid-cols-3 gap-8">
                {regularPosts.map(p => (
                  <div key={p.id} onClick={() => { setSelectedPost(p); setView('post_detail'); }} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition cursor-pointer flex flex-col overflow-hidden border border-gray-100 group">
                    <div className="h-40 bg-gray-100 relative overflow-hidden">
                      {p.coverImage ? <img src={p.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="text-gray-300" /></div>}
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">{p.career}</div>
                      <h4 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-emerald-700 transition">{p.title}</h4>
                      <div className="mt-auto pt-3 flex justify-between text-xs text-gray-400">
                        <span>{p.date}</span>
                        <span className="text-emerald-600 font-bold opacity-0 group-hover:opacity-100 transition">Leer nota</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- VISTA: OFERTA EDUCATIVA --- */}
        {view === 'academic' && (
          <div className="space-y-10">
            <div className="bg-emerald-900 text-white p-12 rounded-3xl shadow-xl text-center"><h2 className="text-4xl font-bold">Oferta Educativa</h2><p className="mt-2 text-emerald-100">Selecciona una carrera para conocer más.</p></div>
            <div className="grid md:grid-cols-3 gap-6">
              {careers.map(c => (
                <div key={c.id} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:border-emerald-500 transition cursor-pointer text-center group hover:-translate-y-1 duration-300" onClick={() => { setSelectedCareer(c); setView('career_detail'); }}>
                  <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition"><BookOpen size={32} /></div>
                  <h3 className="font-bold text-lg text-slate-800">{c.name}</h3>
                  <p className="text-xs text-gray-400 mt-2 group-hover:text-emerald-600 transition">Ver perfil y noticias →</p>
                </div>
              ))}
              {careers.length === 0 && <div className="col-span-3 text-center text-gray-400">No hay carreras registradas.</div>}
            </div>
          </div>
        )}

        {/* --- VISTA: GALERÍA --- */}
        {view === 'gallery' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">Galería Universitaria</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer group relative" onClick={() => setLightboxImg(`https://picsum.photos/seed/${i + 20}/800/800`)}>
                  <img src={`https://picsum.photos/seed/${i + 20}/400/400`} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold">Ver</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- VISTA: TRANSPORTE --- */}
        {view === 'transport' && (
          <div>
            <div className="flex justify-between items-end mb-8">
              <div><h2 className="text-3xl font-bold flex items-center gap-3 text-slate-900"><Bus className="text-emerald-600" size={32} /> Transporte Escolar</h2><p className="text-gray-500 mt-1">Monitor de unidades en tiempo real</p></div>
              {user && <span className="bg-green-100 text-green-800 px-4 py-1 rounded-full text-xs font-bold shadow-sm">● EN VIVO</span>}
            </div>
            {user ? <TransportMap user={user} isAdmin={user.role === 'admin'} isDriver={user.role === 'chofer'} /> :
              <div className="h-96 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-8">
                <div className="bg-white p-4 rounded-full mb-4 shadow-sm"><Lock size={32} className="text-slate-400" /></div>
                <h3 className="text-xl font-bold text-slate-700">Acceso Restringido</h3>
                <p className="text-gray-500 mb-6">Inicia sesión para visualizar el mapa.</p>
                <button onClick={() => setShowLogin(true)} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 shadow-lg">Ingresar</button>
              </div>
            }
          </div>
        )}

        {/* --- VISTA: ADMIN / PROFESOR --- */}
        {view === 'admin' && (user?.role === 'admin' || user?.role === 'profesor') && (
          <AdminPanel posts={posts} usersList={usersList} user={user} careers={careers} />
        )}
      </main>

      {/* MÓDULO FOOTER */}
      <Footer />
    </div>
  );
}