"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Calendar, Activity, Clock, Ruler } from "lucide-react";
import { fetchEquipments, fetchEntries, addEntry } from "@/lib/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function LançamentosPage() {
    const [entries, setEntries] = useState<any[]>([]);
    const [equipments, setEquipments] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const [selectedEquip, setSelectedEquip] = useState<any>(null);
    const [duration, setDuration] = useState({ hours: "", minutes: "" });
    const [formData, setFormData] = useState({
        data: new Date().toISOString().split('T')[0],
        idEquipamento: "",
        valorInicial: "",
        valorFinal: "",
        status: "Ativo"
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [eqs, ents] = await Promise.all([fetchEquipments(), fetchEntries()]);
            setEquipments(eqs);
            setEntries(ents);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    // Monitora seleção de equipamento para setar o tipo e valor inicial
    useEffect(() => {
        if (formData.idEquipamento) {
            const eq = equipments.find(e => e.id === formData.idEquipamento);
            setSelectedEquip(eq);

            const lastEntry = entries
                .filter(entry => entry.id_equipamento === formData.idEquipamento)
                .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];

            const inicial = lastEntry ? lastEntry.valor_final : "0";
            setFormData(prev => ({ ...prev, valorInicial: inicial, valorFinal: "" }));
            setDuration({ hours: "", minutes: "" });
        }
    }, [formData.idEquipamento, equipments, entries]);

    // Lógica para KM: Quando muda Valor Final
    const handleFinalChange = (val: string) => {
        setFormData(prev => ({ ...prev, valorFinal: val }));
    };

    // Lógica para Horímetro: Converte h/m para Valor Final
    useEffect(() => {
        if (selectedEquip?.categoria === 'H') {
            const h = parseFloat(duration.hours) || 0;
            const m = parseFloat(duration.minutes) || 0;
            const totalHours = h + (m / 60);
            const inicial = parseFloat(formData.valorInicial) || 0;
            setFormData(prev => ({ ...prev, valorFinal: (inicial + totalHours).toFixed(2) }));
        }
    }, [duration, selectedEquip, formData.valorInicial]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            await addEntry(formData);
            setIsModalOpen(false);
            loadData();
            setFormData({
                data: new Date().toISOString().split('T')[0],
                idEquipamento: "",
                valorInicial: "",
                valorFinal: "",
                status: "Ativo"
            });
        } catch (error) {
            alert("Erro ao salvar lançamento");
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Lançamentos Diários</h2>
                    <p className="text-slate-500">Registre as medições de KM e Horímetro.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg active:scale-95"
                >
                    <Plus size={20} />
                    Novo Lançamento
                </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-bold">Data</th>
                                <th className="px-6 py-4 font-bold">Equipamento</th>
                                <th className="px-6 py-4 font-bold text-center">Início</th>
                                <th className="px-6 py-4 font-bold text-center">Fim</th>
                                <th className="px-6 py-4 font-bold text-center">Produção</th>
                                <th className="px-6 py-4 font-bold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Carregando...</td></tr>
                            ) : entries.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Nenhum lançamento encontrado.</td></tr>
                            ) : entries.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map((entry: any, i) => {
                                const eq = equipments.find(e => e.id === entry.id_equipamento);
                                const delta = Number(entry.valor_final) - Number(entry.valor_inicial);
                                return (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                                            {format(new Date(entry.data), 'dd/MM/yyyy')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800 text-sm">{eq?.nome || "---"}</div>
                                            <div className="text-[10px] text-slate-400">{eq?.placa}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-500 font-mono text-xs">{entry.valor_inicial}</td>
                                        <td className="px-6 py-4 text-center text-slate-800 font-bold font-mono text-xs">{entry.valor_final}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-primary-600 font-black text-xs">
                                                {delta.toFixed(2)} {eq?.categoria === 'KM' ? 'KM' : 'H'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-tighter ${entry.status === 'Ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                {entry.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900">Novo Lançamento</h3>
                                <p className="text-slate-500 text-sm">Registro diário de operação</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 transition-all">×</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Equipamento</label>
                                    <select
                                        required
                                        className="w-full bg-slate-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl px-5 py-4 focus:ring-0 transition-all font-bold text-slate-800 shadow-inner"
                                        value={formData.idEquipamento}
                                        onChange={e => setFormData({ ...formData, idEquipamento: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        {equipments.map(eq => (
                                            <option key={eq.id} value={eq.id}>{eq.nome} ({eq.placa})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Data da Operação</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-slate-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl px-5 py-4 focus:ring-0 transition-all font-bold text-slate-800"
                                        value={formData.data}
                                        onChange={e => setFormData({ ...formData, data: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Status Operacional</label>
                                    <select
                                        className={`w-full border-2 border-transparent focus:bg-white rounded-2xl px-5 py-4 focus:ring-0 transition-all font-black ${formData.status === 'Ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="Ativo">OPERANDO (ATIVO)</option>
                                        <option value="Quebrado">MANUTENÇÃO (QUEBRADO)</option>
                                    </select>
                                </div>
                            </div>

                            {selectedEquip && (
                                <div className="bg-primary-50/50 p-6 rounded-3xl border border-primary-100 animate-in slide-in-from-top-2">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-white rounded-xl shadow-sm text-primary-600">
                                            {selectedEquip.categoria === 'KM' ? <Ruler size={18} /> : <Clock size={18} />}
                                        </div>
                                        <span className="font-black text-primary-900 text-sm">Medição: {selectedEquip.categoria === 'KM' ? 'Quilometragem' : 'Horímetro'}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[9px] font-bold text-primary-500 uppercase tracking-wider mb-1 block">Início (Anterior)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                required
                                                className="w-full bg-white border-2 border-transparent focus:border-primary-400 rounded-xl px-4 py-3 font-bold text-center text-primary-900 shadow-sm"
                                                value={formData.valorInicial}
                                                onChange={e => setFormData({ ...formData, valorInicial: e.target.value })}
                                            />
                                            <p className="text-[8px] text-primary-400 mt-1">* Editável se necessário</p>
                                        </div>

                                        {selectedEquip.categoria === 'H' ? (
                                            <div className="col-span-1 space-y-4">
                                                <label className="text-[9px] font-bold text-primary-500 uppercase tracking-wider mb-1 block">Tempo trabalhado hoje</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            placeholder="H"
                                                            className="w-full bg-white border-2 border-transparent focus:border-primary-400 rounded-xl px-4 py-3 font-bold text-center"
                                                            value={duration.hours}
                                                            onChange={e => setDuration({ ...duration, hours: e.target.value })}
                                                        />
                                                        <span className="absolute -top-1 right-2 text-[8px] text-slate-400">HORAS</span>
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            placeholder="M"
                                                            max="59"
                                                            className="w-full bg-white border-2 border-transparent focus:border-primary-400 rounded-xl px-4 py-3 font-bold text-center"
                                                            value={duration.minutes}
                                                            onChange={e => setDuration({ ...duration, minutes: e.target.value })}
                                                        />
                                                        <span className="absolute -top-1 right-2 text-[8px] text-slate-400">MIN</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="text-[9px] font-bold text-primary-500 uppercase tracking-wider mb-1 block">Valor Final (Vejam medidor)</label>
                                                <input
                                                    type="number"
                                                    required
                                                    className="w-full bg-white border-2 border-transparent focus:border-primary-400 rounded-xl px-4 py-3 font-bold text-center text-primary-900 shadow-sm"
                                                    value={formData.valorFinal}
                                                    onChange={e => handleFinalChange(e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {selectedEquip.categoria === 'H' && (
                                        <div className="mt-4 pt-4 border-t border-primary-100 flex justify-between items-center text-[10px]">
                                            <span className="text-primary-400 font-medium">TOTAL CALCULADO (METRO)</span>
                                            <span className="font-black text-primary-900 text-sm font-mono">{formData.valorFinal}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={!selectedEquip || !formData.valorFinal}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-black py-5 rounded-[1.5rem] mt-4 transition-all shadow-xl shadow-primary-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                CONFIRMAR REGISTRO
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
