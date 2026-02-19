'use client'
import { useState, useRef, useEffect } from 'react'
import * as XLSX from 'xlsx'
import axios from 'axios'

// --- PUXA A URL DA NUVEM OU USA O LOCALHOST ---
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export default function ExecutarPage() {
    const [mounted, setMounted] = useState(false)
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<'IDLE' | 'SYNCING' | 'PAUSED' | 'CANCELLED' | 'REPORT'>('IDLE')
    const [datesConfirmed, setDatesConfirmed] = useState(false)
    const [isProcessed, setIsProcessed] = useState(false)
    const [processedBlob, setProcessedBlob] = useState<Blob | null>(null)
    const [jsonData, setJsonData] = useState<any[]>([])

    const [progresso, setProgresso] = useState(0)
    const [logs, setLogs] = useState<any[]>([])
    const [naoCadastrados, setNaoCadastrados] = useState<any[]>([])

    const [modal, setModal] = useState({
        open: false, title: '', message: '', type: 'error' as 'error' | 'success' | 'confirm', onConfirm: null as (() => void) | null
    })

    const isPausedRef = useRef(false);
    const isCancelledRef = useRef(false);

    const fileInputOmie = useRef<HTMLInputElement>(null)
    const fileInputDoctor = useRef<HTMLInputElement>(null)

    const [dates, setDates] = useState({ emissao: '', registro: '', vencimento: '', previsao: '' })
    const [files, setFiles] = useState({ omie: null as File | null, doctor: null as File | null })

    useEffect(() => { setMounted(true) }, [])

    const dicionarioDatas = {
        emissao: "Data em que o documento original foi emitido pelo prestador.",
        registro: "Data de entrada do título no sistema financeiro.",
        vencimento: "Data limite para pagamento sem incidência de juros.",
        previsao: "Data planejada para o desembolso (fluxo de caixa)."
    };

    const closeModal = () => setModal({ ...modal, open: false })
    const showModal = (title: string, message: string, type: 'error' | 'success' = 'error') => setModal({ open: true, title, message, type, onConfirm: null })
    const showConfirm = (title: string, message: string, onConfirm: () => void) => setModal({ open: true, title, message, type: 'confirm', onConfirm })

    const handleReset = () => {
        isCancelledRef.current = false;
        isPausedRef.current = false;
        setFiles({ omie: null, doctor: null });
        setDates({ emissao: '', registro: '', vencimento: '', previsao: '' });
        setDatesConfirmed(false);
        setIsProcessed(false);
        setStatus('IDLE');
        setProgresso(0);
        setLogs([]);
        setNaoCadastrados([]);
    }

    const exportarRelatorio = () => {
        const dataProc = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
        const rows = [
            ...logs.map(l => ({ CPF: l.cpf, STATUS: l.status.toUpperCase(), DETALHE: l.idOmie || l.msg })),
            ...naoCadastrados.map(n => ({ CPF: n.cpf, STATUS: 'NÃO ENCONTRADO NA OMIE' }))
        ];
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Logs_Sincronia");
        XLSX.writeFile(wb, `Relatorio_Omie_${dataProc}.xlsx`);
    };

    const handleSync = async () => {
        setStatus('SYNCING');
        isCancelledRef.current = false;
        isPausedRef.current = false;

        try {
            // USO DA CONSTANTE API_URL
            const prep = await axios.post(`${API_URL}/automation/preparar-dados`, { contas: jsonData });
            setNaoCadastrados(prep.data.ignorados);
            const lista = prep.data.prontos;

            for (let i = progresso; i < lista.length; i++) {
                if (isCancelledRef.current) { setStatus('CANCELLED'); return; }
                while (isPausedRef.current && !isCancelledRef.current) { await new Promise(r => setTimeout(r, 500)); }

                const item = lista[i];
                if (i > 0) await new Promise(r => setTimeout(r, 1200));

                try {
                    // USO DA CONSTANTE API_URL
                    const res = await axios.post(`${API_URL}/automation/incluir-individual`, item);
                    setLogs(p => [...p, { ...item, status: 'sucesso', idOmie: res.data.codigo_lancamento_omie }]);
                } catch (err: any) {
                    const msg = err.response?.data?.message || err.message;
                    setLogs(p => [...p, { ...item, status: 'erro', msg }]);
                }
                setProgresso(i + 1);
            }
            setStatus('REPORT');
        } catch (e) { showModal("Erro de Conexão", "Não foi possível sincronizar. Verifique o servidor.", 'error'); setStatus('IDLE'); }
    };

    const handleProcess = async () => {
        if (!dates.emissao || !dates.registro || !dates.vencimento || !dates.previsao) {
            showModal("Datas Incompletas", "Todas as 4 datas (Emissão, Registro, Vencimento, Previsão) são obrigatórias.", 'error');
            return;
        }
        if (dates.registro < dates.emissao) {
            showModal("Inconsistência Cronológica", "A Data de Registro não pode ser anterior à Data de Emissão.", 'error');
            return;
        }

        setLoading(true)
        try {
            const formData = new FormData();
            formData.append('omie', files.omie!);
            formData.append('doctor', files.doctor!);
            formData.append('datas', JSON.stringify(dates));

            // USO DA CONSTANTE API_URL
            const response = await fetch(`${API_URL}/automation/processar`, { method: 'POST', body: formData });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Erro no processamento');
            }

            const blob = await response.blob();
            setProcessedBlob(blob);
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const ws = workbook.Sheets[workbook.SheetNames[0]];
                const matriz = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
                const extraidos = [];
                for (let i = 5; i < matriz.length; i++) {
                    const r = matriz[i];
                    if (!r || !r[2]) continue;
                    extraidos.push({ cod_cliente: r[2], medico_nome: r[3], valor: r[5], categoria: r[7], banco: r[4], data_vencimento: dates.vencimento });
                }
                setJsonData(extraidos);
                setIsProcessed(true);
                setLoading(false);
            };
            reader.readAsArrayBuffer(blob);
        } catch (e: any) {
            setLoading(false);
            showModal("Erro no Processamento", e.message, 'error');
        }
    }

    if (!mounted) return null;

    return (
        <div className="max-w-6xl mx-auto py-12 px-8 font-sans text-slate-900 bg-[#F9FBFF] min-h-screen relative">

            {/* Modal */}
            {modal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 border border-slate-100 animate-in zoom-in-95 duration-200">
                        <div className="mb-6">
                            {modal.type === 'error' && <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-2xl">🚨</div>}
                            {modal.type === 'success' && <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">✅</div>}
                            {modal.type === 'confirm' && <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-2xl">⚠️</div>}
                        </div>
                        <h3 className={`text-lg font-black uppercase tracking-tight mb-2 ${modal.type === 'error' ? 'text-red-600' : modal.type === 'success' ? 'text-emerald-600' : 'text-slate-800'}`}>
                            {modal.title}
                        </h3>
                        <p className="text-sm font-bold text-slate-500 mb-8 leading-relaxed">{modal.message}</p>
                        <div className="flex gap-3">
                            {modal.type === 'confirm' ? (
                                <>
                                    <button onClick={closeModal} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                                    <button onClick={() => { modal.onConfirm && modal.onConfirm(); closeModal(); }} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-100">Confirmar</button>
                                </>
                            ) : (
                                <button onClick={closeModal} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-lg">Entendido</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800">AUTOMAÇÃO <span className="text-[#0052FF]">SHM</span></h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Backoffice Core v5.0</p>
                </div>
                {status !== 'IDLE' && <button onClick={handleReset} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-400 hover:text-red-500 uppercase transition-all">↺ Reiniciar Sistema</button>}
            </div>

            {status === 'IDLE' && (
                <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-12 lg:col-span-7 space-y-4">
                        <div onClick={() => !isProcessed && fileInputOmie.current?.click()} className={`p-8 border-2 rounded-2xl transition-all cursor-pointer ${files.omie ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-100 bg-white hover:border-[#0052FF]'}`}>
                            <input type="file" ref={fileInputOmie} className="hidden" onChange={(e) => setFiles({...files, omie: e.target.files?.[0] || null})} />
                            <div className="flex justify-between items-center">
                                <div><h3 className="text-sm font-bold uppercase">1. Template Omie</h3><p className="text-[11px] text-slate-400 mt-1">{files.omie ? files.omie.name : 'Vínculo obrigatório'}</p></div>
                                {files.omie && <div className="bg-emerald-500 text-white text-[10px] font-black px-4 py-2 rounded-lg text-white">OK</div>}
                            </div>
                        </div>

                        {files.omie && (
                            <div className={`p-8 border-2 rounded-2xl transition-all ${datesConfirmed ? 'border-emerald-500 bg-white' : 'border-slate-100 bg-slate-50'}`}>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-sm font-bold uppercase">2. Datas de Lançamento</h3>
                                    {datesConfirmed && <button onClick={() => setDatesConfirmed(false)} className="text-[9px] font-black text-[#0052FF] uppercase underline">Editar</button>}
                                </div>
                                <div className="grid grid-cols-4 gap-3">
                                    {Object.keys(dates).map(f => (
                                        <div key={f} className="group relative">
                                            <label className="text-[8px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1 cursor-help">
                                                {f} <span className="text-blue-500 text-[10px] italic">?</span>
                                                <span className="absolute bottom-full left-0 mb-2 w-40 p-2 bg-slate-800 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">{dicionarioDatas[f as keyof typeof dicionarioDatas]}</span>
                                            </label>
                                            <input type="date" disabled={datesConfirmed} value={dates[f as keyof typeof dates]} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none disabled:opacity-40" onChange={e => setDates({...dates, [f as keyof typeof dates]: e.target.value})} />
                                        </div>
                                    ))}
                                </div>
                                {!datesConfirmed && <button onClick={() => setDatesConfirmed(true)} className="mt-6 w-full py-3 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">Validar Calendário</button>}
                            </div>
                        )}

                        <div onClick={() => datesConfirmed && !isProcessed && fileInputDoctor.current?.click()} className={`p-8 border-2 rounded-2xl transition-all cursor-pointer ${datesConfirmed ? (files.doctor ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-100 bg-white hover:border-[#0052FF]') : 'opacity-20 pointer-events-none'}`}>
                            <input type="file" ref={fileInputDoctor} className="hidden" onChange={(e) => setFiles({...files, doctor: e.target.files?.[0] || null})} />
                            <div className="flex justify-between items-center">
                                <div><h3 className="text-sm font-bold uppercase">3. Relatório Doctor ID</h3><p className="text-[11px] text-slate-400 mt-1">{files.doctor ? files.doctor.name : 'Fonte de dados'}</p></div>
                                {files.doctor && <div className="bg-emerald-500 text-white text-[10px] font-black px-4 py-2 rounded-lg text-white">OK</div>}
                            </div>
                        </div>
                    </div>

                    <div className="col-span-12 lg:col-span-5">
                        <div className="bg-white border-2 border-slate-100 rounded-[3rem] p-10 h-full flex flex-col justify-between shadow-sm">
                            <div className="text-center">
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-12">Capacidade de Processamento</h4>
                                {isProcessed ? (
                                    <div className="animate-in zoom-in duration-500">
                                        <div className="text-7xl font-black text-[#0052FF] tracking-tighter mb-2">{jsonData.length}</div>
                                        <span className="text-[12px] font-black text-slate-800 uppercase tracking-widest">Registros Detectados</span>
                                        <div className="mt-6 h-1 w-20 bg-[#0052FF] mx-auto rounded-full"></div>
                                    </div>
                                ) : (
                                    <div className="py-10 grayscale opacity-40">
                                        <div className="text-7xl font-black text-slate-200 tracking-tighter mb-2">00</div>
                                        <p className="text-[10px] font-bold text-slate-300 uppercase italic">Aguardando Injeção</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                {!isProcessed ? (
                                    <button onClick={handleProcess} disabled={!files.doctor || loading} className="w-full py-7 bg-[#0052FF] text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl shadow-blue-100 disabled:bg-slate-100 transition-all">
                                        {loading ? 'Motor em Execução...' : 'Processar Lote'}
                                    </button>
                                ) : (
                                    <>
                                        <button onClick={() => { const url = window.URL.createObjectURL(processedBlob!); const a = document.createElement('a'); a.href = url; a.download = 'shm_final.xlsx'; a.click(); }} className="w-full py-5 bg-slate-800 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all">Baixar Excel Final</button>
                                        <button onClick={handleSync} className="w-full py-5 border-2 border-[#0052FF] text-[#0052FF] rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-[#0052FF] hover:text-white transition-all shadow-lg shadow-blue-50">Sincronizar com Omie</button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {(status !== 'IDLE') && (
                <div className="mt-4 border-2 border-slate-100 rounded-[2.5rem] bg-white overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="bg-slate-50 border-b border-slate-100 px-10 py-8 flex justify-between items-center">
                        <h3 className="text-sm font-black text-slate-800 uppercase italic">Monitor de Transmissão Omie</h3>
                        <div className="flex gap-3">
                            {(status === 'SYNCING' || status === 'PAUSED') && (
                                <>
                                    <button onClick={() => { isPausedRef.current = !isPausedRef.current; setStatus(isPausedRef.current ? 'PAUSED' : 'SYNCING'); }} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all shadow-md ${status === 'PAUSED' ? 'bg-amber-500 text-white' : 'bg-white border text-slate-600'}`}>{status === 'PAUSED' ? '▶ Continuar' : '⏸ Pausar'}</button>
                                    <button onClick={() => showConfirm("Cancelar Sincronização?", "Isso irá interromper o processo. As contas já enviadas permanecerão na Omie.", () => { isCancelledRef.current = true; })} className="px-6 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all">⏹ Cancelar</button>
                                </>
                            )}
                            {(status === 'REPORT' || status === 'CANCELLED') && <button onClick={exportarRelatorio} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-emerald-100">💾 Baixar Relatório</button>}
                        </div>
                    </div>
                    <div className="p-10">
                        {(status === 'SYNCING' || status === 'PAUSED') && (
                            <div className="mb-10 text-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{status === 'PAUSED' ? 'Operação Pausada' : 'Processando Lote Financeiro'}</span>
                                <div className="text-4xl font-black text-[#0052FF] mt-2 mb-4">{progresso} / {jsonData.length}</div>
                                <div className="max-w-md mx-auto bg-slate-100 h-1.5 rounded-full overflow-hidden"><div className={`h-full transition-all duration-300 ${status === 'PAUSED' ? 'bg-amber-400' : 'bg-[#0052FF]'}`} style={{ width: `${(progresso / (jsonData.length || 1)) * 100}%` }} /></div>
                            </div>
                        )}
                        {status === 'CANCELLED' && <div className="mb-10 p-4 bg-red-50 border-2 border-red-100 rounded-2xl text-red-700 text-xs font-black uppercase text-center">⚠ Processo cancelado.</div>}
                        <div className="grid grid-cols-4 gap-6 h-[480px]">
                            {[
                                { title: '✅ Sucessos', color: 'emerald', data: logs.filter(l => l.status === 'sucesso') },
                                { title: '⛔ Inativos', color: 'red', data: logs.filter(l => l.status === 'erro' && l.msg.toLowerCase().includes('inativo')) },
                                { title: '⚠️ Não Encontrados', color: 'amber', data: naoCadastrados },
                                { title: '❌ Erros API', color: 'slate', data: logs.filter(l => l.status === 'erro' && !l.msg.toLowerCase().includes('inativo')) }
                            ].map((col, idx) => (
                                <div key={idx} className="flex flex-col border border-slate-100 rounded-3xl bg-slate-50/40 overflow-hidden">
                                    <div className="p-4 bg-white border-b border-slate-100 flex justify-between items-center"><span className={`text-[10px] font-black uppercase text-${col.color}-600 tracking-widest`}>{col.title}</span><span className="text-[10px] font-bold text-slate-400">{col.data.length}</span></div>
                                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                        {col.data.map((item: any, i: number) => (
                                            <div key={i} className="bg-white p-3 border border-slate-100 rounded-xl shadow-sm hover:border-blue-200 transition-all"><div className="text-[11px] font-black text-slate-700">{item.cpf || 'LOG_ERROR'}</div>{item.idOmie && <div className="text-[8px] font-black text-emerald-500 mt-1 uppercase">API_ID: {item.idOmie}</div>}{item.msg && <div className="text-[8px] text-slate-400 mt-1 italic">{item.msg}</div>}</div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}