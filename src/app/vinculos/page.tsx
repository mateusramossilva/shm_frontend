'use client'
import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export default function VinculosPage() {
    // ESTADOS
    const [vinculos, setVinculos] = useState<any[]>([])
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState<any>({})

    // INPUTS PARA NOVO VÍNCULO
    const [novoVinculo, setNovoVinculo] = useState({ sigla: '', nome: '' })

    // CARGA INICIAL
    useEffect(() => { carregar() }, [])

    const carregar = async () => {
        const res = await axios.get(`${API_URL}/automation/vinculos`)
        setVinculos(res.data)
    }

    // --- AÇÕES ---

    const criarNovo = async () => {
        if (!novoVinculo.sigla || !novoVinculo.nome) return alert("Preencha a Sigla e o Nome")

        await axios.post(`${API_URL}/automation/vinculos`, novoVinculo)

        setNovoVinculo({ sigla: '', nome: '' }) // Limpa inputs
        carregar() // Atualiza tabela
    }

    const salvarEdicao = async () => {
        await axios.patch(`${API_URL}/automation/update/vinculo/${editingId}`, editData)
        setEditingId(null)
        carregar()
    }

    const toggleStatus = async (item: any) => {
        await axios.patch(`${API_URL}/automation/toggle/vinculo/${item.id}`, { ativa: !item.ativa })
        carregar()
    }

    const deletar = async (id: string) => {
        if (confirm("Excluir este vínculo permanentemente?")) {
            await axios.delete(`${API_URL}/automation/vinculos/${id}`)
            carregar()
        }
    }

    return (
        <div className="max-w-6xl mx-auto py-12 px-8 font-sans bg-[#F9FBFF] min-h-screen text-slate-900">

            {/* 1. CABEÇALHO E CONTADOR */}
            <div className="flex justify-between items-end mb-12">
                <div>
                    <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-800">
                        DE/PARA <span className="text-[#0052FF]">VÍNCULOS</span>
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                        Configuração Global (Todas as Empresas)
                    </p>
                </div>

                <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-blue-50/50 border border-blue-50 text-center">
                    <div className="text-7xl font-black text-[#0052FF] leading-none tracking-tighter">
                        {vinculos.filter(v => v.ativa).length}
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mt-2">Tipos Ativos</p>
                </div>
            </div>

            {/* 2. FORMULÁRIO DE ADICIONAR (O que você pediu) */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-4 mb-8 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">

                <div>
                    <label className="text-[9px] font-bold text-slate-300 uppercase ml-2 mb-1 block">Sigla (Doctor)</label>
                    <input
                        placeholder="Ex: CLT"
                        className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
                        value={novoVinculo.sigla}
                        onChange={x => setNovoVinculo({...novoVinculo, sigla: x.target.value})}
                    />
                </div>

                <div>
                    <label className="text-[9px] font-bold text-slate-300 uppercase ml-2 mb-1 block">Nome Completo (Omie)</label>
                    <input
                        placeholder="Ex: Funcionário CLT Mensalista"
                        className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold text-[#0052FF] outline-none focus:ring-2 focus:ring-blue-100"
                        value={novoVinculo.nome}
                        onChange={x => setNovoVinculo({...novoVinculo, nome: x.target.value})}
                    />
                </div>

                <div className="flex items-end">
                    <button
                        onClick={criarNovo}
                        className="h-[48px] px-8 bg-[#0052FF] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-blue-200"
                    >
                        Adicionar
                    </button>
                </div>
            </div>

            {/* 3. TABELA DE VÍNCULOS */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                        <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Sigla</th>
                        <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Descrição Omie</th>
                        <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                        <th className="p-6"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {vinculos.map((v) => (
                        <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all group">
                            {editingId === v.id ? (
                                <>
                                    {/* MODO EDIÇÃO */}
                                    <td className="p-4"><input className="w-full p-3 border border-blue-200 bg-blue-50 rounded-xl text-sm font-bold" value={editData.sigla} onChange={x => setEditData({...editData, sigla: x.target.value})} autoFocus /></td>
                                    <td className="p-4"><input className="w-full p-3 border border-blue-200 bg-blue-50 rounded-xl text-sm font-bold text-[#0052FF]" value={editData.nome} onChange={x => setEditData({...editData, nome: x.target.value})} /></td>
                                    <td className="p-4 text-center text-[9px] font-bold text-slate-300 uppercase animate-pulse">Editando</td>
                                    <td className="p-4 text-right flex gap-2 justify-end">
                                        <button onClick={salvarEdicao} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase hover:bg-emerald-600">Salvar</button>
                                        <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-slate-200 text-slate-500 rounded-xl text-[9px] font-black uppercase hover:bg-slate-300">Cancelar</button>
                                    </td>
                                </>
                            ) : (
                                <>
                                    {/* MODO VISUALIZAÇÃO */}
                                    <td className="p-6 text-sm font-bold text-slate-700">{v.sigla}</td>
                                    <td className="p-6 text-sm font-bold text-[#0052FF]">{v.nome}</td>
                                    <td className="p-6">
                                        <button onClick={() => toggleStatus(v)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${v.ativa ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-50' : 'bg-slate-100 text-slate-400 opacity-60'}`}>
                                            {v.ativa ? '● Ativo' : '○ Inativo'}
                                        </button>
                                    </td>
                                    <td className="p-6 text-right space-x-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setEditingId(v.id); setEditData(v); }} className="text-[10px] font-black text-slate-300 hover:text-[#0052FF] uppercase tracking-tighter transition-colors">Editar</button>
                                        <button onClick={() => deletar(v.id)} className="text-[10px] font-black text-red-200 hover:text-red-500 uppercase tracking-tighter transition-colors">Excluir</button>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}