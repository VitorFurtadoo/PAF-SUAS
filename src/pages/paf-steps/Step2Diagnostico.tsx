import React, { useState } from 'react';
import { motion } from 'motion/react';
import type { PAFData, SituacaoFamiliar } from '../../types';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import InfoTooltip from '../../components/InfoTooltip';

interface Props {
  data: PAFData;
  handleChange: (field: keyof PAFData, value: any) => void;
  toggleVulnerabilidade: (vuln: string) => void;
  addSituacao: (situacao: string) => void;
  updateSituacao: (id: string, field: keyof SituacaoFamiliar, value: any) => void;
  removeSituacao: (id: string) => void;
}

const VULNERABILIDADES = [
  'Famílias de baixa renda',
  'Famílias beneficiárias do Programa Bolsa Família',
  'Famílias beneficiárias do Programa Bolsa Família, em não cumprimento de condicionalidades',
  'Famílias com membros beneficiários do Benefício de Prestação Continuada - BPC',
  'Famílias que atendem aos critérios de elegibilidade do Programa Bolsa Família e do BPC, mas que ainda não foram beneficiadas',
  'Famílias em situação de vulnerabilidade em decorrência de dificuldades vivenciadas por algum de seus membros',
  'Pessoas com deficiência e/ou pessoas idosas que vivenciam situações de vulnerabilidade e risco social',
  'Famílias com crianças ou adolescentes em situação de trabalho infantil',
  'Famílias com crianças ou adolescentes em Serviço de Acolhimento Institucional',
  'Outros'
];

const PREDEFINED_SITUATIONS = [
  'Ausência de documentação civil', 'Precária situação de moradia', 'Dificuldade de acesso a serviços públicos/benefícios',
  'Vivendo em territórios de conflitos fundiários', 'Em contextos de violência', 'Desemprego', 'Família de baixa renda',
  'Família vivendo na linha da pobreza', 'Analfabetismo', 'Baixo nível de escolaridade', 'Ausência de qualificação profissional',
  'Criança/adolescente fora da escola', 'Criança/adolescente com baixa frequência escolar', 'Beneficiária do PBF',
  'Beneficiária do PBF, em não cumprimento de condicionalidades', 'Beneficiária(s) do BPC', 'Famílias elegíveis ao PBF',
  'Famílias elegíveis ao BPC', 'Situação de Trabalho infantil', 'Membro da família em privação de liberdade',
  'Egresso de sistema penitenciário', 'Adolescentes em cumprimento de MSE\'s', 'Membro da família em Serviço de Acolhimento',
  'Uso abusivo de álcool e outras drogas', 'Ausência de cuidados e responsabilidades mútuas', 'Fragilidade do vínculo entre os membros',
  'Fragilidade da capacidade de vínculos comunitários', 'Vivência de situações de discriminação', 'Conflitos constantes entre adultos da família',
  'Questões relacionadas a saúde mental', 'Membro com problemas de saúde com doença limitadora', 'Familiares que cuidam de outros',
  'Pessoa(s) com deficiência(s)', 'Presença de idosos com dependência em casa sem companhia', 'Maternidade/Paternidade na adolescência',
  'Crianças pequenas que permanecem períodos do dia em casa', 'Falecimento de algum membro da família', 'Família que reside a pouco tempo na cidade',
  'Vários membros da Família dormindo no mesmo cômodo', 'Outras situações'
];

