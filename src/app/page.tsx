"use client";

import { useEffect, useState } from "react";
import { Truck, AlertCircle, Clock, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import { fetchEquipments, fetchEntries } from "@/lib/api";

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        frotaAtiva: "0/0",
        indisponibilidade: "0%",
        horasAcumuladas: "0h",
        faturamentoPrevisto: "R$ 0",
        chartData: [] as any[]
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    async function loadDashboardData() {
        try {
            const [equipments, entries] = await Promise.all([fetchEquipments(), fetchEntries()]);

            if (!equipments.length) {
                setLoading(false);
                return;
            }

            // 1. Frota Ativa
            const totalEquip = equipments.length;
            const brokenToday = entries.filter((e: any) =>
                e.data.includes(new Date().toISOString().split('T')[0]) && e.status === 'Quebrado'
            ).length;

            // 2. Indisponibilidade (Média do mês)
            const totalPossibleEntries = totalEquip * 30; // Simplificado para 30 dias
            const totalBrokenEntries = entries.filter((e: any) => e.status === 'Quebrado').length;
            const indisponibilidade = totalPossibleEntries > 0
                ? Math.round((totalBrokenEntries / totalPossibleEntries) * 100)
                : 0;

            // 3. Horas Acumuladas (Somente para categoria H)
            const totalHours = entries.reduce((acc: number, entry: any) => {
                const equip = equipments.find((eq: any) => eq.id === entry.id_equipamento);
                if (equip?.categoria === 'H') {
                    return acc + (Number(entry.valor_final) - Number(entry.valor_inicial));
                }
                return acc;
            }, 0);

            // 4. Faturamento Previsto
            let totalFaturamento = 0;
            equipments.forEach((eq: any) => {
                const eqEntries = entries.filter((ent: any) => ent.id_equipamento === eq.id);
                const monthlyValue = Number(eq.valor_mensal) || 0;

                if (eq.categoria === 'KM') {
                    // Proporcional aos dias disponíveis
                    const brokenDays = eqEntries.filter((ent: any) => ent.status === 'Quebrado').length;
                    const availabilityRate = (30 - brokenDays) / 30; // Simplificado mensal
                    totalFaturamento += monthlyValue * Math.max(0, availabilityRate);
                } else {
                    // Horímetro: Fixo + Extras > 200h
                    const totalEqHours = eqEntries.reduce((sum: number, ent: any) =>
                        sum + (Number(ent.valor_final) - Number(ent.valor_inicial)), 0
                    );
                    totalFaturamento += monthlyValue;
                    if (totalEqHours > 200) {
                        const extraHours = totalEqHours - 200;
                        const hourValue = monthlyValue / 200;
                        totalFaturamento += extraHours * hourValue;
                    }
                }
            });

            // Dados para o gráfico (agregado por dia/mês simplificado)
            const chartData = entries.slice(-10).map((e: any) => ({
                name: new Date(e.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
                km: Number(e.valor_final) - Number(e.valor_inicial),
                valor: (Number(e.valor_final) - Number(e.valor_inicial)) * 10 // Valor arbitrário para demo
            }));

            setStats({
                frotaAtiva: `${totalEquip - brokenToday}/${totalEquip}`,
                indisponibilidade: `${indisponibilidade}%`,
                horasAcumuladas: `${totalHours.toFixed(1)}h`,
                faturamentoPrevisto: `R$ ${totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                chartData
            });

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

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
                    value={stats.frotaAtiva}
                    icon={<Truck className="text-primary-600" />}
                    trend="Tempo real"
                    positive={true}
                />
                <StatCard
                    title="Indisponibilidade"
                    value={stats.indisponibilidade}
                    icon={<AlertCircle className="text-red-500" />}
                    trend="Base mensal"
                    positive={false}
                />
                <StatCard
                    title="Horas Acumuladas"
                    value={stats.horasAcumuladas}
                    icon={<Clock className="text-amber-500" />}
                    trend="Total H"
                    positive={true}
                />
                <StatCard
                    title="Faturamento Est."
                    value={stats.faturamentoPrevisto}
                    icon={<DollarSign className="text-emerald-500" />}
                    trend="Previsto"
                    positive={true}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800">Produção Recente</h3>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Últimos Lançamentos</span>
                    </div>
                    <div className="h-80">
                        {stats.chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.chartData}>
                                    <defs>
                                        <linearGradient id="colorKm" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="km" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorKm)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400">Sem dados para exibir</div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800">Resumo de Lançamentos</h3>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Volume por Dia</span>
                    </div>
                    <div className="h-80">
                        {stats.chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="km" fill="#0369a1" radius={[6, 6, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400">Sem dados para exibir</div>
                        )}
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
                <div className={`flex items-center gap-1 text-[10px] font-medium ${positive ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {positive ? <ArrowUpRight size={12} /> : null}
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
