import React, { useState } from 'react';
import { Bus, LogOut, LogIn, FolderGit2, LayoutDashboard, Menu, X } from 'lucide-react';

const Navbar = ({ user, view, setView, setShowLogin, handleLogout }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const menuItems = [
        { id: 'home', label: 'Inicio' },
        { id: 'academic', label: 'Oferta' },
        { id: 'gallery', label: 'Galería' },
        { id: 'transport', label: 'Transporte', icon: Bus }
    ];

    // Si hay usuario, añadimos Repositorios al menú
    if (user) {
        menuItems.splice(2, 0, { id: 'repositories', label: 'Repositorios', icon: FolderGit2 });
    }

    const handleNavClick = (id) => {
        setView(id);
        setIsMobileMenuOpen(false); // Cierra el menú al seleccionar
    };

    return (
        <nav className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-[500] border-b-4 border-emerald-600">
            <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">

                {/* LOGO */}
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleNavClick('home')}>
                    <div className="w-10 h-10 bg-emerald-800 rounded-lg text-white flex items-center justify-center font-bold shadow-lg transform group-hover:scale-105 transition">UTE</div>
                    <div>
                        <div className="font-extrabold text-emerald-900 leading-none text-lg">UTE</div>
                        <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Escobedo</div>
                    </div>
                </div>

                {/* MENU ESCRITORIO (Oculto en móvil) */}
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

                    {(user?.role === 'admin' || user?.role === 'profesor') && (
                        <button onClick={() => setView('admin')} className={`ml-2 px-4 py-2 rounded-lg text-sm font-bold shadow transition flex items-center gap-2 ${view === 'admin' ? 'bg-slate-800 text-white' : 'bg-white text-slate-800 border hover:bg-slate-50'}`}>
                            <LayoutDashboard size={16} /> {user.role === 'admin' ? 'Admin' : 'Panel Docente'}
                        </button>
                    )}
                </div>

                {/* USER ACTIONS (Escritorio) */}
                <div className="hidden md:flex gap-4 items-center">
                    {user ? (
                        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                            <div className="text-right">
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

                {/* BOTÓN HAMBURGUESA (Visible solo en Móvil) */}
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition">
                    {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* MENU MÓVIL (Desplegable) */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 absolute w-full left-0 top-20 shadow-xl animate-fade-in p-4 flex flex-col gap-2 h-[calc(100vh-80px)] overflow-y-auto">
                    {menuItems.map(i => (
                        <button
                            key={i.id}
                            onClick={() => handleNavClick(i.id)}
                            className={`p-4 rounded-xl flex items-center gap-4 text-base font-bold transition ${view === i.id ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            {i.icon && <i.icon size={20} />} {i.label}
                        </button>
                    ))}

                    <div className="border-t my-2 border-gray-100"></div>

                    {user ? (
                        <div className="space-y-3">
                            <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                                <div>
                                    <div className="text-sm font-bold text-gray-800">{user.name}</div>
                                    <div className="text-xs text-emerald-600 font-bold uppercase">{user.role}</div>
                                </div>
                                <button onClick={handleLogout} className="text-red-500 bg-white p-2 rounded-lg shadow-sm border border-gray-100"><LogOut size={20} /></button>
                            </div>
                            {(user.role === 'admin' || user.role === 'profesor') && (
                                <button onClick={() => handleNavClick('admin')} className="w-full p-4 rounded-xl bg-slate-800 text-white text-base font-bold flex items-center justify-center gap-2 shadow-lg">
                                    <LayoutDashboard size={20} /> {user.role === 'admin' ? 'Panel de Administración' : 'Panel Docente'}
                                </button>
                            )}
                        </div>
                    ) : (
                        <button onClick={() => { setShowLogin(true); setIsMobileMenuOpen(false); }} className="w-full p-4 rounded-xl bg-emerald-700 text-white text-base font-bold flex items-center justify-center gap-2 shadow-lg mt-2">
                            <LogIn size={20} /> Iniciar Sesión
                        </button>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;