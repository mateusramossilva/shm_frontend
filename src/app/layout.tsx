import './globals.css'
import Link from 'next/link'

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="pt-br">
        <body className="bg-[#f8fafc] text-[#1e293b] flex min-h-screen">

        {/* SIDEBAR ALEEVIA */}
        <aside className="w-72 bg-white border-r border-gray-100 flex flex-col fixed h-full shadow-sm">

            {/* LOGO ALEEVIA - O caminho /logo-aleevia.png aponta direto para a pasta public */}
            <div className="p-10 mb-4 flex justify-center">
                <Link href="/">
                    <img
                        src="/logo-aleevia.png"
                        alt="Aleevia"
                        className="h-14 w-auto object-contain"
                    />
                </Link>
            </div>

            <nav className="flex-1 px-6 space-y-1">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] ml-4 mb-4">Projetos SHM</p>

                <Link href="/mappings" className="flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-tighter text-gray-500 hover:bg-blue-50 hover:text-[#0052FF] transition-all group">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-200 group-hover:bg-[#0052FF]"></span>
                    Mapeamento Escala
                </Link>

                <Link href="/vinculos" className="flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-tighter text-gray-500 hover:bg-blue-50 hover:text-[#0052FF] transition-all group">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-200 group-hover:bg-[#0052FF]"></span>
                    Tipos de Vínculo
                </Link>

                <div className="pt-8">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] ml-4 mb-4">Operacional</p>
                    <Link href="/executar" className="flex items-center justify-center gap-3 px-6 py-5 rounded-2xl bg-[#0052FF] text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-[#0041cc] transition-all active:scale-95">
                        Executar Omie
                    </Link>
                </div>
            </nav>

            <div className="p-8 border-t border-gray-50 text-center">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Aleevia © 2026</p>
            </div>
        </aside>

        <main className="flex-1 ml-72 p-12">
            {children}
        </main>

        </body>
        </html>
    )
}