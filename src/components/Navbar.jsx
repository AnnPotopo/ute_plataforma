import React from 'react';
import { Bus, LogOut, LogIn } from 'lucide-react';

const Navbar = ({ user, view, setView, setShowLogin, handleLogout }) => {
    const menuItems = [
        { id: 'home', label: 'Inicio' },
        { id: 'academic', label: 'Oferta' },
        { id: 'gallery', label: 'Galería' },
        { id: 'transport', label: 'Transporte', icon: Bus }
    ];

    return (
        <nav className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-[500] border-b-4 border-emerald-600">
            <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">

                {/* LOGO */}
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('home')}>
                    <div className="w-10 h-10 bg-emerald-800 rounded-lg text-white flex items-center justify-center font-bold shadow-lg transform group-hover:scale-105 transition">UTE</div>
                    <div>
                        <div className="font-extrabold text-emerald-900 leading-none text-lg">UTE</div>
                        <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Escobedo</div>
                    </div>
                </div>

                {/* MENU CENTRAL */}
                <div className="hidden md:flex gap-1">
                    {menuItems.map(i => (
                        <button
                            key={i.id}
                            onClick={() => setView(i.id)}
                            className={`px-4 py-2 rounded-lg flex gap-2 text-sm font-bold transition ${view === i.id ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'text-gray-500 hover:text-emerald-600 hover:bg-gray-50'}`}
                        >
                            {i.icon && <i.icon size={16} />} {i.label}
                        </button>
                    ))}
                    {user?.role === 'admin' && (
                        <button onClick={() => setView('admin')} className={`ml-2 px-4 py-2 rounded-lg text-sm font-bold shadow transition ${view === 'admin' ? 'bg-slate-800 text-white' : 'bg-white text-slate-800 border hover:bg-slate-50'}`}>
                            Admin
                        </button>
                    )}
                </div>

                {/* USER ACTIONS */}
                <div className="flex gap-4 items-center">
                    {user ? (
                        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                            <div className="text-right hidden sm:block">
                                <div className="text-xs font-bold text-gray-800">{user.name}</div>
                                <div className="text-[10px] text-emerald-600 font-bold uppercase">{user.role}</div>
                            </div>
                            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition" title="Cerrar Sesión">
                                <LogOut size={20} />
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setShowLogin(true)} className="bg-emerald-700 text-white px-6 py-2 rounded-full font-bold text-sm shadow hover:bg-emerald-800 transition transform hover:-translate-y-0.5 flex items-center gap-2">
                            <LogIn size={16} /> Acceso
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;