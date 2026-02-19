'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
    const pathname = usePathname()

    const menuItems = [
        { name: 'Executar Omie', href: '/' },
        { name: 'Mapeamento de Escala', href: '/mappings' },
        { name: 'Tipo de Vínculo', href: '/vinculos' },
    ]

    return (
        <div className="h-full bg-white border-r border-gray-100 flex flex-col p-6 shadow-sm">
            <div className="mb-10 px-2">
                <h2 className="text-xl font-black text-[#1e293b] italic uppercase tracking-tighter">
                    HSM <span className="text-[#10b981]">SYSTEM</span>
                </h2>
            </div>

            <nav className="space-y-2">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link key={item.href} href={item.href}>
                            <div className={`
                flex items-center px-4 py-3 rounded-2xl text-[13px] font-black uppercase tracking-tight transition-all duration-200 cursor-pointer
                ${isActive
                                ? 'bg-green-50 text-[#10b981] shadow-sm shadow-green-100'
                                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}
              `}>
                                {item.name}
                            </div>
                        </Link>
                    )
                })}
            </nav>

            <div className="mt-auto pt-6 border-t border-gray-50">
                <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest text-center">
                    v1.0.0 - Aleevia
                </p>
            </div>
        </div>
    )
}