import React, { useState, useEffect } from "react";
import { X, Ship, Save, Building, Hammer } from "lucide-react";
import { Vessel, SituacaoEmbarcacao } from "../types/maritime";
import { SITUACOES_EMBARCACAO, sanitizeInput } from "../lib/maritime-utils";

interface VesselModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vessel: Vessel) => void;
  vesselToEdit?: Vessel | null;
}

export const VesselModal: React.FC<VesselModalProps> = ({
  isOpen,
  onClose,
  onSave,
  vesselToEdit,
}) => {
  const [formData, setFormData] = useState({
    nome: "",
    inscricao: "",
    tipo: "Empurrador Fluvial",
    trecho: "",
    situacao: "Ativa" as SituacaoEmbarcacao,
    indicativo_chamada: "",
    documento_propriedade: "",
    arqueacao_bruta: "",
    proprietario: "",
    construtor: "",
    ano_construcao: "",
    porto_inscricao: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (vesselToEdit) {
      setFormData({
        nome: vesselToEdit.nome || "",
        inscricao: vesselToEdit.inscricao || "",
        tipo: vesselToEdit.tipo || "Empurrador Fluvial",
        trecho: vesselToEdit.trecho || "",
        situacao: vesselToEdit.situacao || "Ativa",
        indicativo_chamada: vesselToEdit.indicativo_chamada || "",
        documento_propriedade: vesselToEdit.documento_propriedade || "",
        arqueacao_bruta: vesselToEdit.arqueacao_bruta ? String(vesselToEdit.arqueacao_bruta) : "",
        proprietario: vesselToEdit.proprietario || "",
        construtor: vesselToEdit.construtor || "",
        ano_construcao: vesselToEdit.ano_construcao ? String(vesselToEdit.ano_construcao) : "",
        porto_inscricao: vesselToEdit.porto_inscricao || "",
      });
    } else {
      setFormData({
        nome: "",
        inscricao: "",
        tipo: "Empurrador Fluvial",
        trecho: "",
        situacao: "Ativa",
        indicativo_chamada: "",
        documento_propriedade: "",
        arqueacao_bruta: "",
        proprietario: "",
        construtor: "",
        ano_construcao: "",
        porto_inscricao: "",
      });
    }
    setErrors({});
  }, [vesselToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const nome = sanitizeInput(formData.nome);
    const inscricao = sanitizeInput(formData.inscricao);

    if (!nome) newErrors.nome = "Nome da embarcação é obrigatório.";
    if (!inscricao) newErrors.inscricao = "Nº de inscrição é obrigatório.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const vesselData: Vessel = {
      id: vesselToEdit ? vesselToEdit.id : `vsl-${Date.now()}`,
      nome,
      inscricao,
      tipo: sanitizeInput(formData.tipo),
      trecho: sanitizeInput(formData.trecho) || undefined,
      situacao: formData.situacao,
      indicativo_chamada: sanitizeInput(formData.indicativo_chamada) || undefined,
      documento_propriedade: sanitizeInput(formData.documento_propriedade) || undefined,
      arqueacao_bruta: formData.arqueacao_bruta ? Number(formData.arqueacao_bruta) : undefined,
      proprietario: sanitizeInput(formData.proprietario) || undefined,
      construtor: sanitizeInput(formData.construtor) || undefined,
      ano_construcao: formData.ano_construcao ? Number(formData.ano_construcao) : undefined,
      porto_inscricao: sanitizeInput(formData.porto_inscricao) || undefined,
      created_at: vesselToEdit ? vesselToEdit.created_at : new Date().toISOString(),
    };

    onSave(vesselData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-950 text-sky-400 border border-sky-800/60">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {vesselToEdit ? "Editar Embarcação" : "Nova Embarcação"}
              </h2>
              <p className="text-xs text-slate-400">
                Cadastro técnico, construtor, proprietário e especificações operacionais
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nome */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Nome da Embarcação <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex.: Empurrador Fluvial Rio Madeira IX"
                className={`w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                  errors.nome ? "border-rose-500" : "border-slate-800"
                }`}
              />
              {errors.nome && <p className="text-xs text-rose-400 mt-1">{errors.nome}</p>}
            </div>

            {/* Inscrição */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Nº de Inscrição <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.inscricao}
                onChange={(e) => setFormData({ ...formData, inscricao: e.target.value })}
                placeholder="Ex.: 021-008392-4"
                className={`w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border text-sm text-white font-mono placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                  errors.inscricao ? "border-rose-500" : "border-slate-800"
                }`}
              />
              {errors.inscricao && <p className="text-xs text-rose-400 mt-1">{errors.inscricao}</p>}
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Tipo da Embarcação
              </label>
              <input
                type="text"
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                placeholder="Ex.: Empurrador Fluvial, Balsa Graneleira..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* PROPRIETÁRIO */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-sky-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" />
                Proprietário / Armador Responsável
              </label>
              <input
                type="text"
                value={formData.proprietario}
                onChange={(e) => setFormData({ ...formData, proprietario: e.target.value })}
                placeholder="Ex.: Navegação & Logística Amazônia S/A"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* CONSTRUTOR */}
            <div>
              <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Hammer className="w-3.5 h-3.5" />
                Estaleiro Construtor / Construtor
              </label>
              <input
                type="text"
                value={formData.construtor}
                onChange={(e) => setFormData({ ...formData, construtor: e.target.value })}
                placeholder="Ex.: Estaleiro Rio Maguari S/A, Wilson Sons..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* ANO CONSTRUÇÃO */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Ano de Construção
              </label>
              <input
                type="number"
                min={1950}
                max={2035}
                value={formData.ano_construcao}
                onChange={(e) => setFormData({ ...formData, ano_construcao: e.target.value })}
                placeholder="Ex.: 2020"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-mono"
              />
            </div>

            {/* Situação */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Situação Operacional
              </label>
              <select
                value={formData.situacao}
                onChange={(e) => setFormData({ ...formData, situacao: e.target.value as SituacaoEmbarcacao })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {SITUACOES_EMBARCACAO.map((sit) => (
                  <option key={sit} value={sit}>
                    {sit}
                  </option>
                ))}
              </select>
            </div>

            {/* Arqueação Bruta (AB) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Arqueação Bruta (AB)
              </label>
              <input
                type="number"
                step="any"
                value={formData.arqueacao_bruta}
                onChange={(e) => setFormData({ ...formData, arqueacao_bruta: e.target.value })}
                placeholder="Ex.: 450"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-mono"
              />
            </div>

            {/* Trecho / Hidrovia */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Trecho / Hidrovia / Contrato
              </label>
              <input
                type="text"
                value={formData.trecho}
                onChange={(e) => setFormData({ ...formData, trecho: e.target.value })}
                placeholder="Ex.: Manaus - Itacoatiara"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Porto / Local de Inscrição */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Porto / Local de Inscrição
              </label>
              <input
                type="text"
                value={formData.porto_inscricao}
                onChange={(e) => setFormData({ ...formData, porto_inscricao: e.target.value })}
                placeholder="Ex.: Manaus / Santarém / Santos"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Indicativo de Chamada */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Indicativo de Chamada (Rádio)
              </label>
              <input
                type="text"
                value={formData.indicativo_chamada}
                onChange={(e) => setFormData({ ...formData, indicativo_chamada: e.target.value })}
                placeholder="Ex.: PP-7190"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-mono"
              />
            </div>

            {/* Documento de Propriedade */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Documento de Registro (TIE / DPP / PRPM)
              </label>
              <input
                type="text"
                value={formData.documento_propriedade}
                onChange={(e) => setFormData({ ...formData, documento_propriedade: e.target.value })}
                placeholder="Ex.: PRPM nº 45.109/2021"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-950 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{vesselToEdit ? "Salvar Alterações" : "Cadastrar Embarcação"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
