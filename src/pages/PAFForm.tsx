import React, { useState } from 'react';
import { ArrowLeft, Save, Printer, HelpCircle, ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PAFData, FamilyMember, Goal, SituacaoFamiliar } from '../types';
import { useAuth } from '../AuthProvider';
import { savePAF, updatePAF } from '../services/pafService';
import { generatePAFPdf } from '../utils/generatePdf';

import Step1Identificacao from './paf-steps/Step1Identificacao';
import Step2Diagnostico from './paf-steps/Step2Diagnostico';
import Step3ServicosBeneficios from './paf-steps/Step3ServicosBeneficios';
import Step4MetasEstrategias from './paf-steps/Step4MetasEstrategias';
import Step5Encerramento from './paf-steps/Step5Encerramento';
import HelpModal from '../components/HelpModal';
import GoalsSummaryModal from '../components/GoalsSummaryModal';

interface PAFFormProps {
  onBack: () => void;
  initialPafData?: PAFData | null;
}

const defaultInitialData: PAFData = {
  numeroPlano: '',
  unidadeCras: '',
  responsavel: '',
  telefone: '',
  telefone2: '',
  emailContato: '',
  cpf: '',
  endereco: '',
  dataInicial: '',
  situacao: 'Em andamento',
  dataSituacao: '',
  periodicidade: 'Mensal',
  demandaInicial: '',
  formaAcesso: '',
  formaAcessoOutros: '',
  membros: [{ id: '1', nome: '', nascimento: '', parentesco: '' }],
  vulnerabilidades: [],
  vulnerabilidadesMutiplasDescricao: '',
  potencialidadesGrupoFamiliar: '',
  situacoes: [],
  servicosBasica: [],
  servicosEspecialMedia: [],
  servicosEspecialAlta: [],
  programasRendaParticipa: '',
  programasRendaQuais: [],
  programasRendaOutros: '',
  beneficiosEventuaisRecebe: '',
  beneficiosEventuaisQuais: [],
  beneficiosEventuaisOutros: '',
  recursosTerritorio: [],
  recursosTerritorioOutros: '',
  metasFamilia: [{ id: '1', meta: '', compromisso: '', observacoes: '', prazo: '', resultado: '' }],
  metasEquipe: [{ id: '1', meta: '', compromisso: '', observacoes: '', prazo: '', resultado: '' }],
  estrategias: [],
  estrategiasOutras: '',
  estrategiasPrazo: '',
  eixosIntervencao: [],
  eixosOutros: '',
  participacaoFamilia: '',
  participacaoSimNao: '',
  concordanciaFamilia: '',
  concordanciaPontosNao: '',
  informacoesNaoSolicitadas: '',
  dataElaboracao: '',
  observacoesElaboracao: '',
  dataEncerramento: '',
  motivoEncerramento: '',
  motivoOutros: '',
  proximaVisitaData: '',
  proximaVisitaHora: '',
  proximaVisitaObservacoes: '',
};

