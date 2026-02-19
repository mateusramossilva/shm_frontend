"use client";
import React, { useState, useMemo } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    dadosContas: any[];
}

export default function OmieSyncModal({ isOpen, onClose, dadosContas }: Props) {
    const [etapa, setEtapa] = useState<'CONFIRM' | 'RUN' | 'REPORT'>('CONFIRM');
    const [progresso, setProgresso] = useState(0);
    const [logs, setLogs] = useState<any[]>([]);
    const [naoCadastrados, setNaoCadastrados] = useState<any[]>([]);

    const dataEnvio = useMemo(() => new Date().toLocaleDateString('pt-BR'), []);

    if (!isOpen) return null;

    const iniciarProcesso = async () => {
        setEtapa('RUN');
        try {
            // 1. Prepara os dados usando o seu Controller (Separa Prontos de Ignorados)
            const prep = await axios.post(`${API_URL}/automation/preparar-dados`, { contas: dadosContas });
            const listaParaEnviar = prep.data.prontos;
            setNaoCadastrados(prep.data.ignorados); // Aqui entram os CPFs que não existem na Omie

            // 2. Envio Individual
            for (let i = 0; i < listaParaEnviar.length; i++) {
                const item = listaParaEnviar[i];
                if (i > 0) await new Promise(r => setTimeout(r, 1200));

                try {
                    const res = await axios.post(`${API_URL}/automation/incluir-individual`, item);
                    setLogs(prev => [...prev, { ...item, status: 'sucesso', idOmie: res.data.codigo_lancamento_omie }]);
                } catch (err: any) {
                    const msg = err.response?.data?.message || err.message;
                    setLogs(prev => [...prev, { ...item, status: 'erro', msg }]);
                }
                setProgresso(i + 1);
            }
            setEtapa('REPORT');
        } catch (e) {
            alert("Erro na comunicação com a API.");
            onClose();
        }
    };

    const exportarRelatorio = () => {
        const data = [
            ...logs.map(l => ({ CPF: l.cpf, STATUS: l.status.toUpperCase(), DETALHE: l.idOmie || l.msg })),
            ...naoCadastrados.map(n => ({ CPF: n.cpf, STATUS: 'NÃO ENCONTRADO NA OMIE', DETALHE: 'Cadastrar na Omie' }))
        ];
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Relatorio");
        XLSX.writeFile(wb, `Relatorio_Omie_${dataEnvio.replace(/\//g, '-')}.xlsx`);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 font-sans text-slate-900">
            <div className="bg-white w-full max-w-6xl rounded-lg shadow-2xl flex flex-col h-[75vh] border border-slate-200 overflow-hidden">

                {/* HEADER */}
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-xs font-black uppercase tracking-tight flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-[#0052FF]"></span>
                            Sincronização Omie - {dataEnvio}
                        </h2>
                    </div>
                    {etapa === 'REPORT' && (
                        <div className="flex gap-2">
                            <button onClick={exportarRelatorio} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-black uppercase transition-all">Exportar Relatório</button>
                            <button onClick={onClose} className="px-4 py-1.5 bg-slate-800 text-white rounded text-[10px] font-black uppercase">Fechar</button>
                        </div>
                    )}
                </div>

                {/* CONTEÚDO */}
                <div className="flex-1 overflow-hidden p-6 bg-white">
                    {etapa === 'CONFIRM' && (
                        <div className="h-full flex flex-col items-center justify-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-4">Registros Identificados: {dadosContas.length}</p>
                            <button onClick={iniciarProcesso} className="px-10 py-3 bg-[#0052FF] text-white rounded font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all">Iniciar Transmissão</button>
                        </div>
                    )}

                    {etapa === 'RUN' && (
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="w-full max-w-xs text-center">
                                <span className="text-[10px] font-black uppercase text-slate-400 block mb-2">{progresso} de {dadosContas.length} processados</span>
                                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#0052FF] transition-all duration-300" style={{ width: `${(progresso / (dadosContas.length || 1)) * 100}%` }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {etapa === 'REPORT' && (
                        <div className="h-full grid grid-cols-4 gap-4">
                            {/* COLUNA: SUCESSOS */}
                            <div className="flex flex-col border border-slate-100 rounded bg-slate-50/30">
                                <div className="p-2 border-b border-slate-200 bg-white flex justify-between items-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Sucessos</span>
                                    <span className="text-[10px] font-bold text-emerald-600">{logs.filter(l => l.status === 'sucesso').length}</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                    {logs.filter(l => l.status === 'sucesso').map((l, i) => (
                                        <div key={i} className="bg-white p-2 border border-slate-100 rounded text-[10px] font-bold">{l.cpf}</div>
                                    ))}
                                </div>
                            </div>

                            {/* COLUNA: INATIVOS */}
                            <div className="flex flex-col border border-slate-100 rounded bg-slate-50/30">
                                <div className="p-2 border-b border-slate-200 bg-white flex justify-between items-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Inativos</span>
                                    <span className="text-[10px] font-bold text-red-600">{logs.filter(l => l.status === 'erro' && l.msg.toLowerCase().includes('inativo')).length}</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                    {logs.filter(l => l.status === 'erro' && l.msg.toLowerCase().includes('inativo')).map((l, i) => (
                                        <div key={i} className="bg-white p-2 border border-red-50 rounded text-[10px] font-bold text-red-600">{l.cpf}</div>
                                    ))}
                                </div>
                            </div>

                            {/* COLUNA: NÃO ENCONTRADOS (CPFs fora da Omie) */}
                            <div className="flex flex-col border border-slate-100 rounded bg-slate-50/30">
                                <div className="p-2 border-b border-slate-200 bg-white flex justify-between items-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Não Encontrados</span>
                                    <span className="text-[10px] font-bold text-amber-600">{naoCadastrados.length}</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                    {naoCadastrados.map((l, i) => (
                                        <div key={i} className="bg-white p-2 border border-amber-50 rounded text-[10px] font-bold text-amber-600">{l.cpf}</div>
                                    ))}
                                </div>
                            </div>

                            {/* COLUNA: ERROS API */}
                            <div className="flex flex-col border border-slate-100 rounded bg-slate-50/30">
                                <div className="p-2 border-b border-slate-200 bg-white flex justify-between items-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Erros API</span>
                                    <span className="text-[10px] font-bold text-slate-500">{logs.filter(l => l.status === 'erro' && !l.msg.toLowerCase().includes('inativo')).length}</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                    {logs.filter(l => l.status === 'erro' && !l.msg.toLowerCase().includes('inativo')).map((l, i) => (
                                        <div key={i} className="bg-white p-2 border border-slate-100 rounded text-[9px] text-slate-400 italic truncate">{l.msg}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Aleevia Tecnologia &copy; 2026</p>
                </div>
            </div>
        </div>
    );
}