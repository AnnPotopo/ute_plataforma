import React, { useState } from 'react';
import { FolderGit2, Github, User, Calendar, ArrowLeft, FileText, Layers, AlertTriangle, Lightbulb, ExternalLink, Users } from 'lucide-react';

const Repositories = ({ repoPosts, careers }) => {
    const [selectedRepo, setSelectedRepo] = useState(null);
    const [filterCareer, setFilterCareer] = useState('Todas');

    // Filtro inteligente: Busca si la carrera está en ALGUNA de las contribuciones del proyecto
    const displayedRepos = filterCareer === 'Todas'
        ? repoPosts
        : repoPosts.filter(repo => repo.contributions?.some(c => c.career === filterCareer));

    // VISTA DETALLE
    if (selectedRepo) {
        return (
            <div className="animate-fade-in space-y-8">
                <button onClick={() => setSelectedRepo(null)} className="flex items-center gap-2 text-gray-500 hover:text-emerald-700 font-bold mb-4">
                    <ArrowLeft size={18} /> Volver al Repositorio
                </button>

                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    {/* Encabezado */}
                    <div className="bg-slate-900 text-white p-8 md:p-12 relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex flex-wrap gap-2 mb-4">
                                {selectedRepo.contributions?.map((c, i) => (
                                    <span key={i} className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                        {c.career}
                                    </span>
                                ))}
                            </div>
                            <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">{selectedRepo.title}</h1>
                            <div className="flex items-center gap-4 text-slate-400 text-sm">
                                <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(selectedRepo.createdAt).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1"><User size={14} /> Publicado por: {selectedRepo.author}</span>
                            </div>
                        </div>
                        <FolderGit2 className="absolute -bottom-12 -right-12 text-slate-800 w-64 h-64 opacity-50" />
                    </div>

                    <div className="p-8 md:p-12 grid lg:grid-cols-3 gap-12">
                        {/* Columna Principal */}
                        <div className="lg:col-span-2 space-y-10">

                            <section>
                                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText className="text-emerald-600" /> Objetivo del Proyecto</h3>
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {selectedRepo.objective || "Sin objetivo definido."}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Layers className="text-blue-600" /> Desglose por Carrera</h3>
                                <div className="space-y-6">
                                    {selectedRepo.contributions?.map((contrib, idx) => (
                                        <div key={idx} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">
                                            <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                                                <h4 className="font-bold text-slate-700">{contrib.career}</h4>
                                                <span className="text-xs bg-white border px-3 py-1 rounded-full text-gray-500 font-mono">Grupo: {contrib.group}</span>
                                            </div>
                                            <div className="p-6 space-y-4">
                                                <div>
                                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Responsable</div>
                                                    <div className="flex items-center gap-2 text-slate-800"><Users size={16} /> {contrib.supervisor}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Tareas Realizadas</div>
                                                    <p className="text-sm text-gray-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-100">{contrib.tasks}</p>
                                                </div>
                                                {contrib.comments && (
                                                    <div>
                                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Comentarios</div>
                                                        <p className="text-sm text-gray-500 italic">"{contrib.comments}"</p>
                                                    </div>
                                                )}
                                                {contrib.docUrl && (
                                                    <div className="pt-2">
                                                        <a href={contrib.docUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-bold hover:underline">
                                                            <ExternalLink size={14} /> Ver Documentación / Evidencia
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Sidebar Lateral */}
                        <div className="space-y-8">
                            <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-100">
                                <h3 className="font-bold text-yellow-800 mb-3 flex items-center gap-2"><AlertTriangle size={18} /> Problemas Enfrentados</h3>
                                <p className="text-sm text-yellow-900/80 leading-relaxed whitespace-pre-wrap">{selectedRepo.problems || "No reportados."}</p>
                            </div>

                            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                                <h3 className="font-bold text-emerald-800 mb-3 flex items-center gap-2"><Lightbulb size={18} /> Mejoras Futuras</h3>
                                <p className="text-sm text-emerald-900/80 leading-relaxed whitespace-pre-wrap">{selectedRepo.improvements || "No especificadas."}</p>
                            </div>

                            {selectedRepo.gitUrl && (
                                <a href={selectedRepo.gitUrl} target="_blank" rel="noreferrer" className="block w-full bg-slate-900 text-white text-center py-4 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg flex items-center justify-center gap-2">
                                    <Github size={20} /> Repositorio General
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // VISTA LISTA (GRID)
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center border-b border-slate-200 pb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2"><FolderGit2 className="text-blue-600" /> Repositorio Institucional</h2>
                    <p className="text-gray-500 mt-1">Base de conocimiento y proyectos multidisciplinarios.</p>
                </div>
                <select className="border-2 border-gray-200 rounded-lg p-2 bg-white font-bold text-gray-600 hover:border-blue-400 transition outline-none" value={filterCareer} onChange={e => setFilterCareer(e.target.value)}>
                    <option value="Todas">Todas las Carreras</option>
                    {careers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {displayedRepos.map(r => (
                    <div key={r.id} onClick={() => setSelectedRepo(r)} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition cursor-pointer group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-blue-500 group-hover:w-full group-hover:opacity-5 transition-all duration-500"></div>

                        <div className="relative z-10">
                            <div className="flex flex-wrap gap-2 mb-4">
                                {r.contributions?.slice(0, 2).map((c, i) => (
                                    <span key={i} className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded uppercase">{c.career}</span>
                                ))}
                                {(r.contributions?.length > 2) && <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded">+{(r.contributions.length - 2)}</span>}
                            </div>

                            <h4 className="font-bold text-xl text-slate-900 mb-3 group-hover:text-blue-700 transition">{r.title}</h4>
                            <p className="text-gray-500 text-sm line-clamp-2 mb-4">{r.objective || "Sin descripción corta."}</p>

                            <div className="flex justify-between items-center pt-4 border-t border-gray-50 text-xs text-gray-400 font-medium">
                                <span>Autor: {r.author}</span>
                                <span className="flex items-center gap-1 text-blue-600 font-bold group-hover:translate-x-1 transition">Ver Proyecto <ArrowLeft size={12} className="rotate-180" /></span>
                            </div>
                        </div>
                    </div>
                ))}
                {displayedRepos.length === 0 && <div className="col-span-2 text-center py-12 text-gray-400 italic bg-slate-50 rounded-2xl border border-dashed">No se encontraron proyectos con los filtros seleccionados.</div>}
            </div>
        </div>
    );
};

export default Repositories;