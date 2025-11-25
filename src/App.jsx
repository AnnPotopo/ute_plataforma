import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Bus, BookOpen, LogOut, LogIn, Star, Image as ImageIcon, Lock, Megaphone, ArrowLeft, Calendar, Github, ExternalLink, X } from 'lucide-react';

// Módulos
import { auth, db } from './firebase';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import TransportMap from './components/TransportMap';
import AdminPanel from './components/AdminPanel';
import LoginModal from './components/LoginModal';
import Lightbox from './components/Lightbox';

export default function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [view, setView] = useState('home');
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedCareer, setSelectedCareer] = useState(null); // Para la vista de carrera
  const [lightboxImg, setLightboxImg] = useState(null);

  // Datos
  const [posts, setPosts] = useState([]);
  const [notices, setNotices] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [careers, setCareers] = useState([]); // Ahora viene de BD

  // UI State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [filterCareer, setFilterCareer] = useState('Todas');

  const carouselImages = [
    "https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
    "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80"
  ];

  // Efectos
  useEffect(() => {
    const interval = setInterval(() => setCurrentSlide((p) => (p + 1) % carouselImages.length), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('ute_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    const unsubPosts = onSnapshot(query(collection(db, 'posts')), (s) => setPosts(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt)));
    const unsubNotices = onSnapshot(query(collection(db, 'notices')), (s) => setNotices(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubCareers = onSnapshot(query(collection(db, 'careers'), orderBy('name')), (s) => setCareers(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    let unsubUsers = () => { };
    if (user?.role === 'admin') unsubUsers = onSnapshot(collection(db, 'users'), (s) => setUsersList(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubPosts(); unsubNotices(); unsubCareers(); unsubUsers(); };
  }, [user]);

  const handleLogin = (u) => { setUser(u); localStorage.setItem('ute_user', JSON.stringify(u)); setShowLogin(false); };
  const handleLogout = () => { setUser(null); localStorage.removeItem('ute_user'); setView('home'); signOut(auth).catch(() => { }); };

  // Filtro posts
  const displayedPosts = filterCareer === 'Todas' ? posts : posts.filter(p => p.career === filterCareer || p.career === 'General');

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col selection:bg-emerald-200">
      {showLogin && <LoginModal onLogin={handleLogin} onClose={() => setShowLogin(false)} />}
      {lightboxImg && <Lightbox src={lightboxImg} onClose={() => setLightboxImg(null)} />}

      <Navbar user={user} view={view} setView={setView} setShowLogin={setShowLogin} handleLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 py-8 flex-grow w-full animate-fade-in">

        {/* VISTA: DETALLE DE NOTICIA */}
        {view === 'post_detail' && selectedPost && (
          <div className="animate-fade-in">
            <button onClick={() => setView(selectedCareer ? 'career_detail' : 'home')} className="flex items-center gap-2 text-gray-500 hover:text-emerald-700 font-bold mb-6"><ArrowLeft size={18} /> Volver</button>
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              {selectedPost.coverImage && <img src={selectedPost.coverImage} className="w-full h-64 md:h-96 object-cover" />}
              <div className="p-8 md:p-12">
                <div className="flex gap-2 mb-4"><span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase">{selectedPost.career}</span><span className="text-gray-400 text-xs font-bold flex items-center gap-1"><Calendar size={12} /> {selectedPost.date}</span></div>
                <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6">{selectedPost.title}</h1>
                <div className="prose prose-lg max-w-none text-gray-600 whitespace-pre-wrap">{selectedPost.content}</div>
                {selectedPost.extraImages && <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-4">{selectedPost.extraImages.split(',').map((img, i) => (img.trim() && <img key={i} src={img.trim()} onClick={() => setLightboxImg(img.trim())} className="rounded-xl cursor-pointer hover:opacity-90 shadow-md transition hover:scale-105" />))}</div>}
                {selectedPost.gitUrl && <div className="mt-10 pt-8 border-t border-gray-100"><a href={selectedPost.gitUrl} target="_blank" className="inline-flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg"><Github size={20} /> Ver Documentación / Git</a></div>}
              </div>
            </div>
          </div>
        )}

        {/* VISTA: DETALLE DE CARRERA (TODOS LOS POSTS) */}
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

            <h3 className="text-2xl font-bold text-slate-800">Publicaciones y Proyectos</h3>
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
                <div className="col-span-3 text-center py-10 text-gray-400">No hay publicaciones disponibles aún para esta carrera.</div>
              )}
            </div>
          </div>
        )}

        {/* VISTA: HOME */}
        {view === 'home' && (
          <div className="space-y-10">
            <div className="relative h-64 md:h-[500px] rounded-3xl overflow-hidden shadow-2xl group">
              {carouselImages.map((img, i) => (<img key={i} src={img} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === currentSlide ? 'opacity-100' : 'opacity-0'}`} />))}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent flex items-end p-16"><div className="max-w-3xl"><h2 className="text-4xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-lg">Innovación <span className="text-emerald-400">UTE</span></h2></div></div>
            </div>

            <div className="space-y-2 mb-6">
              {notices.map(n => (
                <div key={n.id} className={`text-white p-3 rounded-lg shadow-md flex items-center justify-between animate-fade-in`} style={{ backgroundColor: n.color === 'blue' ? '#2563eb' : n.color }}>
                  <div className="flex items-center gap-3 font-bold text-sm"><Megaphone size={20} /> {n.text}</div>
                  {user?.role === 'admin' && <button onClick={() => deleteDoc(doc(db, 'notices', n.id))}><X size={16} /></button>}
                </div>
              ))}
            </div>

            <div>
              <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b pb-4 gap-4">
                <h3 className="text-3xl font-bold text-slate-800 flex items-center gap-2"><Star className="text-yellow-500 fill-yellow-500" /> Noticias</h3>
                <select className="border rounded p-2" value={filterCareer} onChange={e => setFilterCareer(e.target.value)}>
                  <option value="Todas">Todas</option><option value="General">General</option>{careers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {displayedPosts.map(p => (
                  <div key={p.id} onClick={() => { setSelectedPost(p); setSelectedCareer(null); setView('post_detail'); }} className="bg-white rounded-2xl shadow-sm hover:shadow-2xl transition cursor-pointer flex flex-col overflow-hidden group">
                    <div className="h-48 bg-gray-100 relative overflow-hidden">
                      {p.coverImage ? <img src={p.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="text-gray-300" /></div>}
                      {p.important && <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-[10px] font-black px-3 py-1 rounded-full">DESTACADO</div>}
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="text-[10px] font-bold text-emerald-600 uppercase mb-2">{p.career}</div>
                      <h4 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2">{p.title}</h4>
                      <p className="text-gray-500 text-sm mb-4 line-clamp-3 flex-grow">{p.summary}</p>
                      <div className="flex justify-between pt-4 border-t text-xs text-gray-400"><span>{p.date}</span><span className="text-slate-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition">Leer más <ArrowLeft size={12} className="rotate-180" /></span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VISTA: OFERTA EDUCATIVA */}
        {view === 'academic' && (
          <div className="space-y-10">
            <div className="bg-emerald-900 text-white p-12 rounded-3xl shadow-xl text-center"><h2 className="text-4xl font-bold">Oferta Educativa</h2><p className="mt-2 text-emerald-100">Selecciona una carrera para ver sus novedades.</p></div>
            <div className="grid md:grid-cols-3 gap-6">
              {careers.map(c => (
                <div key={c.id} className="bg-white p-8 rounded-2xl shadow-sm border hover:border-emerald-500 transition cursor-pointer text-center group" onClick={() => { setSelectedCareer(c); setView('career_detail'); }}>
                  <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition"><BookOpen size={32} /></div>
                  <h3 className="font-bold text-lg text-slate-800">{c.name}</h3>
                  <p className="text-xs text-gray-400 mt-2">Ver publicaciones</p>
                </div>
              ))}
              {careers.length === 0 && <div className="col-span-3 text-center text-gray-400">No hay carreras registradas. Accede como Admin para agregar.</div>}
            </div>
          </div>
        )}

        {/* VISTA: GALERÍA */}
        {view === 'gallery' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1, 2, 3, 4, 5, 6, 7, 8].map(i => (<img key={i} src={`https://picsum.photos/seed/${i + 20}/400/400`} className="rounded-xl cursor-pointer hover:opacity-80" onClick={() => setLightboxImg(`https://picsum.photos/seed/${i + 20}/800/800`)} />))}</div>
        )}

        {/* VISTA: TRANSPORTE */}
        {view === 'transport' && (
          <div>
            <div className="flex justify-between items-end mb-8"><div><h2 className="text-3xl font-bold flex items-center gap-3"><Bus className="text-emerald-600" size={32} /> Transporte</h2></div>{user && <span className="bg-green-100 text-green-800 px-4 py-1 rounded-full text-xs font-bold">EN VIVO</span>}</div>
            {user ? <TransportMap user={user} isAdmin={user.role === 'admin'} isDriver={user.role === 'chofer'} /> : <div className="h-96 bg-slate-50 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center"><Lock size={32} className="text-slate-400 mb-4" /><h3 className="text-xl font-bold">Área Protegida</h3><button onClick={() => setShowLogin(true)} className="mt-4 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold">Ingresar</button></div>}
          </div>
        )}

        {/* VISTA: ADMIN */}
        {view === 'admin' && user?.role === 'admin' && <AdminPanel posts={posts} usersList={usersList} user={user} careers={careers} />}
      </main>

      <Footer />
    </div>
  );
}