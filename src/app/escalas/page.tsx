'use client'
import { useState, useEffect } from 'react'

// Puxa a URL do Railway definida no Netlify ou usa localhost para desenvolvimento
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export default function MapeamentoPage() {
    // CORREÇÃO: Definimos explicitamente como <any[]> para o build passar
    const [escalas, setEscalas] = useState<any[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newEmpresa, setNewEmpresa] = useState('')
    const [loading, setLoading] = useState(false)

    // 1. Busca os dados do seu Backend na Nuvem
    const fetchData = async () => {
        try {
            const res = await fetch(`${API_URL}/automation/escalas`)
            const data = await res.json()
            if (Array.isArray(data)) setEscalas(data)
        } catch (err) {
            console.error("Erro ao carregar escalas", err)
        }
    }

    useEffect(() => { fetchData() }, [])

    // 2. Função de Cadastro
    const handleCreateEmpresa = async () => {
        if (!newEmpresa) return alert("Digite o nome da empresa")
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/automation/escalas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    empresa: newEmpresa,
                    origem: "",
                    destino: ""
                })
            })
            if (res.ok) {
                setNewEmpresa('')
                setIsModalOpen(false)
                fetchData() // Atualiza a lista na hora
            }
        } catch (err) {
            alert("Erro ao criar empresa no banco")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-6xl mx-auto py-12 px-8 font-sans text-[#1e293b]">
            {/* CABEÇALHO */}
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">
                        SISTEMA <span className="text-[#0052FF]">BACKOFFICE</span>
                    </h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Gestão de Mapeamento de Escalas</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[#0052FF] text-white px-8 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:shadow-xl hover:shadow-blue-200 transition-all"
                >
                    + Cadastrar Empresa
                </button>
            </div>

            {/* TABELA DE GESTÃO */}
            <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Empresa Registrada</th>
                        <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">De (Origem)</th>
                        <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Para (Destino)</th>
                        <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Ações</th>
                    </tr>
                    </thead>
                    <tbody>
                    {escalas.map((item: any) => (
                        <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-all">
                            <td className="p-6 font-bold text-lg">{item.empresa}</td>
                            <td className="p-6">
                                {item.origem ? (
                                    <span className="bg-blue-50 text-[#0052FF] px-3 py-1 rounded-lg font-bold text-xs">{item.origem}</span>
                                ) : (
                                    <span className="text-gray-300 italic text-xs">Pendente</span>
                                )}
                            </td>
                            <td className="p-6">
                                {item.destino ? (
                                    <span className="bg-green-50 text-green-600 px-3 py-1 rounded-lg font-bold text-xs">{item.destino}</span>
                                ) : (
                                    <span className="text-gray-300 italic text-xs">Pendente</span>
                                )}
                            </td>
                            <td className="p-6 text-right">
                                <button className="text-[10px] font-black uppercase text-gray-400 hover:text-[#0052FF] transition-all">
                                    Configurar Mapa
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL DE CADASTRO */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-[#1e293b]/80 backdrop-blur-md flex items-center justify-center z-50 p-6">
                    <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-2xl font-black uppercase tracking-tighter mb-1">Nova Empresa</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">Registre o nome no banco de dados</p>

                        <div className="mb-10">
                            <label className="text-[10px] font-black uppercase text-[#0052FF] block mb-3 ml-2">Nome Comercial</label>
                            <input
                                autoFocus
                                type="text"
                                value={newEmpresa}
                                onChange={(e) => setNewEmpresa(e.target.value)}
                                placeholder="EX: ALEEVIA"
                                className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-[#0052FF] rounded-3xl outline-none font-bold text-xl transition-all"
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateEmpresa()}
                            />
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleCreateEmpresa}
                                disabled={loading}
                                className="w-full py-5 bg-[#0052FF] text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-lg shadow-blue-100 disabled:bg-gray-200"
                            >
                                {loading ? 'Salvando...' : 'Finalizar Cadastro'}
                            </button>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-full py-4 text-[10px] font-black uppercase text-gray-400 hover:text-red-500 transition-all"
                            >
                                Descartar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}