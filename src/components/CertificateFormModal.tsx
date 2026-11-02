import React, { useState, useEffect } from 'react';
import { Certificate, Vessel } from '../types/maritime';
import { uploadCertificadoPDF } from '../lib/uploadService';
import { 
  X, 
  Calendar, 
  FileCheck, 
  Shield, 
  Wrench, 
  Anchor, 
  Gauge, 
  Upload, 
  Loader2 
} from 'lucide-react';

interface CertificateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cert: Partial<Certificate>) => void | Promise<void>;
  vessels: Vessel[];
  initialData?: Partial<Certificate>;
}

// Opções estendidas de vistorias navais (CSN até 9ª Anual / BL até 6ª Periódica)
const TIPO_VISTORIA_OPTIONS: Record<string, { label: string; value: string }[]> = {
  CSN: [
    { label: 'Vistoria Inicial', value: 'Inicial' },
    { label: '1ª Vistoria Anual', value: '1ª Vistoria Anual' },
    { label: '2ª Vistoria Anual', value: '2ª Vistoria Anual' },
    { label: '3ª Vistoria Anual', value: '3ª Vistoria Anual' },
    { label: '4ª Vistoria Anual', value: '4ª Vistoria Anual' },
    { label: '5ª Vistoria Anual', value: '5ª Vistoria Anual' },
    { label: '6ª Vistoria Anual', value: '6ª Vistoria Anual' },
    { label: '7ª Vistoria Anual', value: '7ª Vistoria Anual' },
    { label: '8ª Vistoria Anual', value: '8ª Vistoria Anual' },
    { label: '9ª Vistoria Anual', value: '9ª Vistoria Anual' },
    { label: 'Vistoria Intermediária', value: 'Vistoria Intermediária' },
    { label: 'Vistoria de Renovação', value: 'Renovação' },
  ],
  BL: [
    { label: 'Emissão / Inicial', value: 'Inicial' },
    { label: '1ª Inspeção Periódica', value: '1ª Inspeção Periódica' },
    { label: '2ª Inspeção Periódica', value: '2ª Inspeção Periódica' },
    { label: '3ª Inspeção Periódica', value: '3ª Inspeção Periódica' },
    { label: '4ª Inspeção Periódica', value: '4ª Inspeção Periódica' },
    { label: '5ª Inspeção Periódica', value: '5ª Inspeção Periódica' },
    { label: '6ª Inspeção Periódica', value: '6ª Inspeção Periódica' },
    { label: 'Vistoria de Renovação', value: 'Renovação' },
  ],
  CASCO: [
    { label: 'Classificação Inicial (CI) / Reclassificação', value: 'CI / Reclassificação' },
    { label: 'Manutenção de Classe - MC1', value: 'Manutenção de Classe - MC1' },
    { label: 'Manutenção de Classe - MC2', value: 'Manutenção de Classe - MC2' },
    { label: 'Manutenção de Classe - MC3', value: 'Manutenção de Classe - MC3' },
    { label: 'Manutenção de Classe - MC4', value: 'Manutenção de Classe - MC4' },
    { label: 'Renovação de Classe / Docagem', value: 'Renovação de Classe / Docagem' },
  ],
  MAQUINAS: [
    { label: 'Classificação Inicial (CI) / Reclassificação', value: 'CI / Reclassificação' },
    { label: 'Manutenção de Classe - MC1', value: 'Manutenção de Classe - MC1' },
    { label: 'Manutenção de Classe - MC2', value: 'Manutenção de Classe - MC2' },
    { label: 'Manutenção de Classe - MC3', value: 'Manutenção de Classe - MC3' },
    { label: 'Manutenção de Classe - MC4', value: 'Manutenção de Classe - MC4' },
    { label: 'Renovação de Classe / Docagem', value: 'Renovação de Classe / Docagem' },
  ]
};

const SOCIEDADES_CLASSIFICADORAS = [
  'Bureau Colombo',
  'Auto Ship',
  'Exata Calibração',
  'RGF-Tecnologia Naval',
  'RBNA (Registro Brasileiro de Navios e Aeronaves)',
  'CFAOC (Capitania Fluvial da Amazonia Ocidental) / Marinha do Brasil',
];

