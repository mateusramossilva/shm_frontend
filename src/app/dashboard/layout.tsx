// src/app/layout.tsx ou src/app/(dashboard)/layout.tsx
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-[#f8fafc]">
            {/* Sidebar fixa na esquerda */}
            <aside className="w-64 fixed inset-y-0">
                <Sidebar />
            </aside>

            {/* Conteúdo que muda à direita */}
            <main className="flex-1 ml-64 p-8">
                {children}
            </main>
        </div>
    );
}