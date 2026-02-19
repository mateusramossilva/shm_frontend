"use client";
import React from 'react';
import * as XLSX from 'xlsx';

export default function OmieSyncReport({ etapa, progresso, total, logs, naoCadastrados }: any) {
    const exportarExcel = () => {
        const data = [
            ...logs.map((l: any) => ({ CPF: l.cpf, STATUS: l.status.toUpperCase(), DETALHE: l.idOmie || l.msg })),
            ...naoCadastrados.map((n: any) => ({ CPF: n.cpf, STATUS: 'NÃO ENCONTRADO' }))
        ];
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Logs");
        XLSX.writeFile(wb, `Relatorio_Omie_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
    };

    return (
        <div className="mt-10 border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Monitor de Transmissão - {new Date().toLocaleDateString()}</h3>
                {etapa === 'REPORT' && <button onClick={exportarExcel} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase transition-all hover:bg-emerald-700">Exportar Logs</button>}
            </div>

            <div className="p-6">
                {etapa === 'RUN' && (
                    <div className="mb-8 max-w-md mx-auto text-center">
                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-2">Sincronizando: {progresso} de {total}</span>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-[#0052FF] transition-all duration-300" style={{ width: `${(progresso / (total || 1)) * 100}%` }} />
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-4 gap-4 h-[450px]">
                    {/* SUCESSOS */}
                    <div className="flex flex-col border border-slate-100 rounded bg-slate-50/30">
                        <div className="p-2 border-b border-slate-200 bg-white flex justify-between items-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase">Sucessos</span>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 rounded-full">{logs.filter((l: any) => l.status === 'sucesso').length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {logs.filter((l: any) => l.status === 'sucesso').map((l: any, i: number) => (
                                <div key={i} className="bg-white p-2 border border-slate-100 rounded text-[10px] font-bold text-slate-700">{l.cpf} <span className="block text-[8px] text-emerald-500">ID: {l.idOmie}</span></div>
                            ))}
                        </div>
                    </div>

                    {/* INATIVOS */}
                    <div className="flex flex-col border border-slate-100 rounded bg-slate-50/30">
                        <div className="p-2 border-b border-slate-200 bg-white flex justify-between items-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase">Inativos</span>
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 rounded-full">{logs.filter((l: any) => l.status === 'erro' && l.msg.toLowerCase().includes('inativo')).length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {logs.filter((l: any) => l.status === 'erro' && l.msg.toLowerCase().includes('inativo')).map((l: any, i: number) => (
                                <div key={i} className="bg-white p-2 border border-red-50 rounded text-[10px] font-bold text-red-700">{l.cpf}</div>
                            ))}
                        </div>
                    </div>

                    {/* NÃO ENCONTRADOS */}
                    <div className="flex flex-col border border-slate-100 rounded bg-slate-50/30">
                        <div className="p-2 border-b border-slate-200 bg-white flex justify-between items-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase">Não Encontrados</span>
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 rounded-full">{naoCadastrados.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {naoCadastrados.map((n: any, i: number) => (
                                <div key={i} className="bg-white p-2 border border-amber-50 rounded text-[10px] font-bold text-amber-700">{n.cpf}</div>
                            ))}
                        </div>
                    </div>

                    {/* ERROS API */}
                    <div className="flex flex-col border border-slate-100 rounded bg-slate-50/30">
                        <div className="p-2 border-b border-slate-200 bg-white flex justify-between items-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase">Erros API</span>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 rounded-full">{logs.filter((l: any) => l.status === 'erro' && !l.msg.toLowerCase().includes('inativo')).length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {logs.filter((l: any) => l.status === 'erro' && !l.msg.toLowerCase().includes('inativo')).map((l: any, i: number) => (
                                <div key={i} className="bg-white p-2 border border-slate-100 rounded text-[9px] text-slate-400 italic truncate" title={l.msg}>{l.msg}</div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}