"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Calendar, Activity } from "lucide-react";
import { fetchEquipments, fetchEntries, addEntry } from "@/lib/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function LançamentosPage() {
    const [entries, setEntries] = useState<any[]>([]);
    const [equipments, setEquipments] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

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

    // Lógica de buscar o último valor final
    useEffect(() => {
        if (formData.idEquipamento) {
            const lastEntry = entries
                .filter(entry => entry.id_equipamento === formData.idEquipamento)
                .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];

            if (lastEntry) {
                setFormData(prev => ({ ...prev, valorInicial: lastEntry.valor_final }));
            } else {
                setFormData(prev => ({ ...prev, valorInicial: "" }));
            }
        }
    }, [formData.idEquipamento, entries]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            await addEntry(formData);
            setIsModalOpen(false);
            loadData();
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
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Data</th>
                            <th className="px-6 py-4 font-semibold">Equipamento</th>
                            <th className="px-6 py-4 font-semibold">Inicial</th>
                            <th className="px-6 py-4 font-semibold">Final</th>
                            <th className="px-6 py-4 font-semibold">Produção</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Carregando...</td></tr>
                        ) : entries.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Nenhum lançamento encontrado.</td></tr>
                        ) : entries.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map((entry: any, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-600">
                                    {format(new Date(entry.data), 'dd/MM/yyyy')}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-800">
                                        {equipments.find(e => e.id === entry.id_equipamento)?.nome || entry.id_equipamento}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-500">{entry.valor_inicial}</td>
                                <td className="px-6 py-4 text-slate-800 font-semibold">{entry.valor_final}</td>
                                <td className="px-6 py-4">
                                    <span className="text-primary-600 font-bold">
                                        {(Number(entry.valor_final) - Number(entry.valor_inicial)).toFixed(1)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${entry.status === 'Ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                        {entry.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900">Novo Lançamento</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Equipamento</label>
                                <select
                                    required
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 transition-all font-semibold"
                                    value={formData.idEquipamento}
                                    onChange={e => setFormData({ ...formData, idEquipamento: e.target.value })}
                                >
                                    <option value="">Selecione um equipamento...</option>
                                    {equipments.map(eq => (
                                        <option key={eq.id} value={eq.id}>{eq.nome} ({eq.placa})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Data</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 transition-all"
                                        value={formData.data}
                                        onChange={e => setFormData({ ...formData, data: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Status</label>
                                    <select
                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 transition-all font-bold"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="Ativo">Ativo</option>
                                        <option value="Quebrado">Quebrado</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Valor Inicial</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed"
                                        value={formData.valorInicial}
                                        readOnly
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">* Busca automática</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Valor Final</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 transition-all font-bold"
                                        value={formData.valorFinal}
                                        onChange={e => setFormData({ ...formData, valorFinal: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-2xl mt-4 transition-all shadow-lg shadow-primary-200 active:scale-95"
                            >
                                Salvar Lançamento
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
