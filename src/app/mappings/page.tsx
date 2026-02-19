'use client'
import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export default function MapeamentoPage() {
    const [companies, setCompanies] = useState<any[]>([])
    const [escalas, setEscalas] = useState<any[]>([])
    const [selectedEmpresa, setSelectedEmpresa] = useState<string | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState<any>({})
    const [newRegra, setNewRegra] = useState({ origem: '', destino: '' })
    const [newComp, setNewComp] = useState('')

    // 1. CARREGA AS EMPRESAS (OFICIAIS + EXISTENTES NOS DADOS)
    useEffect(() => { carregarEmpresas() }, [])

    // 2. SELECIONA A PRIMEIRA AUTOMATICAMENTE (Se houver)
    useEffect(() => {
        if (companies.length > 0 && !selectedEmpresa) {
            setSelectedEmpresa(companies[0].name)
        }
    }, [companies])

    // 3. CARREGA ESCALAS QUANDO SELECIONA UMA EMPRESA
    useEffect(() => {
        if (selectedEmpresa) {
            carregarEscalas()
        } else {
            setEscalas([])
        }
    }, [selectedEmpresa])

    const carregarEmpresas = async () => {
        const res = await axios.get(`${API_URL}/automation/companies`)
        // O backend agora retorna [{name: 'SHM'}, {name: 'VITALLIS'}]
        setCompanies(res.data)
    }

    const carregarEscalas = async () => {
        const res = await axios.get(`${API_URL}/automation/escalas?empresa=${selectedEmpresa}`)
        setEscalas(res.data)
    }

    const addCompany = async () => {
        if (!newComp) return
        await axios.post(`${API_URL}/automation/companies`, { name: newComp.toUpperCase() })
        setNewComp('')
        await carregarEmpresas()
        setSelectedEmpresa(newComp.toUpperCase()) // Pula para a nova aba
    }

    const deleteCompany = async (nome: string) => {
        if (confirm(`Remover a aba ${nome}? (As regras não serão apagadas, apenas ocultas)`)) {
            await axios.delete(`${API_URL}/automation/companies/${nome}`)
            setSelectedEmpresa(null)
            await carregarEmpresas()
        }
    }

    const criarRegra = async () => {
        if (!newRegra.origem || !newRegra.destino) return alert("Preencha origem e destino")
        await axios.post(`${API_URL}/automation/escalas`, {
            ...newRegra,
            empresa: selectedEmpresa
        })
        setNewRegra({ origem: '', destino: '' })
        carregarEscalas()
    }

    const salvarEdicao = async () => {
        await axios.patch(`${API_URL}/automation/update/escala/${editingId}`, editData)
        setEditingId(null)
        carregarEscalas()
    }

    const toggleStatus = async (item: any) => {
        await axios.patch(`${API_URL}/automation/toggle/escala/${item.id}`, { ativa: !item.ativa })
        carregarEscalas()
    }

    const deleteEscala = async (id: string) => {
        if (confirm("Excluir esta escala permanentemente?")) {
            await axios.delete(`${API_URL}/automation/escalas/${id}`)
            carregarEscalas()
        }
    }

    return (
        <div className="max-w-6xl mx-auto py-12 px-8 font-sans bg-[#F9FBFF] min-h-screen text-slate-900">

            {/* CABEÇALHO: GESTÃO DE ABAS */}
            <div className="mb-10">
                <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-8">
                    MAPEAMENTO <span className="text-[#0052FF]">POR EMPRESA</span>
                </h1>

                <div className="flex flex-wrap gap-3 items-center">
                    {/* Lista Dinâmica de Empresas */}
                    {companies.map(c => {
                        const isSelected = selectedEmpresa === c.name;
                        return (
                            <div key={c.name} className={`flex items-center rounded-2xl border transition-all shadow-sm overflow-hidden ${isSelected ? 'bg-[#0052FF] border-[#0052FF]' : 'bg-white border-slate-200'}`}>
                                <button
                                    onClick={() => setSelectedEmpresa(c.name)}
                                    className={`px-5 py-3 text-[11px] font-black uppercase tracking-widest ${isSelected ? 'text-white' : 'text-slate-400 hover:text-[#0052FF]'}`}
                                >
                                    {c.name}
                                </button>
                                <button
                                    onClick={() => deleteCompany(c.name)}
                                    className={`px-3 py-3 text-xs font-bold ${isSelected ? 'text-blue-300 hover:text-white' : 'text-slate-200 hover:text-red-500'}`}
                                >
                                    ×
                                </button>
                            </div>
                        )
                    })}

                    {/* Criar Nova Empresa */}
                    <div className="flex items-center bg-white rounded-2xl border border-dashed border-slate-300 p-1 ml-2 shadow-sm focus-within:border-[#0052FF]">
                        <input
                            className="bg-transparent px-3 py-2 text-[10px] font-bold uppercase outline-none w-32 placeholder-slate-300"
                            placeholder="+ NOVA EMPRESA"
                            value={newComp}
                            onChange={e => setNewComp(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addCompany()}
                        />
                        <button onClick={addCompany} className="bg-slate-900 text-white px-3 py-2 rounded-xl font-black text-xs hover:bg-[#0052FF] transition-all">+</button>
                    </div>
                </div>
            </div>

            {/* CONTEÚDO DA PASTA SELECIONADA */}
            {selectedEmpresa ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

                    <div className="flex justify-between items-end mb-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-1 bg-[#0052FF] rounded-full"></div>
                            <div>
                                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Painel de Gestão</h2>
                                <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tight">{selectedEmpresa}</h2>
                            </div>
                        </div>
                        <div className="bg-white px-8 py-4 rounded-[2rem] shadow-xl shadow-blue-50/50 border border-blue-50 text-right">
                            <span className="text-4xl font-black text-[#0052FF] leading-none">{escalas.filter(e => e.ativa).length}</span>
                            <p className="text-[9px] font-black text-slate-300 uppercase mt-1">Regras Ativas</p>
                        </div>
                    </div>

                    {/* Formulário de Adição */}
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 mb-8 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                        <div>
                            <label className="text-[9px] font-bold text-slate-300 uppercase ml-2 mb-1 block">Origem (Doctor)</label>
                            <input
                                className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
                                placeholder="Ex: Plantão Clínico"
                                value={newRegra.origem}
                                onChange={e => setNewRegra({...newRegra, origem: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-bold text-slate-300 uppercase ml-2 mb-1 block">Destino (Omie)</label>
                            <input
                                className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold text-[#0052FF] outline-none focus:ring-2 focus:ring-blue-100"
                                placeholder="Ex: 2040 - Serviços Médicos"
                                value={newRegra.destino}
                                onChange={e => setNewRegra({...newRegra, destino: e.target.value})}
                            />
                        </div>
                        <div className="flex items-end">
                            <button onClick={criarRegra} className="h-[48px] px-8 bg-[#0052FF] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-blue-200">
                                Adicionar
                            </button>
                        </div>
                    </div>

                    {/* Tabela de Dados */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                        {escalas.length === 0 ? (
                            <div className="p-12 text-center text-slate-300 font-bold text-sm uppercase tracking-widest">
                                Nenhuma regra cadastrada para {selectedEmpresa}
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/80 border-b border-slate-100">
                                <tr>
                                    <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Origem</th>
                                    <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Destino</th>
                                    <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                                    <th className="p-6"></th>
                                </tr>
                                </thead>
                                <tbody>
                                {escalas.map(e => (
                                    <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all group">
                                        {editingId === e.id ? (
                                            <>
                                                <td className="p-4"><input className="w-full p-3 border border-blue-200 bg-blue-50 rounded-xl text-sm font-bold" value={editData.origem} onChange={x => setEditData({...editData, origem: x.target.value})} autoFocus /></td>
                                                <td className="p-4"><input className="w-full p-3 border border-blue-200 bg-blue-50 rounded-xl text-sm font-bold text-[#0052FF]" value={editData.destino} onChange={x => setEditData({...editData, destino: x.target.value})} /></td>
                                                <td className="p-4 text-[10px] font-black text-blue-400 uppercase animate-pulse">Editando...</td>
                                                <td className="p-4 text-right flex gap-2 justify-end">
                                                    <button onClick={salvarEdicao} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase hover:bg-emerald-600">Salvar</button>
                                                    <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-slate-200 text-slate-500 rounded-xl text-[9px] font-black uppercase hover:bg-slate-300">Cancelar</button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="p-6 text-sm font-bold text-slate-700">{e.origem}</td>
                                                <td className="p-6 text-sm font-bold text-[#0052FF]">{e.destino}</td>
                                                <td className="p-6">
                                                    <button
                                                        onClick={() => toggleStatus(e)}
                                                        className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${e.ativa ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-slate-100 text-slate-400 opacity-60'}`}
                                                    >
                                                        {e.ativa ? '● Ativo' : '○ Inativo'}
                                                    </button>
                                                </td>
                                                <td className="p-6 text-right space-x-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => { setEditingId(e.id); setEditData(e); }} className="text-[10px] font-black text-slate-300 hover:text-[#0052FF] uppercase tracking-tighter transition-colors">Editar</button>
                                                    <button onClick={() => deleteEscala(e.id)} className="text-[10px] font-black text-red-200 hover:text-red-500 uppercase tracking-tighter transition-colors">Excluir</button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Carregando empresas...</p>
                </div>
            )}
        </div>
    )
}