export default function Step2Diagnostico({ data, handleChange, toggleVulnerabilidade, addSituacao, updateSituacao, removeSituacao }: Props) {
  const [newSit, setNewSit] = useState('');
  const [expandedSit, setExpandedSit] = useState<string | null>(null);

  const handleAddSit = () => {
    if (newSit) {
      addSituacao(newSit);
      setNewSit('');
    }
  };

  return (
    <div className="space-y-8">
      {/* I - DIAGNÓSTICO */}
      <section>
        <h3 className="text-lg font-bold text-brand-secondary mb-4 border-b border-slate-200 pb-2 flex items-center">
          I - DIAGNÓSTICO
          <InfoTooltip text="Identifique as principais vulnerabilidades que justificam o acompanhamento familiar no PAIF." />
        </h3>
        <p className="text-sm font-semibold text-slate-700 mb-4">Família inserida em acompanhamento familiar no PAIF para superação da(s) seguinte(s) vulnerabilidade(s):</p>
        
        <div className="space-y-3 bg-slate-50 p-6 rounded-lg border border-slate-200">
          {VULNERABILIDADES.map((vuln, idx) => (
            <label key={idx} className="flex items-start space-x-3 p-2 hover:bg-white rounded-lg transition-colors cursor-pointer group">
              <div className="pt-0.5">
              <input 
                type="checkbox" 
                checked={data.vulnerabilidades.includes(vuln)}
                onChange={() => toggleVulnerabilidade(vuln)}
                className="w-5 h-5 text-brand-primary rounded border-slate-300 focus:ring-brand-primary"
              />
              </div>
              <span className="text-slate-700 select-none group-hover:text-slate-900 text-sm">{vuln}</span>
            </label>
          ))}
        </div>

        {data.vulnerabilidades.includes('Outros') && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-4 bg-white border border-slate-200 rounded-lg"
          >
            <label className="block text-xs font-bold text-slate-500 mb-1">Especifique as outras vulnerabilidades:</label>
            <input 
              type="text" 
              value={data.vulnerabilidadesOutros || ''} 
              onChange={e => handleChange('vulnerabilidadesOutros', e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
              required
            />
          </motion.div>
        )}
      </section>

      {/* II - SOBRE O GRUPO FAMILIAR */}
      <section>
        <h3 className="text-lg font-bold text-brand-secondary mb-4 border-b border-slate-200 pb-2">II - SOBRE O GRUPO FAMILIAR</h3>
        
        <div className="mb-6">
          <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">
            a) Vulnerabilidades e riscos sociais a serem superados, geradas pelas múltiplas expressões da questão social
            <InfoTooltip text="Descreva como a pobreza, ausência de renda, e acessos precários se manifestam na vida desta família específica." />
          </label>
          <textarea 
            value={data.vulnerabilidadesMutiplasDescricao} 
            onChange={e => handleChange('vulnerabilidadesMutiplasDescricao', e.target.value)}
            className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-brand-primary resize-y"
            placeholder="Descreva detalhadamente..."
          />
        </div>

        <div className="mb-8">
          <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">
            b) Potencialidades do grupo familiar
            <InfoTooltip text="Destaque as forças, recursos internos, vínculos afetivos e capacidades da família que podem ser mobilizados para superar as dificuldades." />
          </label>
          <textarea 
            value={data.potencialidadesGrupoFamiliar || ''} 
            onChange={e => handleChange('potencialidadesGrupoFamiliar', e.target.value)}
            className="w-full h-32 p-4 bg-emerald-50/20 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-brand-primary resize-y"
            placeholder="Identifique as fortalezas e recursos que a família já possui..."
          />
        </div>

        <div>
          <h4 className="text-sm font-bold text-brand-primary mb-4 flex items-center">
            Tabela de Mapeamento de Situações
            <InfoTooltip text="Utilize esta tabela para detalhar situações específicas de cada membro, permitindo o monitoramento individual da superação de riscos." />
          </h4>
          <div className="flex gap-2 mb-6">
            <select 
              value={newSit} 
              onChange={e => setNewSit(e.target.value)}
              className="flex-1 p-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-brand-primary outline-none"
            >
              <option value="">-- Selecione uma situação para adicionar --</option>
              {PREDEFINED_SITUATIONS.filter(s => !data.situacoes.map(sit => sit.situacao).includes(s)).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button 
              type="button" 
              onClick={handleAddSit}
              disabled={!newSit}
              className="bg-brand-primary disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold flex items-center hover:bg-brand-secondary transition"
            >
              <Plus size={18} className="mr-1" /> Adicionar
            </button>
          </div>

          <div className="space-y-4">
            {data.situacoes.length === 0 && (
              <p className="text-center text-slate-500 py-8 bg-slate-50 border border-dashed border-slate-300 rounded-lg">Nenhuma situação específica mapeada ainda.</p>
            )}
            
            {data.situacoes.map((sit) => {
              const isExpanded = expandedSit === sit.id;
              return (
                <div key={sit.id} className="border border-slate-200 rounded-lg overflow-hidden">
                  <div 
                    onClick={() => setExpandedSit(isExpanded ? null : sit.id)}
                    className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${isExpanded ? 'bg-brand-light border-b border-slate-200' : 'bg-white hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-800">{sit.situacao}</span>
                      {sit.vulnerabilidadeSuperada && (
                        <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-green-100 text-green-700 rounded-full border border-green-200">Superada</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="p-5 bg-slate-50 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Membro(s) da Família</label>
                          <input type="text" value={sit.membros} onChange={e => updateSituacao(sit.id, 'membros', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 bg-white" placeholder="Quem se encontra nesta situação?" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Impressão Diagnóstica</label>
                          <input type="text" value={sit.impressaoDiagnostica} onChange={e => updateSituacao(sit.id, 'impressaoDiagnostica', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 bg-white" />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Observações</label>
                        <input type="text" value={sit.observacoes} onChange={e => updateSituacao(sit.id, 'observacoes', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 bg-white" />
                      </div>

                      <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-200">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input type="checkbox" checked={sit.confirmado} onChange={e => updateSituacao(sit.id, 'confirmado', e.target.checked)} className="w-4 h-4 text-brand-primary rounded border-slate-300" />
                          <span className="text-sm font-semibold text-slate-700">Confirmado</span>
                        </label>
                        
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input type="checkbox" checked={sit.vulnerabilidadeSuperada} onChange={e => updateSituacao(sit.id, 'vulnerabilidadeSuperada', e.target.checked)} className="w-4 h-4 text-green-600 rounded border-slate-300 focus:ring-green-500" />
                          <span className="text-sm font-semibold text-slate-700">Vulnerabilidade Superada</span>
                        </label>

                        {sit.vulnerabilidadeSuperada && (
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-500">Data da Superação:</label>
                            <input type="date" value={sit.dataSuperacao} onChange={e => updateSituacao(sit.id, 'dataSuperacao', e.target.value)} className="p-1.5 rounded-lg border border-slate-200 bg-white text-sm" />
                          </div>
                        )}
                        
                        <div className="flex-1 flex justify-end">
                          <button type="button" onClick={() => removeSituacao(sit.id)} className="text-red-500 hover:text-red-700 text-sm font-semibold px-3 py-1.5 hover:bg-red-50 rounded-lg transition">Remover Situação</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