export const CertificateFormModal: React.FC<CertificateFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  vessels,
  initialData
}) => {
  const [formData, setFormData] = useState<any>({
    vessel_id: '',
    categoria: 'CERTIFICADO',
    tipo: 'CSN',
    numero: '',
    tipo_vistoria: '1ª Vistoria Anual',
    data_emissao: new Date().toISOString().split('T')[0],
    data_validade: '',
    orgao_emissor: 'Bureau Colombo',
    responsavel_tecnico: '',
    fabricante_equipamento: '',
    modelo_equipamento: '',
    numero_serie_equipamento: '',
    faixa_medicao: '',
    tracao_estatica_ton: '',
    marca_agulha: '',
    serie_agulha: '',
    local_compensacao: '',
    pressao_trabalho: '',
    pressao_teste: '',
    numero_art: '',
    lacre_tag: '',
    tanque_vinculado: '',
    continuidade_eletrica: '',
    laboratorio_calibracao: '',
    observacoes: '',
    url_documento: '',
    arquivo_path: '',
    ...initialData
  });

  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Sincroniza dados iniciais quando o modal abre ou initialData muda
  useEffect(() => {
    if (isOpen) {
      setFormData({
        vessel_id: '',
        categoria: 'CERTIFICADO',
        tipo: 'CSN',
        numero: '',
        tipo_vistoria: '1ª Vistoria Anual',
        data_emissao: new Date().toISOString().split('T')[0],
        data_validade: '',
        orgao_emissor: 'Bureau Colombo',
        responsavel_tecnico: '',
        fabricante_equipamento: '',
        modelo_equipamento: '',
        numero_serie_equipamento: '',
        faixa_medicao: '',
        tracao_estatica_ton: '',
        marca_agulha: '',
        serie_agulha: '',
        local_compensacao: '',
        pressao_trabalho: '',
        pressao_teste: '',
        numero_art: '',
        lacre_tag: '',
        tanque_vinculado: '',
        continuidade_eletrica: '',
        laboratorio_calibracao: '',
        observacoes: '',
        url_documento: '',
        arquivo_path: '',
        ...initialData
      });
      setFileToUpload(null);
      setIsUploading(false);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    const t = formData.tipo;

    if (['COMPENSACAO_AGULHA', 'CSN', 'BL', 'CASCO', 'MAQUINAS', 'DECLARACAO_CONFORMIDADE', 'TRACAO_ESTATICA'].includes(t)) {
      setFormData((prev: any) => ({ ...prev, categoria: 'CERTIFICADO' }));
    } else if (['OXIMETRO', 'EXPLOSIMETRO', 'TRENA_PROFUNDIDADE', 'TERMOMETRO', 'DENSIMETRO'].includes(t)) {
      setFormData((prev: any) => ({ ...prev, categoria: 'TESTE_EQUIPAMENTO' }));
    } else if (['CARGA_DESCARGA', 'ESTANQUEIDADE', 'MANGOTES', 'VALVULAS'].includes(t)) {
      setFormData((prev: any) => ({ ...prev, categoria: 'TESTE_OPERACIONAL' }));
    }

    const options = TIPO_VISTORIA_OPTIONS[t];
    if (options && options.length > 0) {
      setFormData((prev: any) => ({ ...prev, tipo_vistoria: options[0].value }));
    }
  }, [formData.tipo]);

  if (!isOpen) return null;

  // Submissão assíncrona com upload de documento PDF/Imagem
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUploading(true);
      let finalUrl = formData.url_documento || '';
      let finalPath = formData.arquivo_path || '';

      // Se o usuário selecionou um arquivo local, efetua o upload no Supabase Storage
      if (fileToUpload) {
        const vesselTarget = formData.vessel_id || 'geral';
        const uploadRes = await uploadCertificadoPDF(fileToUpload, vesselTarget);
        finalUrl = uploadRes.url;
        finalPath = uploadRes.path;
      }

      await onSave({
        ...formData,
        url_documento: finalUrl,
        arquivo_path: finalPath,
      });

      onClose();
    } catch (error: any) {
      console.error("Erro ao salvar certificado:", error);
      alert(`Erro no upload/salvamento do documento: ${error.message || 'Falha na operação'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const isNavalCertificate = ['CSN', 'BL', 'CASCO', 'MAQUINAS'].includes(formData.tipo);
  const isEquipmentCalibration = ['OXIMETRO', 'EXPLOSIMETRO', 'TRENA_PROFUNDIDADE', 'TERMOMETRO', 'DENSIMETRO'].includes(formData.tipo);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0b1726] border border-teal-500/30 rounded-2xl w-full max-w-3xl text-slate-100 shadow-2xl overflow-hidden my-8">
        
        {/* CABEÇALHO DO MODAL */}
        <div className="flex justify-between items-center p-5 border-b border-teal-900/50 bg-[#06121e]">
          <h2 className="text-base font-bold text-teal-300 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-teal-400" />
            {initialData?.id ? 'Editar Registro' : 'Cadastrar Documento / Teste Técnico'}
          </h2>
          <button 
            type="button"
            onClick={onClose} 
            disabled={isUploading}
            className="text-slate-400 hover:text-white transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* SELEÇÃO DA EMBARCAÇÃO E TIPO DO DOCUMENTO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800">
            <div>
              <label className="block font-semibold text-teal-300 mb-1">EMBARCAÇÃO VINCULADA *</label>
              <select
                required
                value={formData.vessel_id || ''}
                onChange={(e) => setFormData({ ...formData, vessel_id: e.target.value })}
                className="w-full bg-[#030a12] border border-teal-800/60 rounded-lg p-2.5 text-slate-200 focus:border-teal-400 outline-none"
              >
                <option value="">Selecione a embarcação...</option>
                {vessels.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nome} ({v.tipo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-teal-300 mb-1">TIPO DE DOCUMENTO / LAUDO *</label>
              <select
                required
                value={formData.tipo || ''}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="w-full bg-[#030a12] border border-teal-800/60 rounded-lg p-2.5 text-slate-200 focus:border-teal-400 outline-none font-bold text-teal-200"
              >
                <optgroup label="Certificados Regulatórios & Navais">
                  <option value="CSN">CSN - Segurança da Navegação</option>
                  <option value="BL">BL - Borda Livre</option>
                  <option value="CASCO">Certificado de Casco</option>
                  <option value="MAQUINAS">Certificado de Máquinas</option>
                  <option value="DECLARACAO_CONFORMIDADE">Declaração de Conformidade</option>
                  <option value="COMPENSACAO_AGULHA">Compensação de Agulha Magnética</option>
                  <option value="TRACAO_ESTATICA">Tração Estática (Bollard Pull)</option>
                </optgroup>

                <optgroup label="Testes Operacionais (Petroleiras & Carga)">
                  <option value="CARGA_DESCARGA">Rede de Carga e Descarga</option>
                  <option value="ESTANQUEIDADE">Teste de Estanqueidade de Tanques</option>
                  <option value="MANGOTES">Teste de Mangotes de Carga</option>
                  <option value="VALVULAS">Teste de Válvulas de Segurança (PV)</option>
                </optgroup>

                <optgroup label="Calibração de Equipamentos & Instrumentos">
                  <option value="OXIMETRO">Oxímetro</option>
                  <option value="EXPLOSIMETRO">Explosímetro</option>
                  <option value="TRENA_PROFUNDIDADE">Trena de Profundidade</option>
                  <option value="TERMOMETRO">Termômetro</option>
                  <option value="DENSIMETRO">Densímetro</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* SUB-SELEÇÃO DINÂMICA DE VISTORIAS NAVAIS */}
          {isNavalCertificate && (
            <div className="bg-teal-950/30 p-3.5 rounded-xl border border-teal-800/50 space-y-2">
              <label className="block font-semibold text-teal-300 mb-1 flex items-center gap-1.5">
                <Anchor className="w-4 h-4 text-teal-400" />
                TIPO DA VISTORIA / CICLO DE CONVALIDAÇÃO ({formData.tipo}) *
              </label>
              <select
                value={formData.tipo_vistoria || ''}
                onChange={(e) => setFormData({ ...formData, tipo_vistoria: e.target.value })}
                className="w-full bg-[#030a12] border border-teal-700 rounded-lg p-2.5 text-teal-100 font-semibold focus:border-teal-400 outline-none"
              >
                {TIPO_VISTORIA_OPTIONS[formData.tipo]?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* DADOS DO INSTRUMENTO DE MEDIÇÃO & CALIBRAÇÃO */}
          {isEquipmentCalibration && (
            <div className="bg-sky-950/20 border border-sky-500/30 p-3.5 rounded-xl space-y-3">
              <span className="text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5" /> DADOS DO INSTRUMENTO DE MEDIÇÃO & CALIBRAÇÃO
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">FABRICANTE</label>
                  <input
                    type="text"
                    placeholder="Ex: Instrutherm, Incoterm, Starrett"
                    value={formData.fabricante_equipamento || ''}
                    onChange={(e) => setFormData({ ...formData, fabricante_equipamento: e.target.value })}
                    className="w-full bg-[#030a12] border border-sky-800/50 rounded-lg p-2 text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">MODELO</label>
                  <input
                    type="text"
                    placeholder="Ex: EXP-1000, MO-900, DP"
                    value={formData.modelo_equipamento || ''}
                    onChange={(e) => setFormData({ ...formData, modelo_equipamento: e.target.value })}
                    className="w-full bg-[#030a12] border border-sky-800/50 rounded-lg p-2 text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Nº DE SÉRIE / IDENTIFICAÇÃO</label>
                  <input
                    type="text"
                    placeholder="Ex: 017111524034, 46326/17"
                    value={formData.numero_serie_equipamento || ''}
                    onChange={(e) => setFormData({ ...formData, numero_serie_equipamento: e.target.value })}
                    className="w-full bg-[#030a12] border border-sky-800/50 rounded-lg p-2 text-slate-200 font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">FAIXA DE MEDIÇÃO</label>
                  <input
                    type="text"
                    placeholder="Ex: 0,750~0,800 g/ml, 0-30m, -10~50°C"
                    value={formData.faixa_medicao || ''}
                    onChange={(e) => setFormData({ ...formData, faixa_medicao: e.target.value })}
                    className="w-full bg-[#030a12] border border-sky-800/50 rounded-lg p-2 text-slate-200 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* DADOS DO ENSAIO DE TRAÇÃO ESTÁTICA */}
          {formData.tipo === 'TRACAO_ESTATICA' && (
            <div className="bg-amber-950/20 border border-amber-500/30 p-3.5 rounded-xl space-y-3">
              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                <Anchor className="w-3.5 h-3.5" /> DADOS DO ENSAIO DE TRAÇÃO ESTÁTICA (BOLLARD PULL)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">TRAÇÃO REGISTRADA (tf / kN)</label>
                  <input
                    type="text"
                    placeholder="Ex: 64,61 tf (633,56 kN)"
                    value={formData.tracao_estatica_ton || ''}
                    onChange={(e) => setFormData({ ...formData, tracao_estatica_ton: e.target.value })}
                    className="w-full bg-[#030a12] border border-amber-800/50 rounded-lg p-2 text-slate-200 font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">LOCAL / ESTALEIRO DO ENSAIO</label>
                  <input
                    type="text"
                    placeholder="Ex: Estaleiro D. Melo de Souza Helitec"
                    value={formData.local_compensacao || ''}
                    onChange={(e) => setFormData({ ...formData, local_compensacao: e.target.value })}
                    className="w-full bg-[#030a12] border border-amber-800/50 rounded-lg p-2 text-slate-200 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* AGULHA MAGNÉTICA */}
          {formData.tipo === 'COMPENSACAO_AGULHA' && (
            <div className="bg-amber-950/20 border border-amber-500/30 p-3.5 rounded-xl space-y-3">
              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> DADOS DA AGULHA MAGNÉTICA
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">MARCA DA AGULHA</label>
                  <input
                    type="text"
                    placeholder="Ex: Ritchie-Powerdamps"
                    value={formData.marca_agulha || ''}
                    onChange={(e) => setFormData({ ...formData, marca_agulha: e.target.value })}
                    className="w-full bg-[#030a12] border border-amber-800/50 rounded-lg p-2 text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Nº SÉRIE DA AGULHA</label>
                  <input
                    type="text"
                    placeholder="Ex: S/N ou Registro"
                    value={formData.serie_agulha || ''}
                    onChange={(e) => setFormData({ ...formData, serie_agulha: e.target.value })}
                    className="w-full bg-[#030a12] border border-amber-800/50 rounded-lg p-2 text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">LOCAL DA COMPENSAÇÃO</label>
                  <input
                    type="text"
                    placeholder="Ex: Rio Negro - Manaus - AM"
                    value={formData.local_compensacao || ''}
                    onChange={(e) => setFormData({ ...formData, local_compensacao: e.target.value })}
                    className="w-full bg-[#030a12] border border-amber-800/50 rounded-lg p-2 text-slate-200 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TESTE DE MANGOTES */}
          {formData.tipo === 'MANGOTES' && (
            <div className="bg-cyan-950/20 border border-cyan-500/30 p-3.5 rounded-xl space-y-3">
              <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" /> PARÂMETROS DO MANGOTE & LACRE
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">DIMENSÕES (DIÂM. x COMPR.)</label>
                  <input
                    type="text"
                    placeholder="Ex: 4'' x 20,100 m"
                    value={formData.observacoes || ''}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    className="w-full bg-[#030a12] border border-cyan-800/50 rounded-lg p-2 text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Nº DO LACRE / TAG</label>
                  <input
                    type="text"
                    placeholder="Ex: 002/26"
                    value={formData.lacre_tag || ''}
                    onChange={(e) => setFormData({ ...formData, lacre_tag: e.target.value })}
                    className="w-full bg-[#030a12] border border-cyan-800/50 rounded-lg p-2 text-slate-200 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">PRESSÃO TESTE (kgf/cm²)</label>
                  <input
                    type="text"
                    placeholder="Ex: 10,5 kgf/cm²"
                    value={formData.pressao_teste || ''}
                    onChange={(e) => setFormData({ ...formData, pressao_teste: e.target.value })}
                    className="w-full bg-[#030a12] border border-cyan-800/50 rounded-lg p-2 text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">CONTINUIDADE ELÉTRICA</label>
                  <input
                    type="text"
                    placeholder="Ex: 4 ohms (Aprovado)"
                    value={formData.continuidade_eletrica || ''}
                    onChange={(e) => setFormData({ ...formData, continuidade_eletrica: e.target.value })}
                    className="w-full bg-[#030a12] border border-cyan-800/50 rounded-lg p-2 text-slate-200 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* VÁLVULA DE SEGURANÇA (PV) */}
          {formData.tipo === 'VALVULAS' && (
            <div className="bg-teal-950/20 border border-teal-500/30 p-3.5 rounded-xl space-y-3">
              <span className="text-[11px] font-bold text-teal-300 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5" /> LOCALIZAÇÃO E TANQUE DA VÁLVULA (PV)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">TAG / IDENTIFICAÇÃO</label>
                  <input
                    type="text"
                    placeholder="Ex: PV 01, PV 02"
                    value={formData.lacre_tag || ''}
                    onChange={(e) => setFormData({ ...formData, lacre_tag: e.target.value })}
                    className="w-full bg-[#030a12] border border-teal-800/50 rounded-lg p-2 text-slate-200 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">TANQUE DA EMBARCAÇÃO</label>
                  <input
                    type="text"
                    placeholder="Ex: TQ 01 BB, TQ 02 BE"
                    value={formData.tanque_vinculado || ''}
                    onChange={(e) => setFormData({ ...formData, tanque_vinculado: e.target.value })}
                    className="w-full bg-[#030a12] border border-teal-800/50 rounded-lg p-2 text-slate-200 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">LABORATÓRIO ACREDITADO</label>
                  <input
                    type="text"
                    placeholder="Ex: Exata Calibração, MCO"
                    value={formData.laboratorio_calibracao || ''}
                    onChange={(e) => setFormData({ ...formData, laboratorio_calibracao: e.target.value })}
                    className="w-full bg-[#030a12] border border-teal-800/50 rounded-lg p-2 text-slate-200 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* DADOS GERAIS DO DOCUMENTO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-teal-300 mb-1">Nº DO DOCUMENTO / CERTIFICADO *</label>
              <input
                type="text"
                required
                placeholder="Ex: 10201-26, TTE-RGF020-24"
                value={formData.numero || ''}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                className="w-full bg-[#030a12] border border-teal-800/60 rounded-lg p-2.5 text-slate-200 font-mono focus:border-teal-400 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-teal-300 mb-1">ÓRGÃO / LABORATÓRIO / EXECUTOR *</label>
              <input
                type="text"
                required
                list="sociedades-list"
                placeholder="Ex: RGF Tecnologia Naval, Exata Calibração..."
                value={formData.orgao_emissor || ''}
                onChange={(e) => setFormData({ ...formData, orgao_emissor: e.target.value })}
                className="w-full bg-[#030a12] border border-teal-800/60 rounded-lg p-2.5 text-slate-200 focus:border-teal-400 outline-none"
              />
              <datalist id="sociedades-list">
                {SOCIEDADES_CLASSIFICADORAS.map((soc, idx) => (
                  <option key={idx} value={soc} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block font-semibold text-teal-300 mb-1">RESPONSÁVEL TÉCNICO / PERITO</label>
              <input
                type="text"
                placeholder="Ex: Paulo Moreira (CFT: 10938) ou Ricardo Sanches"
                value={formData.responsavel_tecnico || ''}
                onChange={(e) => setFormData({ ...formData, responsavel_tecnico: e.target.value })}
                className="w-full bg-[#030a12] border border-teal-800/60 rounded-lg p-2.5 text-slate-200 focus:border-teal-400 outline-none"
              />
            </div>
          </div>

          {/* DATAS E REGISTRO PROFISSIONAL */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-teal-950/20 p-3.5 rounded-xl border border-teal-800/40">
            <div>
              <label className="block font-semibold text-teal-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-teal-400" /> DATA EMISSÃO / CALIBRAÇÃO *
              </label>
              <input
                type="date"
                required
                value={formData.data_emissao || ''}
                onChange={(e) => setFormData({ ...formData, data_emissao: e.target.value })}
                className="w-full bg-[#030a12] border border-teal-800/60 rounded-lg p-2.5 text-slate-200 focus:border-teal-400 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-amber-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" /> DATA VENCIMENTO / PRÓX. CALIBRAÇÃO *
              </label>
              <input
                type="date"
                required
                value={formData.data_validade || ''}
                onChange={(e) => setFormData({ ...formData, data_validade: e.target.value })}
                className="w-full bg-[#030a12] border border-amber-600/60 rounded-lg p-2.5 text-slate-200 focus:border-amber-400 outline-none font-bold text-amber-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-cyan-300 mb-1">REGISTRO CREA / CFT / ART</label>
              <input
                type="text"
                placeholder="Ex: CFT: 10938 ou CREA: 2605217256"
                value={formData.numero_art || ''}
                onChange={(e) => setFormData({ ...formData, numero_art: e.target.value })}
                className="w-full bg-[#030a12] border border-cyan-800/60 rounded-lg p-2.5 text-slate-200 font-mono outline-none"
              />
            </div>
          </div>

          {/* SEÇÃO DE ANEXO DE LAUDO / CERTIFICADO DIGITALIZADO (SUPABASE STORAGE) */}
          <div className="bg-[#030a12] p-3.5 rounded-xl border border-teal-800/50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-teal-300 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-teal-400" />
                DOCUMENTO DIGITALIZADO / LAUDO (PDF OU IMAGEM)
              </label>
              {formData.url_documento && (
                <a
                  href={formData.url_documento}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-teal-400 underline hover:text-teal-300 font-medium"
                >
                  Ver documento atual
                </a>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                id="file-upload-input"
                className="hidden"
                disabled={isUploading}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFileToUpload(e.target.files[0]);
                  }
                }}
              />
              <label
                htmlFor="file-upload-input"
                className={`px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold rounded-lg cursor-pointer flex items-center justify-center gap-2 transition-all text-xs ${
                  isUploading ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <Upload className="w-4 h-4" />
                {fileToUpload ? 'Alterar Arquivo' : 'Selecionar PDF / Imagem'}
              </label>

              <span className="text-slate-300 truncate text-xs flex-1 bg-[#0b1726] px-3 py-2.5 rounded-lg border border-slate-800">
                {fileToUpload 
                  ? `Arquivo selecionado: ${fileToUpload.name}` 
                  : (formData.url_documento ? 'Possui documento já anexado' : 'Nenhum arquivo selecionado')}
              </span>
            </div>
          </div>

          {/* BOTÕES DE AÇÃO COM INDICADOR DE UPLOAD */}
          <div className="flex justify-between items-center pt-4 border-t border-teal-900/50">
            <div className="text-teal-400 text-xs font-semibold">
              {isUploading && (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                  <span>Enviando documento ao Supabase Storage...</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Registro'
                )}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CertificateFormModal;