export default function PAFForm({ onBack, initialPafData }: PAFFormProps) {
  const { user, userProfile } = useAuth();
  
  const [data, setData] = useState<PAFData>(() => {
    if (initialPafData) return initialPafData;
    
    // Auto fill CRAS if the user is a technician or coordinator
    const isAdmin = userProfile?.role === 'ADMIN';

    return {
      ...defaultInitialData,
      unidadeCras: isAdmin ? '' : (userProfile?.unidadeCras || ''),
      tecnicoId1: user?.uid || '',
      tecnicoNome1: userProfile?.name || '',
    };
  });
  
  const [activeTab, setActiveTab] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);

  const tabs = ['Identificação', 'Diagnóstico Familiar', 'Serviços & Rede', 'Metas do Plano', 'Encerramento'];

  const handleChange = React.useCallback((field: keyof PAFData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  }, []);

  const setPAFData = React.useCallback((newData: PAFData) => {
    setData(newData);
  }, []);

  const handleMembroChange = React.useCallback((index: number, field: keyof FamilyMember, value: string) => {
    setData(prev => {
      const newMembros = [...prev.membros];
      newMembros[index] = { ...newMembros[index], [field]: value };
      return { ...prev, membros: newMembros };
    });
  }, []);

  const addMembro = React.useCallback(() => {
    setData(prev => ({ 
      ...prev, 
      membros: [...prev.membros, { id: Date.now().toString(), nome: '', nascimento: '', parentesco: '' }] 
    }));
  }, []);

  const removeMembro = React.useCallback((index: number) => {
    setData(prev => {
      const newMembros = prev.membros.filter((_, i) => i !== index);
      return { ...prev, membros: newMembros };
    });
  }, []);

  const toggleVulnerabilidade = React.useCallback((vuln: string) => {
    setData(prev => {
      const list = prev.vulnerabilidades;
      if (list.includes(vuln)) {
        return { ...prev, vulnerabilidades: list.filter(i => i !== vuln) };
      } else {
        return { ...prev, vulnerabilidades: [...list, vuln] };
      }
    });
  }, []);

  const addSituacao = React.useCallback((situacao: string) => {
    const newSit: SituacaoFamiliar = {
      id: Date.now().toString(),
      situacao,
      membros: '',
      observacoes: '',
      impressaoDiagnostica: '',
      confirmado: false,
      vulnerabilidadeSuperada: false,
      dataSuperacao: ''
    };
    setData(prev => ({ ...prev, situacoes: [...prev.situacoes, newSit] }));
  }, []);

  const updateSituacao = React.useCallback((id: string, field: keyof SituacaoFamiliar, value: any) => {
    setData(prev => ({ 
      ...prev, 
      situacoes: prev.situacoes.map(sit => sit.id === id ? { ...sit, [field]: value } : sit) 
    }));
  }, []);

  const removeSituacao = React.useCallback((id: string) => {
    setData(prev => ({ ...prev, situacoes: prev.situacoes.filter(sit => sit.id !== id) }));
  }, []);

  const toggleCheckbox = React.useCallback((list: string[], item: string, field: keyof PAFData) => {
    setData(prev => {
      const currentList = prev[field] as string[];
      if (currentList.includes(item)) {
        return { ...prev, [field]: currentList.filter(i => i !== item) };
      } else {
        return { ...prev, [field]: [...currentList, item] };
      }
    });
  }, []);

  const toggleSubCheckbox = React.useCallback((list: string[], item: string, groupField: 'programasRendaQuais' | 'beneficiosEventuaisQuais') => {
    setData(prev => {
      const currentList = prev[groupField] as string[];
      if (currentList.includes(item)) {
        return { ...prev, [groupField]: currentList.filter(i => i !== item) };
      } else {
        return { ...prev, [groupField]: [...currentList, item] };
      }
    });
  }, []);

  const handleGoalChange = React.useCallback((listName: 'metasFamilia' | 'metasEquipe', index: number, field: keyof Goal, value: string) => {
    setData(prev => {
      const newMetas = [...prev[listName]];
      newMetas[index] = { ...newMetas[index], [field]: value };
      return { ...prev, [listName]: newMetas };
    });
  }, []);
  
  const addGoal = React.useCallback((listName: 'metasFamilia' | 'metasEquipe', metaText?: string) => {
    setData(prev => ({ 
      ...prev, 
      [listName]: [...prev[listName], { id: Date.now().toString(), meta: metaText || '', compromisso: '', observacoes: '', prazo: '', resultado: '' }] 
    }));
  }, []);

  const removeGoal = React.useCallback((listName: 'metasFamilia' | 'metasEquipe', index: number) => {
    setData(prev => {
      const newMetas = prev[listName].filter((_, i) => i !== index);
      return { ...prev, [listName]: newMetas };
    });
  }, []);

  const validateRequiredFields = (isDraft: boolean = false) => {
    const errors: string[] = [];

    // Step 1: Identificação
    if (!data.numeroPlano?.trim()) errors.push("Nº Identificador do Plano");
    if (!data.unidadeCras) errors.push("Unidade CRAS");
    if (!data.dataInicial) errors.push("Data Inicial do PAF");
    if (!data.responsavel?.trim()) errors.push("Responsável Familiar");
    if (!data.cpf?.trim()) errors.push("CPF");
    if (data.cpf && data.cpf.replace(/\D/g, '').length !== 11) errors.push("CPF inválido (deve ter 11 dígitos)");
    if (!data.telefone?.trim()) errors.push("Telefone Principal");
    if (!data.endereco?.trim()) errors.push("Endereço");
    if (!data.periodicidade) errors.push("Periodicidade de Acompanhamento");
    if (!data.demandaInicial?.trim()) errors.push("Demanda Inicial");
    if (!data.formaAcesso) errors.push("Forma de Acesso");
    if ((data.formaAcesso === 'Encaminhamento por outras políticas públicas' || data.formaAcesso === 'Outros') && !data.formaAcessoOutros?.trim()) {
      errors.push(data.formaAcesso === 'Outros' ? "Especificação (Forma de Acesso)" : "Especificação da Política Pública (Forma de Acesso)");
    }
    
    if (data.membros.length === 0) {
      errors.push("Deve haver pelo menos um membro da família");
    } else if (data.membros.some(m => !m.nome?.trim() || !m.nascimento || !m.parentesco)) {
      errors.push("Todos os membros da família devem ter Nome, Data de Nascimento e Parentesco preenchidos");
    }

    if (!isDraft) {
      // Step 2: Diagnóstico
      if (data.vulnerabilidades.length === 0) errors.push("Pelo menos uma Vulnerabilidade (Diagnóstico)");
      if (data.vulnerabilidades.includes('Outros') && !data.vulnerabilidadesOutros?.trim()) {
        errors.push("Especificação (Outras Vulnerabilidades)");
      }
      if (!data.vulnerabilidadesMutiplasDescricao?.trim()) errors.push("Descrição de Vulnerabilidades Múltiplas");
      if (!data.potencialidadesGrupoFamiliar?.trim()) errors.push("Potencialidades do Grupo Familiar");

      // Step 3: Serviços & Rede
      if (!data.programasRendaParticipa) errors.push("Informação se participa de Programas de Renda");
      if (data.programasRendaParticipa === 'Sim' && data.programasRendaQuais.length === 0 && !data.programasRendaOutros?.trim()) {
        errors.push("Especifique quais Programas de Renda a família participa");
      }
      if (!data.beneficiosEventuaisRecebe) errors.push("Informação se recebe Benefícios Eventuais");
      if (data.beneficiosEventuaisRecebe === 'Sim' && data.beneficiosEventuaisQuais.length === 0 && !data.beneficiosEventuaisOutros?.trim()) {
        errors.push("Especifique quais Benefícios Eventuais a família recebe");
      }
      if (data.recursosTerritorio.length === 0 && !data.recursosTerritorioOutros?.trim()) {
        errors.push("Pelo menos um Recurso do Território");
      }

      // Step 4: Metas
      if (data.metasFamilia.length === 0) {
        errors.push("Pelo menos uma Meta da Família");
      } else if (data.metasFamilia.some(m => !m.meta?.trim() || !m.compromisso?.trim() || !m.prazo?.trim())) {
        errors.push("Todas as Metas da Família devem ter a Meta, o Compromisso e o Prazo preenchidos");
      }

      if (data.metasEquipe.length === 0) {
        errors.push("Pelo menos uma Meta da Equipe Técnica");
      } else if (data.metasEquipe.some(m => !m.meta?.trim() || !m.compromisso?.trim() || !m.prazo?.trim())) {
        errors.push("Todas as Metas da Equipe Técnica devem ter a Meta, o Compromisso e o Prazo preenchidos");
      }

      if (data.estrategias.length === 0 && !data.estrategiasOutras?.trim()) errors.push("Pelo menos uma Estratégia de Ações");
      if (!data.estrategiasPrazo?.trim()) errors.push("Prazo para cumprimento das Estratégias");
      if (data.eixosIntervencao.length === 0 && !data.eixosOutros?.trim()) errors.push("Pelo menos um Eixo de Intervenção");
      
      if (!data.participacaoFamilia) errors.push("Informação sobre Participação da Família na construção do plano");
      if (!data.concordanciaFamilia) errors.push("Informação sobre Concordância da Família");
      if (!data.dataElaboracao) errors.push("Data de Elaboração");
    }

    if (errors.length > 0) {
      alert(`Os seguintes campos são obrigatórios para ${isDraft ? 'salvar o rascunho' : 'finalizar o plano'}:\n- ${errors.join("\n- ")}`);
      return false;
    }
    return true;
  };

  const handleSaveClick = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Usuário não autenticado!");
      return;
    }
    
    if (!validateRequiredFields(false)) return;
    
    setIsConfirmModalOpen(true);
  };

  const confirmSave = async () => {
    setIsSaving(true);
    try {
      const PAFToSave = { ...data, isDraft: false };
      if (data.id) {
        await updatePAF(data.id, user!.uid, userProfile?.name || 'Sistema', PAFToSave, 'Finalização');
        alert('Plano atualizado com sucesso!');
      } else {
        await savePAF(user!.uid, userProfile?.name || 'Sistema', PAFToSave);
        alert('Plano criado com sucesso!');
      }
      setIsConfirmModalOpen(false);
      onBack();
    } catch (err) {
      alert('Erro ao salvar o PAF. Verifique o console para mais detalhes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!user) {
      alert("Usuário não autenticado!");
      return;
    }
    
    if (!validateRequiredFields(true)) return;

    setIsSaving(true);
    try {
      const PAFToSave = { ...data, isDraft: true };
      if (data.id) {
        await updatePAF(data.id, user!.uid, userProfile?.name || 'Sistema', PAFToSave, 'Rascunho');
        alert('Rascunho atualizado com sucesso!');
      } else {
        const docId = await savePAF(user!.uid, userProfile?.name || 'Sistema', PAFToSave);
        setData(prev => ({ ...prev, id: docId, isDraft: true }));
        alert('Rascunho salvo com sucesso!');
      }
    } catch (err) {
      alert('Erro ao salvar rascunho. Verifique o console para mais detalhes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = async () => {
    await generatePAFPdf(data);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 md:mb-8">
        <div className="flex items-center gap-3">
          <button onClick={onBack} disabled={isSaving} className="p-2 bg-white rounded-full text-brand-primary outline outline-1 outline-slate-200 shadow-sm hover:outline-brand-primary hover:bg-brand-light transition disabled:opacity-50">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl md:text-3xl font-black text-slate-800 flex-1 leading-tight">Novo Plano (PAF)</h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <button type="button" onClick={() => setIsGoalsModalOpen(true)} className="flex-1 sm:flex-none justify-center bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors font-bold py-2.5 px-3 rounded-xl shadow-sm flex items-center space-x-2 text-xs">
            <ClipboardList size={16} />
            <span>Metas</span>
          </button>
          
          <button type="button" onClick={handlePrint} className="flex-1 sm:flex-none justify-center bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-bold py-2.5 px-3 rounded-xl shadow-sm flex items-center space-x-2 text-xs">
            <Printer size={16} />
            <span>PDF</span>
          </button>

          <button onClick={handleSaveDraft} disabled={isSaving} className="flex-1 sm:flex-none justify-center bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 transition-colors font-bold py-2.5 px-4 rounded-xl flex items-center space-x-2 text-xs disabled:opacity-70">
            <Save size={16} />
            <span>{isSaving ? '...' : 'Rascunho'}</span>
          </button>
          
          <button onClick={handleSaveClick} disabled={isSaving} className="flex-1 sm:flex-none justify-center bg-brand-primary hover:bg-brand-secondary transition-colors text-white font-bold py-2.5 px-4 rounded-xl shadow-md flex items-center space-x-2 text-xs disabled:opacity-70">
            <Save size={16} />
            <span>{isSaving ? '...' : 'Salvar'}</span>
          </button>
        </div>
      </div>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      
      <GoalsSummaryModal 
        isOpen={isGoalsModalOpen} 
        onClose={() => setIsGoalsModalOpen(false)} 
        metasFamilia={data.metasFamilia}
        metasEquipe={data.metasEquipe}
        responsavel={data.responsavel}
      />

      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Confirmar Salvamento</h3>
            <p className="text-slate-600 mb-6">Deseja realmente salvar os dados do PAF?</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmSave}
                disabled={isSaving}
                className="px-6 py-2 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-lg shadow-sm disabled:opacity-70 disabled:cursor-not-allowed transition"
              >
                {isSaving ? 'Salvando...' : 'Sim, Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Global Progress Indicator */}
        <div className="w-full h-1.5 bg-slate-100 relative">
          <div 
            className="h-full bg-brand-primary transition-all duration-500 ease-out" 
            style={{ width: `${((activeTab + 1) / tabs.length) * 100}%` }}
          />
        </div>
        
        {/* Tabs Desktop */}
        <div className="hidden sm:flex border-b border-slate-200 bg-slate-50/30">
          {tabs.map((tab, idx) => {
            const isActive = activeTab === idx;
            const isCompleted = activeTab > idx;
            
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`flex-1 py-4 px-2 text-xs lg:text-sm font-bold transition-all relative group ${
                  isActive 
                    ? 'text-brand-primary bg-white' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all transform ${
                    isActive 
                      ? 'bg-brand-primary text-white scale-110 shadow-md ring-4 ring-brand-primary/10' 
                      : isCompleted
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'
                  }`}>
                    {isCompleted ? '✓' : idx + 1}
                  </span>
                  <span className={`truncate w-full text-center transition-colors ${isActive ? 'font-black' : 'font-bold'}`}>{tab}</span>
                </div>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-primary animate-in fade-in slide-in-from-bottom-1" />
                )}
              </button>
            );
          })}
        </div>
        
        {/* Tabs Mobile */}
        <div className="sm:hidden p-4 border-b border-slate-200 bg-slate-50/50">
           <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Etapa {activeTab + 1} de {tabs.length}</span>
              <span className="text-xs font-bold text-brand-primary">{Math.round(((activeTab + 1) / tabs.length) * 100)}% concluído</span>
           </div>
           <select 
              value={activeTab}
              onChange={(e) => setActiveTab(Number(e.target.value))}
              className="w-full p-3 rounded-lg border border-slate-200 font-bold text-brand-primary bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
           >
              {tabs.map((tab, idx) => (
                <option key={idx} value={idx}>{idx + 1}. {tab}</option>
              ))}
           </select>
        </div>

        <form onSubmit={handleSaveClick} className="p-6 md:p-8">
          
          <div className="transition-all duration-300 ease-in-out opacity-100 translate-y-0">
             {activeTab === 0 && <Step1Identificacao data={data} handleChange={handleChange} setPAFData={setPAFData} handleMembroChange={handleMembroChange} addMembro={addMembro} removeMembro={removeMembro} />}
             {activeTab === 1 && <Step2Diagnostico data={data} handleChange={handleChange} toggleVulnerabilidade={toggleVulnerabilidade} addSituacao={addSituacao} updateSituacao={updateSituacao} removeSituacao={removeSituacao} />}
             {activeTab === 2 && <Step3ServicosBeneficios data={data} handleChange={handleChange} toggleCheckbox={toggleCheckbox} toggleSubCheckbox={toggleSubCheckbox} />}
             {activeTab === 3 && <Step4MetasEstrategias data={data} handleChange={handleChange} toggleCheckbox={toggleCheckbox} handleGoalChange={handleGoalChange} addGoal={addGoal} removeGoal={removeGoal} />}
             {activeTab === 4 && <Step5Encerramento data={data} handleChange={handleChange} />}
          </div>

        </form>
        
        {/* Navigation bottom */}
        <div className="bg-slate-50/80 backdrop-blur-sm border-t border-slate-200 p-5 md:p-8 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="order-2 sm:order-1 w-full sm:w-auto">
            <button 
              type="button" 
              onClick={() => {
                setActiveTab(Math.max(0, activeTab - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={activeTab === 0}
              className={`w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black transition-all ${
                activeTab === 0 
                  ? 'text-slate-300 cursor-not-allowed bg-slate-100/50 border border-transparent' 
                  : 'text-slate-700 bg-white border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm active:scale-[0.98]'
              }`}
            >
              <ChevronLeft size={20} />
              <span>Anterior</span>
            </button>
          </div>

          <div className="order-1 sm:order-2 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-1">
              {tabs.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeTab 
                      ? 'w-8 bg-brand-primary' 
                      : i < activeTab 
                        ? 'w-2 bg-emerald-400' 
                        : 'w-2 bg-slate-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Etapa {activeTab + 1} de {tabs.length} — {tabs[activeTab]}
            </p>
          </div>
          
          <div className="order-3 w-full sm:w-auto">
            {activeTab < tabs.length - 1 ? (
               <button 
                  type="button" 
                  onClick={() => {
                    setActiveTab(Math.min(tabs.length - 1, activeTab + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-black text-white bg-brand-primary hover:bg-brand-secondary shadow-lg shadow-brand-primary/20 transition-all hover:translate-x-1 active:scale-[0.98]"
                >
                  <span>Próximo Passo</span>
                  <ChevronRight size={20} />
                </button>
            ) : (
               <button 
                  type="button"
                  onClick={handleSaveClick} 
                  disabled={isSaving}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all hover:scale-105 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <Save size={20} />
                  <span>{isSaving ? 'Salvando...' : 'Finalizar PAF'}</span>
                </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
