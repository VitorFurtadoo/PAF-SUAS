import { ReactNode } from 'react';
import { X, User, Phone, MapPin, Calendar, ClipboardList, Activity, Layout, Heart, Target, CheckCircle2, Clock, FileText, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { PAFData } from '../types';

interface PAFViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  paf: PAFData | null;
}

export default function PAFViewModal({ isOpen, onClose, paf }: PAFViewModalProps) {
  if (!paf) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '---';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  const Section = ({ title, icon: Icon, children, className = "" }: { title: string, icon: any, children: ReactNode, className?: string }) => (
    <div className={`bg-white rounded-2xl border border-slate-100 p-6 shadow-sm ${className}`}>
      <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-4">
        <div className="p-2 bg-brand-light rounded-xl text-brand-primary">
          <Icon size={20} />
        </div>
        <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );

  const LabelValue = ({ label, value, fullWidth = false }: { label: string, value: any, fullWidth?: boolean }) => (
    <div className={`${fullWidth ? 'col-span-full' : ''} space-y-1`}>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{label}</label>
      <div className="text-slate-700 font-bold bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50 min-h-[42px] flex items-center">
        {value || <span className="text-slate-300 italic font-medium">Não informado</span>}
      </div>
    </div>
  );

  const TagList = ({ label, items, emptyMessage = "Nenhum selecionado" }: { label: string, items: string[], emptyMessage?: string }) => (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{label}</label>
      <div className="flex flex-wrap gap-2">
        {items && items.length > 0 ? (
          items.map((item, idx) => (
            <span key={idx} className="bg-brand-light/30 text-brand-primary px-3 py-1.5 rounded-full text-xs font-black border border-brand-primary/10">
              {item}
            </span>
          ))
        ) : (
          <span className="text-slate-300 italic text-sm">{emptyMessage}</span>
        )}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-5xl max-h-[90vh] bg-[#f8fafc] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-white px-8 py-6 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center">
                  <FileText size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Detalhes do Plano (PAF)</h2>
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-black border border-slate-200 uppercase tracking-tighter">
                      № {paf.numeroPlano || '---'}
                    </span>
                    {paf.isDraft && (
                      <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black border border-amber-200 uppercase tracking-tight">
                        Rascunho
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-sm font-medium mt-0.5">Visualizando prontuário de {paf.responsavel}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              
              {/* Identificação Básica */}
              <Section title="Informações Gerais" icon={User}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <LabelValue label="Responsável Familiar" value={paf.responsavel} fullWidth />
                  <LabelValue label="CPF" value={paf.cpf} />
                  <LabelValue label="Telefone" value={paf.telefone} />
                  <LabelValue label="Unidade CRAS" value={paf.unidadeCras} />
                  <LabelValue label="Técnico Responsável" value={paf.tecnicoNome1} />
                  <LabelValue label="Data Inicial" value={formatDate(paf.dataInicial)} />
                  <LabelValue label="Periodicidade" value={paf.periodicidade} />
                  <LabelValue label="Situação" value={paf.situacao} />
                  <LabelValue label="Forma de Acesso" value={paf.formaAcesso === 'Encaminhamento por outras políticas públicas' ? `Encaminhamento: ${paf.formaAcessoOutros}` : paf.formaAcesso} fullWidth />
                  <LabelValue label="Demanda Inicial" value={paf.demandaInicial} fullWidth />
                </div>
              </Section>

              {/* Membros da Família */}
              <Section title="Composição Familiar" icon={Layout}>
                <div className="overflow-hidden border border-slate-100 rounded-2xl">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3">Nome do Membro</th>
                        <th className="px-4 py-3">Nascimento</th>
                        <th className="px-4 py-3">Parentesco</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {paf.membros && paf.membros.length > 0 ? (
                        paf.membros.map((membro) => (
                          <tr key={membro.id} className="text-sm">
                            <td className="px-4 py-3 font-bold text-slate-700">{membro.nome}</td>
                            <td className="px-4 py-3 text-slate-500">{formatDate(membro.nascimento)}</td>
                            <td className="px-4 py-3"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg text-[10px] font-black">{membro.parentesco}</span></td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">Nenhum membro cadastrado</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Section>

              {/* Diagnóstico */}
              <Section title="Diagnóstico e Vulnerabilidades" icon={Activity}>
                <div className="space-y-6">
                  <TagList label="Vulnerabilidades Identificadas" items={paf.vulnerabilidades} />
                  <LabelValue label="Descrição de Vulnerabilidades Múltiplas" value={paf.vulnerabilidadesMutiplasDescricao} fullWidth />
                  <LabelValue label="Potencialidades do Grupo Familiar" value={paf.potencialidadesGrupoFamiliar} fullWidth />
                </div>
              </Section>

              {/* Serviços e Benefícios */}
              <Section title="Serviços, Benefícios e Rede" icon={Heart}>
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-tighter border-l-4 border-brand-primary pl-3">Programas de Renda</h4>
                      <LabelValue label="Participa?" value={paf.programasRendaParticipa} />
                      <TagList label="Quais Programas" items={[...(paf.programasRendaQuais || []), paf.programasRendaOutros].filter(Boolean)} />
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-tighter border-l-4 border-brand-primary pl-3">Benefícios Eventuais</h4>
                      <LabelValue label="Recebe?" value={paf.beneficiosEventuaisRecebe} />
                      <TagList label="Quais Benefícios" items={[...(paf.beneficiosEventuaisQuais || []), paf.beneficiosEventuaisOutros].filter(Boolean)} />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-50">
                    <TagList label="Recursos do Território Utilizados" items={[...(paf.recursosTerritorio || []), paf.recursosTerritorioOutros].filter(Boolean)} />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-slate-50">
                    <TagList label="Serviços (Proteção Básica)" items={paf.servicosBasica || []} />
                    <TagList label="Serviços (Especial Média)" items={paf.servicosEspecialMedia || []} />
                    <TagList label="Serviços (Especial Alta)" items={paf.servicosEspecialAlta || []} />
                  </div>
                </div>
              </Section>

              {/* Metas */}
              <Section title="Metas e Acordos" icon={Target}>
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-brand-primary uppercase tracking-widest pl-3 border-l-4 border-brand-primary">Metas com a Família</h4>
                    <div className="grid gap-4">
                      {paf.metasFamilia && paf.metasFamilia.length > 0 ? paf.metasFamilia.map((meta, idx) => (
                        <div key={idx} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 grid md:grid-cols-3 gap-4">
                          <LabelValue label="Meta" value={meta.meta} />
                          <LabelValue label="Compromisso da Família" value={meta.compromisso} />
                          <div className="flex gap-4">
                            <LabelValue label="Prazo" value={meta.prazo} />
                            <LabelValue label="Resultado" value={meta.resultado} />
                          </div>
                        </div>
                      )) : <p className="text-slate-400 italic text-sm text-center py-4 bg-slate-50 rounded-2xl">Nenhuma meta definida com a família</p>}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-50">
                    <h4 className="text-xs font-black text-brand-primary uppercase tracking-widest pl-3 border-l-4 border-brand-primary">Metas da Equipe Técnica</h4>
                    <div className="grid gap-4">
                      {paf.metasEquipe && paf.metasEquipe.length > 0 ? paf.metasEquipe.map((meta, idx) => (
                        <div key={idx} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 grid md:grid-cols-3 gap-4">
                          <LabelValue label="Meta" value={meta.meta} />
                          <LabelValue label="Compromisso da Equipe" value={meta.compromisso} />
                           <div className="flex gap-4">
                            <LabelValue label="Prazo" value={meta.prazo} />
                            <LabelValue label="Resultado" value={meta.resultado} />
                          </div>
                        </div>
                      )) : <p className="text-slate-400 italic text-sm text-center py-4 bg-slate-50 rounded-2xl">Nenhuma meta definida pela equipe</p>}
                    </div>
                  </div>
                </div>
              </Section>

              {/* Estratégias e Eixos */}
              <Section title="Estratégias de Intervenção" icon={CheckCircle2}>
                <div className="space-y-6">
                  <TagList label="Estratégias de Ações" items={[...(paf.estrategias || []), paf.estrategiasOutras].filter(Boolean)} />
                  <LabelValue label="Prazo das Estratégias" value={paf.estrategiasPrazo} />
                  <TagList label="Eixos de Intervenção" items={[...(paf.eixosIntervencao || []), paf.eixosOutros].filter(Boolean)} />
                </div>
              </Section>

              {/* Participação e Finalização */}
              <Section title="Finalização e Elaboração" icon={Clock}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-tighter border-l-4 border-brand-primary pl-3">Participação da Família</h4>
                    <LabelValue label="Participou da construção?" value={paf.participacaoFamilia} />
                    {paf.participacaoFamilia === 'Não' && <LabelValue label="Por que?" value={paf.participacaoExplicacao} />}
                    <LabelValue label="Concordância com o Plano" value={paf.concordanciaFamilia} />
                    {paf.concordanciaFamilia === 'Não' && <LabelValue label="Motivo da discordância" value={paf.concordanciaExplicacao} />}
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-tighter border-l-4 border-brand-primary pl-3">Identificação do Plano</h4>
                    <LabelValue label="Data de Elaboração" value={formatDate(paf.dataElaboracao)} />
                    <LabelValue label="Observações de Elaboração" value={paf.observacoesElaboracao} />
                    {paf.dataEncerramento && (
                      <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                         <LabelValue label="Data de Encerramento" value={formatDate(paf.dataEncerramento)} />
                         <LabelValue label="Motivo do Encerramento" value={paf.motivoEncerramento === 'Outros' ? paf.motivoOutros : paf.motivoEncerramento} />
                      </div>
                    )}
                  </div>
                </div>
              </Section>

              {/* Próximas Visitas */}
              {paf.proximaVisitaData && (
                 <Section title="Próximas Atividades" icon={Calendar}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <LabelValue label="Data da Próxima Visita" value={formatDate(paf.proximaVisitaData)} />
                      <LabelValue label="Horário" value={paf.proximaVisitaHora} />
                      <LabelValue label="Observações da Visita" value={paf.proximaVisitaObservacoes} fullWidth />
                    </div>
                 </Section>
              )}

              {/* Informações Extras */}
              {paf.informacoesNaoSolicitadas && (
                 <Section title="Informações Complementares" icon={Info}>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 italic font-medium">
                      {paf.informacoesNaoSolicitadas}
                    </div>
                 </Section>
              )}

            </div>
            
            {/* Footer */}
            <div className="bg-white px-8 py-5 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black uppercase text-xs tracking-widest rounded-xl transition-all"
              >
                Fechar Visualização
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
