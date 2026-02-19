"use client";

import { useEffect, useState } from "react";
import { Truck, AlertCircle, Clock, DollarSign, Calendar, Filter, ChevronRight, Ruler, Printer } from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import { fetchEquipments, fetchEntries } from "@/lib/api";
import { isWithinInterval, parseISO, startOfMonth, endOfMonth, differenceInDays } from "date-fns";

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [allEntries, setAllEntries] = useState<any[]>([]);
    const [equipments, setEquipments] = useState<any[]>([]);
    const [startDate, setStartDate] = useState(formatDate(startOfMonth(new Date())));
    const [endDate, setEndDate] = useState(formatDate(new Date()));

    const [stats, setStats] = useState({
        frotaAtiva: "0/0",
        indisponibilidade: "0%",
        horasAcumuladas: "0h",
        faturamentoPrevisto: "R$ 0",
        categoryData: {
            km: [] as any[],
            h: [] as any[]
        },
        chartData: [] as any[]
    });

    function formatDate(date: Date) {
        return date.toISOString().split('T')[0];
    }

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (allEntries.length > 0) {
            calculateStats();
        }
    }, [startDate, endDate, allEntries, equipments]);

    async function loadInitialData() {
        try {
            setLoading(true);
            const [eqs, ents] = await Promise.all([fetchEquipments(), fetchEntries()]);
            setEquipments(eqs);
            setAllEntries(ents);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    function calculateStats() {
        const filteredEntries = allEntries.filter(entry => {
            const entryDate = parseISO(entry.data);
            return isWithinInterval(entryDate, {
                start: parseISO(startDate),
                end: parseISO(endDate)
            });
        });

        const totalDaysInPeriod = differenceInDays(parseISO(endDate), parseISO(startDate)) + 1;

        // 1. Frota Ativa (Realtime)
        const totalEquip = equipments.length;
        const todayStr = formatDate(new Date());
        const brokenToday = allEntries.filter((e: any) =>
            e.data === todayStr && e.status === 'Quebrado'
        ).length;

        // 2. Report por Categoria
        const kmReport = equipments.filter(eq => eq.categoria === 'KM').map(eq => {
            const eqEntries = filteredEntries.filter(ent => ent.id_equipamento === eq.id);
            const totalKm = eqEntries.reduce((acc, ent) => acc + (Number(ent.valor_final) - Number(ent.valor_inicial)), 0);
            const activeDays = eqEntries.filter(ent => ent.status === 'Ativo').length;
            const brokenDays = eqEntries.filter(ent => ent.status === 'Quebrado').length;

            const monthlyValue = Number(eq.valor_mensal) || 0;
            const valorPagar = (monthlyValue / 30) * activeDays;

            return { ...eq, totalKm, activeDays, brokenDays, valorPagar };
        });

        const hReport = equipments.filter(eq => eq.categoria === 'H').map(eq => {
            const eqEntries = filteredEntries.filter(ent => ent.id_equipamento === eq.id);
            const totalHours = eqEntries.reduce((acc, ent) => acc + (Number(ent.valor_final) - Number(ent.valor_inicial)), 0);
            const activeDays = eqEntries.filter(ent => ent.status === 'Ativo').length;
            const brokenDays = eqEntries.filter(ent => ent.status === 'Quebrado').length;

            const monthlyValue = Number(eq.valor_mensal) || 0;
            let valorPagar = (monthlyValue / 30) * activeDays;

            // Extras se ultrapassar proporcional de 200h (estimado)
            if (totalHours > 200) {
                const extraHours = totalHours - 200;
                valorPagar += extraHours * (monthlyValue / 200);
            }

            return { ...eq, totalHours, activeDays, brokenDays, valorPagar };
        });

        const totalSelectedHours = hReport.reduce((acc, eq) => acc + eq.totalHours, 0);
        const totalFaturamento = [...kmReport, ...hReport].reduce((acc, eq) => acc + eq.valorPagar, 0);

        const chartData = filteredEntries.slice(-10).map((e: any) => ({
            name: new Date(e.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
            prod: Number(e.valor_final) - Number(e.valor_inicial)
        }));

        setStats({
            frotaAtiva: `${totalEquip - brokenToday}/${totalEquip}`,
            indisponibilidade: `${totalEquip > 0 ? Math.round((brokenToday / totalEquip) * 100) : 0}%`,
            horasAcumuladas: `${totalSelectedHours.toFixed(1)}h`,
            faturamentoPrevisto: `R$ ${totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            categoryData: { km: kmReport, h: hReport },
            chartData
        });
    }

    const handlePrint = (category: 'km' | 'h') => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const data = category === 'km' ? stats.categoryData.km : stats.categoryData.h;
        const title = category === 'km' ? 'Relatório de Frota - KM' : 'Relatório de Equipamentos - Horímetro';
        const unit = category === 'km' ? 'KM' : 'Horas';

        let rows = data.map(eq => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${eq.nome}<br/><small style="color: #666;">${eq.placa}</small></td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${eq.activeDays}d</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${eq.brokenDays}d</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${(category === 'km' ? eq.totalKm : eq.totalHours).toFixed(1)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">R$ ${eq.valorPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join('');

        const totalGeral = data.reduce((acc, eq) => acc + eq.valorPagar, 0);

        printWindow.document.write(`
      <html>
        <head>
          <title>Impressão - ${title}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; background: #f8fafc; padding: 12px; border-bottom: 2px solid #e2e8f0; font-size: 12px; text-transform: uppercase; }
            .header { margin-bottom: 30px; border-bottom: 4px solid #0ea5e9; padding-bottom: 20px; }
            .footer { margin-top: 30px; text-align: right; font-size: 18px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <p>Período: ${new Date(startDate).toLocaleDateString()} até ${new Date(endDate).toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Equipamento</th>
                <th style="text-align: center;">Dias Rodados</th>
                <th style="text-align: center;">Dias Parados</th>
                <th style="text-align: center;">Produção (${unit})</th>
                <th style="text-align: right;">Valor a Pagar</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <div class="footer">
            Total do Período: R$ ${totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
        </body>
      </html>
    `);
        printWindow.document.close();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header with Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">Dashboard de Frota</h2>
                    <p className="text-slate-500 text-sm">Resumo operacional e financeiro</p>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                    <Calendar size={18} className="text-slate-400 ml-2" />
                    <input
                        type="date"
                        className="bg-transparent border-none text-xs font-bold text-slate-600 focus:ring-0 p-1"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                    />
                    <span className="text-slate-300">|</span>
                    <input
                        type="date"
                        className="bg-transparent border-none text-xs font-bold text-slate-600 focus:ring-0 p-1"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                    />
                    <div className="bg-primary-600 p-2 rounded-xl text-white shadow-lg cursor-pointer hover:bg-primary-700 transition-colors">
                        <Filter size={16} />
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Status Frota" value={stats.frotaAtiva} icon={<Truck className="text-primary-600" />} label="Ativos hoje" />
                <StatCard title="Indisponibilidade" value={stats.indisponibilidade} icon={<AlertCircle className="text-red-500" />} label="Manutenção agora" />
                <StatCard title="Produção (H)" value={stats.horasAcumuladas} icon={<Clock className="text-amber-500" />} label="No período" />
                <StatCard title="Receita Est." value={stats.faturamentoPrevisto} icon={<DollarSign className="text-emerald-500" />} label="Período selecionado" />
            </div>

            {/* Category Panels (Requested) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Quilometragem Panel */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary-100 text-primary-600 rounded-2xl"><Ruler size={20} /></div>
                            <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Equipamentos KM</h3>
                        </div>
                        <button
                            onClick={() => handlePrint('km')}
                            className="flex items-center gap-2 bg-white text-primary-600 px-4 py-2 rounded-xl border border-primary-100 font-bold text-xs hover:bg-primary-50 transition-colors shadow-sm"
                        >
                            <Printer size={14} /> IMPRIMIR
                        </button>
                    </div>
                    <div className="p-4">
                        <div className="space-y-4">
                            {stats.categoryData.km.map((eq, i) => (
                                <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-3xl transition-all border border-transparent hover:border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs">#{i + 1}</div>
                                        <div>
                                            <p className="font-bold text-slate-900">{eq.nome}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{eq.placa}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-6 text-right">
                                        <div>
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Ativo</p>
                                            <p className="text-md font-black text-emerald-600">{eq.activeDays}d</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Parado</p>
                                            <p className="text-md font-black text-red-400">{eq.brokenDays}d</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Total</p>
                                            <p className="text-md font-black text-primary-600">{eq.totalKm.toFixed(0)} <span className="text-[9px]">KM</span></p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Horímetro Panel */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl"><Clock size={20} /></div>
                            <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Equipamentos H</h3>
                        </div>
                        <button
                            onClick={() => handlePrint('h')}
                            className="flex items-center gap-2 bg-white text-amber-600 px-4 py-2 rounded-xl border border-amber-100 font-bold text-xs hover:bg-amber-50 transition-colors shadow-sm"
                        >
                            <Printer size={14} /> IMPRIMIR
                        </button>
                    </div>
                    <div className="p-4">
                        <div className="space-y-4">
                            {stats.categoryData.h.map((eq, i) => (
                                <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-3xl transition-all border border-transparent hover:border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs">#{i + 1}</div>
                                        <div>
                                            <p className="font-bold text-slate-900">{eq.nome}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{eq.placa}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-6 text-right">
                                        <div>
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Ativo</p>
                                            <p className="text-md font-black text-emerald-600">{eq.activeDays}d</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Parado</p>
                                            <p className="text-md font-black text-red-400">{eq.brokenDays}d</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Total</p>
                                            <p className="text-md font-black text-amber-600">{eq.totalHours.toFixed(1)} <span className="text-[9px]">H</span></p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Production Chart */}
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xl font-black text-slate-800">Fluxo de Produção</h3>
                        <p className="text-slate-400 text-sm">Produção por lançamento no período</p>
                    </div>
                </div>
                <div className="h-80">
                    {stats.chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.chartData}>
                                <defs>
                                    <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ stroke: '#0ea5e9', strokeWidth: 2 }}
                                />
                                <Area type="monotone" dataKey="prod" name="Produção" stroke="#0ea5e9" strokeWidth={4} fillOpacity={1} fill="url(#colorProd)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 font-bold uppercase tracking-widest text-xs">Dados Insuficientes</div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, label }: any) {
    return (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-slate-50 group-hover:bg-primary-50 rounded-2xl transition-colors">
                    {icon}
                </div>
                <ChevronRight size={16} className="text-slate-200" />
            </div>
            <div>
                <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</h4>
                <p className="text-3xl font-black text-slate-900 mt-1">{value}</p>
                <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase">{label}</p>
            </div>
        </div>
    );
}
