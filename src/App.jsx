import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import {
  Bus, BookOpen, LogOut, LogIn, Star, Image as ImageIcon, Plus, Lock
} from 'lucide-react';

// Importamos nuestros módulos
import { auth, db } from './firebase';
import TransportMap from './components/TransportMap';
import LoginModal from './components/LoginModal';
import Lightbox from './components/Lightbox';

export default function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [view, setView] = useState('home');
  const [lightboxImg, setLightboxImg] = useState(null);
  const [carouselImages] = useState([
    "https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
  ]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ title: '', content: '', career: 'General', important: false });
  const careers = ['TI', 'Mantenimiento', 'Negocios', 'Mecatrónica'];

  // Efectos (Carrusel y Datos)
  useEffect(() => {
    const interval = setInterval(() => setCurrentSlide((p) => (p + 1) % carouselImages.length), 5000);
    return () => clearInterval(interval);
  }, [carouselImages]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'posts'), (s) => setPosts(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.date) - new Date(a.date))));
    const savedUser = localStorage.getItem('ute_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    return () => unsub();
  }, []);

  // Handlers
  const handleLogin = (u) => { setUser(u); localStorage.setItem('ute_user', JSON.stringify(u)); setShowLogin(false); };
  const handleLogout = () => { setUser(null); localStorage.removeItem('ute_user'); setView('home'); signOut(auth).catch(() => { }); };
  const handleCreatePost = async () => {
    if (!newPost.title) return alert('Falta título');
    await addDoc(collection(db, 'posts'), { ...newPost, date: new Date().toISOString().split('T')[0], createdAt: new Date() });
    alert('Publicado'); setNewPost({ title: '', content: '', career: 'General', important: false });
  };

  const pinnedPosts = posts.filter(p => p.important);
  const regularPosts = posts.filter(p => !p.important);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-800 flex flex-col">
      {showLogin && <LoginModal onLogin={handleLogin} onClose={() => setShowLogin(false)} />}
      {lightboxImg && <Lightbox src={lightboxImg} onClose={() => setLightboxImg(null)} />}

      {/* NAVBAR */}
      <nav className="bg-white shadow-md sticky top-0 z-[500] border-b-4 border-emerald-600">
        <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
            <div className="w-10 h-10 bg-emerald-800 rounded text-white flex items-center justify-center font-bold">UTE</div>
            <div><div className="font-bold text-emerald-900 leading-none">UTE</div><div className="text-[10px] text-emerald-600 font-bold uppercase">Escobedo</div></div>
          </div>
          <div className="hidden md:flex gap-2">
            {[{ id: 'home', label: 'Inicio' }, { id: 'academic', label: 'Oferta' }, { id: 'gallery', label: 'Galería' }, { id: 'transport', label: 'Transporte', icon: Bus }].map(i => (
              <button key={i.id} onClick={() => setView(i.id)} className={`px-4 py-2 rounded-lg flex gap-2 ${view === i.id ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-gray-600'}`}>
                {i.icon && <i.icon size={18} />} {i.label}
              </button>
            ))}
            {user?.role === 'admin' && <button onClick={() => setView('admin')} className="px-4 py-2 text-purple-600 font-bold">Admin</button>}
          </div>
          <div className="flex gap-4 items-center">
            {user ? (
              <div className="flex items-center gap-3 pl-4 border-l"><span className="text-xs font-bold">{user.name}</span><button onClick={handleLogout}><LogOut size={20} /></button></div>
            ) : (
              <button onClick={() => setShowLogin(true)} className="flex gap-2 px-4 py-2 bg-emerald-700 text-white rounded-full font-bold text-sm"><LogIn size={16} /> Acceso</button>
            )}
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex-grow w-full animate-fade-in">

        {view === 'home' && (
          <div className="space-y-8">
            <div className="relative h-64 md:h-[400px] rounded-2xl overflow-hidden shadow-xl">
              {carouselImages.map((img, i) => (<img key={i} src={img} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === currentSlide ? 'opacity-100' : 'opacity-0'}`} />))}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 flex items-end p-10"><h2 className="text-4xl font-bold text-white">Innovación <span className="text-emerald-400">UTE</span></h2></div>
            </div>

            {pinnedPosts.length > 0 && (
              <div className="grid md:grid-cols-2 gap-6">
                {pinnedPosts.map(p => (
                  <div key={p.id} className="bg-white border-l-4 border-yellow-400 p-6 rounded shadow-sm">
                    <div className="flex justify-between mb-2"><span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 rounded">{p.career}</span><Star size={16} className="text-yellow-500 fill-yellow-500" /></div>
                    <h4 className="font-bold text-lg">{p.title}</h4><p className="text-sm text-gray-600 mt-2">{p.content}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="grid gap-4">
              <h3 className="font-bold text-xl border-b pb-2">Noticias</h3>
              {regularPosts.map(p => (
                <div key={p.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                  <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center"><ImageIcon className="text-gray-400" /></div>
                  <div><div className="text-xs text-gray-400 mb-1">{p.date} • {p.career}</div><h4 className="font-bold">{p.title}</h4><p className="text-gray-600 text-sm">{p.content}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'transport' && (
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Bus className="text-emerald-600" /> Transporte en Vivo</h2>
            {user ? <TransportMap user={user} isAdmin={user.role === 'admin'} isDriver={user.role === 'chofer'} /> :
              <div className="text-center p-12 border-2 border-dashed rounded-xl"><Lock className="mx-auto mb-4 text-gray-400" /><h3 className="font-bold">Requiere Acceso</h3><button onClick={() => setShowLogin(true)} className="mt-4 text-emerald-600 font-bold underline">Iniciar Sesión</button></div>}
          </div>
        )}

        {view === 'gallery' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <img key={i} src={`https://picsum.photos/seed/${i + 10}/400/400`} className="rounded-lg shadow cursor-pointer hover:scale-105 transition" onClick={() => setLightboxImg(`https://picsum.photos/seed/${i + 10}/800/800`)} />)}
          </div>
        )}

        {view === 'admin' && user?.role === 'admin' && (
          <div className="bg-white p-6 rounded-xl shadow border">
            <h3 className="font-bold text-lg mb-4 flex gap-2"><Plus /> Nueva Publicación</h3>
            <div className="space-y-3">
              <input className="w-full p-2 border rounded" placeholder="Título" value={newPost.title} onChange={e => setNewPost({ ...newPost, title: e.target.value })} />
              <select className="w-full p-2 border rounded" value={newPost.career} onChange={e => setNewPost({ ...newPost, career: e.target.value })}>
                <option value="General">General</option>{careers.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <textarea className="w-full p-2 border rounded h-24" placeholder="Contenido" value={newPost.content} onChange={e => setNewPost({ ...newPost, content: e.target.value })} />
              <label className="flex gap-2 items-center"><input type="checkbox" checked={newPost.important} onChange={e => setNewPost({ ...newPost, important: e.target.checked })} /> Destacar</label>
              <button onClick={handleCreatePost} className="bg-emerald-600 text-white px-6 py-2 rounded font-bold hover:bg-emerald-700">Publicar</button>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-emerald-900 text-emerald-100 py-8 text-center mt-auto border-t-8 border-emerald-600">
        <p>© 2025 Universidad Tecnológica (Modular Version)</p>
      </footer>
    </div>
  );
}