import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-slate-900 text-slate-400 py-12 border-t-4 border-emerald-600 text-sm mt-auto">
            <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-8">
                <div className="col-span-2">
                    <h4 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-800 rounded flex items-center justify-center text-white text-xs">U</div>
                        UTE Escobedo
                    </h4>
                    <p className="opacity-70 leading-relaxed max-w-sm">
                        Comprometidos con la excelencia académica y el desarrollo tecnológico de nuestra comunidad estudiantil en Nuevo León.
                    </p>
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