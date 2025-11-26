import React from 'react';
import { Facebook, Instagram, Video } from 'lucide-react'; // Usamos Video como placeholder para TikTok si no está el icono específico

const Footer = () => {
    return (
        <footer className="bg-slate-900 text-slate-400 py-12 border-t-4 border-emerald-600 text-sm mt-auto">
            <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-8">
                <div className="col-span-2">
                    <h4 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-800 rounded flex items-center justify-center text-white text-xs shadow-lg">U</div>
                        UTE Escobedo
                    </h4>
                    <p className="opacity-70 leading-relaxed max-w-sm mb-6">
                        Comprometidos con la excelencia académica y el desarrollo tecnológico de nuestra comunidad estudiantil en Nuevo León.
                    </p>
                    {/* REDES SOCIALES */}
                    <div className="flex gap-3">
                        <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition shadow-lg hover:scale-110"><Facebook size={20} /></a>
                        <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-pink-600 text-white flex items-center justify-center hover:bg-pink-700 transition shadow-lg hover:scale-110"><Instagram size={20} /></a>
                        <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-black text-white border border-gray-700 flex items-center justify-center hover:bg-gray-800 transition shadow-lg hover:scale-110"><Video size={20} /></a>
                    </div>
                </div>

                <div>
                    <h5 className="text-white font-bold mb-4 uppercase tracking-widest text-xs border-b border-slate-700 pb-2 inline-block">Institucional</h5>
                    <ul className="space-y-2">
                        <li><a href="#" className="hover:text-emerald-400 transition hover:translate-x-1 inline-block">Aviso de Privacidad</a></li>
                        <li><a href="#" className="hover:text-emerald-400 transition hover:translate-x-1 inline-block">Transparencia</a></li>
                        <li><a href="#" className="hover:text-emerald-400 transition hover:translate-x-1 inline-block">Reglamento Escolar</a></li>
                    </ul>
                </div>

                <div>
                    <h5 className="text-white font-bold mb-4 uppercase tracking-widest text-xs border-b border-slate-700 pb-2 inline-block">Contacto</h5>
                    <p>Sabinas Hidalgo, NL.</p>
                    <p className="mt-2">Tel: (81) 8242 5500</p>
                    <p>contacto@ute.edu.mx</p>
                </div>
            </div>
            <div className="text-center mt-12 pt-8 border-t border-slate-800 opacity-50 text-xs">
                © 2025 Plataforma UTE. Todos los derechos reservados.
            </div>
        </footer>
    );
};

export default Footer;