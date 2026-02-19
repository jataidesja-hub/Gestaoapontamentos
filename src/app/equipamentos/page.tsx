"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Truck } from "lucide-react";
import { fetchEquipments, addEquipment } from "@/lib/api";

export default function EquipmentsPage() {
    const [equipments, setEquipments] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        nome: "",
        placa: "",
        tipo: "Caminhão",
        categoria: "KM",
        valorMensal: ""
    });

    useEffect(() => {
        loadEquipments();
    }, []);

    async function loadEquipments() {
        try {
            const data = await fetchEquipments();
            setEquipments(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            await addEquipment(formData);
            setIsModalOpen(false);
            loadEquipments();
            setFormData({ nome: "", placa: "", tipo: "Caminhão", categoria: "KM", valorMensal: "" });
        } catch (error) {
            alert("Erro ao salvar equipamento");
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Equipamentos</h2>
                    <p className="text-slate-500">Gerencie sua frota e regras de medição.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg active:scale-95"
                >
                    <Plus size={20} />
                    Novo Equipamento
                </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Nome / Placa</th>
                            <th className="px-6 py-4 font-semibold">Tipo</th>
                            <th className="px-6 py-4 font-semibold">Medição</th>
                            <th className="px-6 py-4 font-semibold">Valor Mensal</th>
                            <th className="px-6 py-4 font-semibold text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Carregando...</td></tr>
                        ) : equipments.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Nenhum equipamento cadastrado.</td></tr>
                        ) : equipments.map((eq: any) => (
                            <tr key={eq.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900">{eq.nome}</div>
                                    <div className="text-xs text-slate-400">{eq.placa}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                                        <Truck size={12} /> {eq.tipo}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${eq.categoria === 'KM' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                        {eq.categoria}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-semibold text-slate-700">
                                    R$ {Number(eq.valor_mensal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all">
                                        <Trash2 size={18} />
                                    </button>
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
                            <h3 className="text-xl font-bold text-slate-900">Cadastrar Equipamento</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Nome do Equipamento</label>
                                <input
                                    required
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 transition-all"
                                    value={formData.nome}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                    placeholder="Ex: Escavadeira Caterpillar"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Placa / ID</label>
                                    <input
                                        required
                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 transition-all"
                                        value={formData.placa}
                                        onChange={e => setFormData({ ...formData, placa: e.target.value })}
                                        placeholder="ABC-1234"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Tipo</label>
                                    <select
                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 transition-all"
                                        value={formData.tipo}
                                        onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                                    >
                                        <option>Caminhão</option>
                                        <option>Escavadeira</option>
                                        <option>Trator</option>
                                        <option>Outro</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Medição</label>
                                    <select
                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 transition-all font-bold"
                                        value={formData.categoria}
                                        onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                                    >
                                        <option value="KM">Quilometragem (KM)</option>
                                        <option value="H">Horímetro (H)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Valor Mensal</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 transition-all"
                                        value={formData.valorMensal}
                                        onChange={e => setFormData({ ...formData, valorMensal: e.target.value })}
                                        placeholder="10000.00"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-2xl mt-4 transition-all shadow-lg shadow-primary-200 active:scale-95"
                            >
                                Salvar Equipamento
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
