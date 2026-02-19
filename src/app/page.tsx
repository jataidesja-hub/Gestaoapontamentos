"use client";

import { useEffect, useState } from "react";
import { Truck, AlertCircle, Clock, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, AreaChart, Area
} from 'recharts';

const dummyData = [
    { name: 'Jan', km: 4000, valor: 2400 },
    { name: 'Fev', km: 3000, valor: 1398 },
    { name: 'Mar', km: 2000, valor: 9800 },
    { name: 'Abr', km: 2780, valor: 3908 },
    { name: 'Mai', km: 1890, valor: 4800 },
    { name: 'Jun', km: 2390, valor: 3800 },
];

export default function Dashboard() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simular carregamento inicial
        setTimeout(() => setLoading(false), 800);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Frota Ativa"
                    value="12/15"
                    icon={<Truck className="text-primary-600" />}
                    trend="+2 este mês"
                    positive={true}
                />
                <StatCard
                    title="Indisponibilidade"
                    value="8%"
                    icon={<AlertCircle className="text-red-500" />}
                    trend="+1.2% vs set"
                    positive={false}
                />
                <StatCard
                    title="Horas Acumuladas"
                    value="1,240h"
                    icon={<Clock className="text-amber-500" />}
                    trend="Dentro da meta"
                    positive={true}
                />
                <StatCard
                    title="Faturamento Previsto"
                    value="R$ 145.200"
                    icon={<DollarSign className="text-emerald-500" />}
                    trend="+R$ 12k vs prev"
                    positive={true}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800">Quilometragem por Mês</h3>
                        <select className="bg-slate-50 border-none text-sm rounded-lg focus:ring-primary-500">
                            <option>Últimos 6 meses</option>
                        </select>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dummyData}>
                                <defs>
                                    <linearGradient id="colorKm" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="km" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorKm)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800">Resumo Financeiro</h3>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Acumulado</span>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dummyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="valor" fill="#0369a1" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, trend, positive }: any) {
    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 rounded-2xl">
                    {icon}
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
                    {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {trend}
                </div>
            </div>
            <div>
                <h4 className="text-slate-500 text-sm font-medium">{title}</h4>
                <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
            </div>
        </div>
    );
}
