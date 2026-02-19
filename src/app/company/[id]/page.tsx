'use client'
import React, { useState, useEffect } from 'react'
import { Plus, Buildings, Gear, CheckCircle, House, Users, TreeStructure, SignOut, ChartLineUp } from 'phosphor-react'
import { useRouter } from 'next/navigation'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

const sparkData = [{ v: 10 }, { v: 25 }, { v: 15 }, { v: 30 }, { v: 20 }, { v: 45 }, { v: 35 }, { v: 50 }];

export default function Dashboard() {
    const [companies, setCompanies] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const load = async () => {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
            try {
                const resComp = await fetch(`${baseUrl}/companies`);
                if (!resComp.ok) throw new Error();
                const dataComp = await resComp.json();
                setCompanies(dataComp);

                const resCat = await fetch(`${baseUrl}/companies/categories`);
                const textCat = await resCat.text();
                setCategories(textCat ? JSON.parse(textCat) : []);
            } catch (err) {
                console.error("ERRO DE CONEXÃO: Verifique se o backend está na porta 3000");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black text-[10px] tracking-[0.3em] uppercase animate-pulse text-slate-400">
            Sincronizando Ecossistema HSM...
        </div>
    );

    return (
        <div className="flex min-h-screen bg-[#f4f7f6] text-slate-900 font-sans antialiased">
            {/* SIDEBAR CORPORATIVA */}
            <aside className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-8 gap-10 sticky top-0 h-screen shadow-sm">
                <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-lg shadow-emerald-100"><TreeStructure size={28} weight="fill" /></div>
                <nav className="flex flex-col gap-9 text-slate-300">
                    <House size={24} weight="fill" className="text-emerald-600" />
                    <Users size={24} />
                    <ChartLineUp size={24} />
                    <Gear size={24} />
                </nav>
                <button className="mt-auto text-slate-300 hover:text-rose-500 transition-colors"><SignOut size={24} /></button>
            </aside>

            <main className="flex-1 p-10 max-w-[1600px] mx-auto">
                {/* TABS HEADER */}
                <div className="flex border-b border-slate-200 mb-10">
                    <button className="px-10 py-5 border-b-4 border-emerald-500 text-emerald-600 font-black text-[11px] uppercase tracking-[0.2em] bg-white">Mapeamento</button>
                    <button className="px-10 py-5 text-slate-400 font-black text-[11px] uppercase tracking-[0.2em] hover:text-emerald-600">Funcionários</button>
                </div>

                {/* CARDS COM GRADIENTES */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                    <StatCard title="SHM - Escalas" val="70" color="from-purple-600 to-indigo-600" Icon={Buildings} />
                    <StatCard title="Vitallis - Escalas" val="18" color="from-rose-500 to-orange-500" Icon={Users} />
                    <StatCard title="Aleevia - Escalas" val="0" color="from-orange-500 to-yellow-500" Icon={Plus} />
                    <StatCard title="Status Banco HSM" val="100%" color="from-emerald-500 to-teal-600" Icon={CheckCircle} />
                </section>

                {/* LISTAGEM DE UNIDADES */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30 font-black text-slate-800 uppercase text-xs tracking-[0.2em]">
                        Unidades Backoffice
                    </div>
                    <div className="divide-y divide-slate-50">
                        {companies.map((company: any) => (
                            <div key={company.id} className="p-10 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                                <div className="flex items-center gap-8">
                                    <div className="p-5 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all shadow-inner"><Buildings size={32} weight="fill" /></div>
                                    <div>
                                        <h4 className="font-black text-slate-900 text-2xl italic uppercase tracking-tighter leading-none mb-2">{company.name}</h4>
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                            <CheckCircle weight="fill" /> {company.status}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => router.push(`/company/${company.id}`)}
                                    className="bg-white border-2 border-slate-100 text-slate-700 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-all flex items-center gap-3"
                                >
                                    <Gear size={20} weight="bold" /> Gerenciar Mapeamento
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}

function StatCard({ title, val, color, Icon }: any) {
    return (
        <div className={`bg-gradient-to-br ${color} rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group`}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-5xl font-black tracking-tighter leading-none">{val}</span>
                <Icon size={28} className="opacity-40" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-8 opacity-80 italic">{title}</p>
            <div className="h-12 w-full opacity-30">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparkData}><Line type="monotone" dataKey="v" stroke="#fff" strokeWidth={4} dot={false} /></LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}