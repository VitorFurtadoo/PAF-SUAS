import React, { useState } from 'react';
import type { PAFData, Goal } from '../../types';
import { Plus, Trash2, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import InfoTooltip from '../../components/InfoTooltip';

interface Props {
  data: PAFData;
  handleChange: (field: keyof PAFData, value: any) => void;
  toggleCheckbox: (list: string[], item: string, field: keyof PAFData) => void;
  handleGoalChange: (listName: 'metasFamilia' | 'metasEquipe', index: number, field: keyof Goal, value: string) => void;
  addGoal: (listName: 'metasFamilia' | 'metasEquipe', metaText?: string) => void;
  removeGoal: (listName: 'metasFamilia' | 'metasEquipe', index: number) => void;
}

const ESTRATEGIAS = ['Atendimento técnico', 'Atendimento multiprofissional', 'Visita domiciliar', 'Inserção no SCFV', 'Elaboração de relatório externo', 'Articulação com a rede socioassistencial e/ou intersetorial', 'Estudo Social', 'Oficinas com famílias', 'Ações particularizadas', 'Participação em ações comunitárias', 'Encaminhamentos'];
const EIXOS = ['Educação', 'Saúde', 'Habitação', 'Trabalho', 'Qualificação Profissional/Cursos', 'Sociocultural/Esporte e Lazer', 'Serviços Socioassistenciais', 'Documentação', 'Aspectos jurídicos', 'Sistema de justiça', 'Conselho Tutelar', 'OSC\'s', 'Programas e benefícios socioassistenciais'];

export default function Step4MetasEstrategias({ data, handleChange, toggleCheckbox, handleGoalChange, addGoal, removeGoal }: Props) {
  const [newGoalText, setNewGoalText] = useState<{ metasFamilia: string, metasEquipe: string }>({ metasFamilia: '', metasEquipe: '' });

  const handleQuickAdd = (listName: 'metasFamilia' | 'metasEquipe') => {
    const text = newGoalText[listName].trim();
    if (!text) return;
    addGoal(listName, text);
    setNewGoalText(prev => ({ ...prev, [listName]: '' }));
  };

  const renderGoalSection = (title: string, listName: 'metasFamilia' | 'metasEquipe') => {
    const goals = data[listName];
    const isFamily = listName === 'metasFamilia';
    
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${isFamily ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
              <Target size={22} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-800 leading-tight">
                {title}
              </h4>
              <p className="text-xs text-slate-500 font-medium lowercase">
                {goals.length} {goals.length === 1 ? 'meta definida' : 'metas definidas'}
              </p>
            </div>
          </div>
          <InfoTooltip text={isFamily ? "Objetivos pactuados com a família para o acompanhamento." : "Compromissos da equipe técnica."} />
        </div>
        
        <div className="space-y-4 mb-6">
          {goals.length === 0 ? (
             <div className="text-center py-12 px-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <Plus size={24} className="text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-400">Nenhuma meta registrada para {isFamily ? 'a família' : 'a equipe'}.</p>
             </div>
          ) : (
            goals.map((m, idx) => (
              <div key={m.id} className="group relative bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${isFamily ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Objetivo / Meta #{idx + 1}</label>
                      <input 
                        type="text" 
                        value={m.meta} 
                        onChange={e => handleGoalChange(listName, idx, 'meta', e.target.value)} 
                        className="w-full text-sm font-bold text-slate-800 bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-300 placeholder:italic" 
                        placeholder="Clique para descrever a meta..." 
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeGoal(listName, idx)} 
                      className="ml-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-8">
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Compromissos e Ações</label>
                        <input 
                          type="text" 
                          value={m.compromisso} 
                          onChange={e => handleGoalChange(listName, idx, 'compromisso', e.target.value)} 
                          className="w-full text-xs font-semibold text-slate-600 bg-transparent border-none p-0 focus:ring-0" 
                          placeholder="Como isso será feito?" 
                        />
                      </div>
                    </div>
                    <div className="md:col-span-4">
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 h-full">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Prazo / Referência</label>
                        <input 
                          type="text" 
                          value={m.prazo} 
                          onChange={e => handleGoalChange(listName, idx, 'prazo', e.target.value)} 
                          className="w-full text-xs font-bold text-amber-600 bg-transparent border-none p-0 focus:ring-0" 
                          placeholder="Ex: 30 dias" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Evolução Registrada</label>
                      <input 
                        type="text" 
                        value={m.resultado} 
                        onChange={e => handleGoalChange(listName, idx, 'resultado', e.target.value)} 
                        className="w-full text-xs font-medium text-blue-600 bg-transparent border-b border-blue-100 hover:border-blue-300 transition-colors p-1 focus:ring-0 focus:border-blue-500" 
                        placeholder="Resultados alcançados..." 
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Observações Técnicas</label>
                      <input 
                        type="text" 
                        value={m.observacoes} 
                        onChange={e => handleGoalChange(listName, idx, 'observacoes', e.target.value)} 
                        className="w-full text-xs font-medium text-slate-500 bg-transparent border-b border-slate-100 hover:border-slate-200 transition-colors p-1 focus:ring-0 focus:border-brand-primary" 
                        placeholder="Anotações adicionais..." 
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input area for new goal */}
        <div className="relative group/input">
           <div className={`absolute -inset-1 bg-gradient-to-r ${isFamily ? 'from-indigo-500 to-purple-600' : 'from-emerald-500 to-teal-600'} rounded-2xl blur opacity-10 group-hover/input:opacity-25 transition duration-500`}></div>
           <div className="relative bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-4 border border-slate-100 focus-within:border-brand-primary/30 focus-within:bg-white transition-all">
                <Plus size={18} className="text-slate-400 mr-3" />
                <input 
                  type="text" 
                  value={newGoalText[listName]}
                  onChange={(e) => setNewGoalText(prev => ({ ...prev, [listName]: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleQuickAdd(listName))}
                  className="w-full py-3 bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 placeholder:text-slate-400 placeholder:font-medium" 
                  placeholder={isFamily ? "Descrever nova meta para a família..." : "Descrever nova ação da equipe..."} 
                />
              </div>
              <button 
                type="button"
                onClick={() => handleQuickAdd(listName)}
                disabled={!newGoalText[listName].trim()}
                className={`sm:px-6 py-3 rounded-xl font-black text-sm text-white shadow-lg shadow-black/5 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 disabled:grayscale ${
                  isFamily ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                ADICIONAR
              </button>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      
      {/* VI - METAS */}
      <section>
        <h3 className="text-lg font-bold text-brand-secondary mb-6 border-b border-slate-200 pb-2">VI - METAS, EVOLUÇÃO E ACOMPANHAMENTO</h3>
        
        {renderGoalSection('a) Família', 'metasFamilia')}
        {renderGoalSection('b) Equipe técnica', 'metasEquipe')}
        
      </section>

      {/* Estratégias e Eixos */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h4 className="text-sm font-bold text-brand-secondary mb-4 bg-slate-100 p-3 rounded-lg border border-slate-200 flex items-center">
            Estratégias a serem adotadas / Ações realizadas
            <InfoTooltip text="Metodologias e ações técnicas utilizadas pela equipe para apoiar a família no alcance das metas." />
          </h4>
          <div className="space-y-2 mb-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm max-h-[400px] overflow-y-auto">
            {ESTRATEGIAS.map(est => (
              <label key={est} className="flex items-start space-x-3 cursor-pointer p-2 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-50 last:border-0">
                <input type="checkbox" checked={data.estrategias.includes(est)} onChange={() => toggleCheckbox(data.estrategias, est, 'estrategias')} className="w-4 h-4 rounded border-slate-300 text-brand-primary mt-0.5" />
                <span className="text-sm text-slate-700 leading-tight font-medium">{est}</span>
              </label>
            ))}
          </div>
          <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Outras (Incluir nas demais ações):</label>
              <input type="text" value={data.estrategiasOutras} onChange={e => handleChange('estrategiasOutras', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Prazo para cumprimento:</label>
              <input type="text" value={data.estrategiasPrazo} onChange={e => handleChange('estrategiasPrazo', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 bg-white" />
            </div>
          </div>
        </div>

        <div>
           <h4 className="text-sm font-bold text-brand-secondary mb-4 bg-slate-100 p-3 rounded-lg border border-slate-200 flex items-center">
             Eixos de intervenção / Ações de intervenção
             <InfoTooltip text="Áreas temáticas onde as ações de acompanhamento serão concentradas para promover a autonomia familiar." />
           </h4>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
             {EIXOS.map(eixo => (
                <label key={eixo} className="flex items-start space-x-2 cursor-pointer p-2 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-50 last:border-0 sm:border-0">
                  <input type="checkbox" checked={data.eixosIntervencao.includes(eixo)} onChange={() => toggleCheckbox(data.eixosIntervencao, eixo, 'eixosIntervencao')} className="w-4 h-4 rounded border-slate-300 text-brand-primary mt-0.5" />
                  <span className="text-xs text-slate-700 leading-tight font-medium">{eixo}</span>
                </label>
             ))}
           </div>
           <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mt-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Outros Eixos:</label>
              <input type="text" value={data.eixosOutros} onChange={e => handleChange('eixosOutros', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 bg-white" />
            </div>

            {/* Referrals Section */}
            <AnimatePresence>
              {(data.eixosIntervencao.length > 0 || data.estrategias.includes('Encaminhamentos')) && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-5 bg-amber-50 rounded-2xl border-2 border-amber-100 space-y-4 overflow-hidden"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-amber-100 p-1.5 rounded-lg text-amber-600">
                      <Target size={16} />
                    </div>
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">Detalhes do Encaminhamento</h5>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-bold text-amber-600 uppercase tracking-wider mb-1">Situação / Motivo</label>
                      <input 
                        type="text" 
                        value={data.encaminhamentoSituacao || ''} 
                        onChange={e => handleChange('encaminhamentoSituacao', e.target.value)} 
                        placeholder="Qual a situação que gerou o encaminhamento?"
                        className="w-full p-2.5 rounded-lg border border-amber-200 bg-white text-xs font-medium focus:ring-2 focus:ring-amber-500/20 outline-none"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-amber-600 uppercase tracking-wider mb-1">Destino (Para quê?)</label>
                        <input 
                          type="text" 
                          value={data.encaminhamentoDestino || ''} 
                          onChange={e => handleChange('encaminhamentoDestino', e.target.value)} 
                          placeholder="Ex: Matrícula escolar, Consulta médica..."
                          className="w-full p-2.5 rounded-lg border border-amber-200 bg-white text-xs font-medium focus:ring-2 focus:ring-amber-500/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-amber-600 uppercase tracking-wider mb-1">Órgão / Setor (Para quem?)</label>
                        <input 
                          type="text" 
                          value={data.encaminhamentoParaQuem || ''} 
                          onChange={e => handleChange('encaminhamentoParaQuem', e.target.value)} 
                          placeholder="Ex: Escola Municipal X, Posto de Saúde..."
                          className="w-full p-2.5 rounded-lg border border-amber-200 bg-white text-xs font-medium focus:ring-2 focus:ring-amber-500/20 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
        </div>
      </section>

      {/* Participação */}
      <section className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-3 flex items-center">
              <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
              A família participou da construção do Plano de acompanhamento?
            </label>
            <div className="flex flex-wrap gap-4 mb-3">
              {['Sim', 'Não', 'Parcialmente'].map(opt => (
                 <label key={opt} className="flex items-center space-x-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-indigo-100 shadow-sm hover:bg-indigo-50 transition-colors">
                   <input type="radio" checked={data.participacaoFamilia === opt} onChange={() => handleChange('participacaoFamilia', opt)} className="w-4 h-4 text-brand-primary focus:ring-brand-primary border-slate-300" />
                   <span className="text-sm font-bold text-slate-700">{opt}</span>
                 </label>
              ))}
            </div>
            {data.participacaoFamilia === 'Parcialmente' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="animate-in fade-in slide-in-from-top-1"
              >
                 <label className="block text-xs font-bold text-indigo-900 mb-1 tracking-tight">Explique como foi a participação parcial:</label>
                 <textarea 
                   rows={2}
                   value={data.participacaoExplicacao || ''} 
                   onChange={e => handleChange('participacaoExplicacao', e.target.value)} 
                   className="w-full p-2.5 rounded-lg border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-medium" 
                   placeholder="Descreva os limites da participação..."
                 />
              </motion.div>
            )}
          </div>

          <div>
             <label className="block text-sm font-bold text-slate-800 mb-3 flex items-center">
               <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
               Houve concordância da família nas metas estabelecidas?
             </label>
             <div className="flex flex-wrap gap-4 mb-3">
              {['Sim', 'Não', 'Parcialmente'].map(opt => (
                 <label key={opt} className="flex items-center space-x-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-indigo-100 shadow-sm hover:bg-indigo-50 transition-colors">
                   <input type="radio" checked={data.concordanciaFamilia === opt} onChange={() => handleChange('concordanciaFamilia', opt)} className="w-4 h-4 text-brand-primary focus:ring-brand-primary border-slate-300" />
                   <span className="text-sm font-bold text-slate-700">{opt}</span>
                 </label>
              ))}
             </div>
             {data.concordanciaFamilia === 'Não' && (
                <div className="animate-in fade-in slide-in-from-top-1">
                   <label className="block text-xs font-bold text-indigo-900 mb-1">Se não houve, em quais pontos?</label>
                   <input type="text" value={data.concordanciaPontosNao} onChange={e => handleChange('concordanciaPontosNao', e.target.value)} className="w-full p-2.5 rounded-lg border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs" />
                </div>
             )}
             {data.concordanciaFamilia === 'Parcialmente' && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="animate-in fade-in slide-in-from-top-1"
                >
                   <label className="block text-xs font-bold text-indigo-900 mb-1">Explique a concordância parcial:</label>
                   <textarea 
                     rows={2}
                     value={data.concordanciaExplicacao || ''} 
                     onChange={e => handleChange('concordanciaExplicacao', e.target.value)} 
                     className="w-full p-2.5 rounded-lg border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-medium" 
                     placeholder="Descreva o que foi acordado e o que não foi..."
                   />
                </motion.div>
             )}
          </div>
        </div>
      </section>

    </div>
  );
}

