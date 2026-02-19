import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { LayoutDashboard, Truck, ClipboardList, Settings } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Gestão Pro | Frotas & Equipamentos",
    description: "Sistema premium de gestão de frotas",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pt-br">
            <body className={`${inter.className} bg-slate-50 text-slate-900`}>
                <div className="flex min-h-screen">
                    {/* Sidebar */}
                    <aside className="w-64 bg-primary-950 text-white flex flex-col fixed h-full transition-all duration-300">
                        <div className="p-6">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-white bg-clip-text text-transparent">
                                GestãoPro
                            </h1>
                            <p className="text-xs text-primary-300 mt-1 uppercase tracking-widest font-semibold">Frotas & Equipamentos</p>
                        </div>

                        <nav className="flex-1 px-4 py-4 space-y-2">
                            <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                                <LayoutDashboard size={20} className="text-primary-400" />
                                <span>Dashboard</span>
                            </Link>
                            <Link href="/lancamentos" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                                <ClipboardList size={20} className="text-primary-400" />
                                <span>Lançamentos</span>
                            </Link>
                            <Link href="/equipamentos" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                                <Truck size={20} className="text-primary-400" />
                                <span>Equipamentos</span>
                            </Link>
                        </nav>

                        <div className="p-4 mt-auto border-t border-white/5">
                            <Link href="/configuracoes" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                                <Settings size={20} className="text-primary-400" />
                                <span>Configurações</span>
                            </Link>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 ml-64 p-8">
                        <header className="mb-8 flex justify-between items-center">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Visão Geral</h2>
                                <p className="text-slate-500 mt-1">Bem-vindo ao centro de controle da sua frota.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
                                    JS
                                </div>
                            </div>
                        </header>
                        {children}
                    </main>
                </div>
            </body>
        </html>
    );
}
