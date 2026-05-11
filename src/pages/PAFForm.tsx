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
    
    // Auto fill CRAS if the user is a technician or coordinator and it's not a global unit
    const isGlobal = userProfile?.unidadeCras === 'Administração';

    return {
      ...defaultInitialData,
      unidadeCras: isGlobal ? '' : (userProfile?.unidadeCras || ''),
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

  const handleSaveClick = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Usuário não autenticado!");
      return;
    }
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
                onClick={() => setActiveTab(idx)}
                className={`flex-1 py-4 px-2 text-xs lg:text-sm font-bold transition-all relative group ${
                  isActive 
                    ? 'text-brand-primary bg-white' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-1">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-colors ${
                    isActive 
                      ? 'bg-brand-primary text-white' 
                      : isCompleted
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="truncate w-full text-center">{tab}</span>
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
        <div className="bg-slate-50 border-t border-slate-200 p-4 md:p-6 flex justify-between items-center">
          <button 
            type="button" 
            onClick={() => setActiveTab(Math.max(0, activeTab - 1))}
            disabled={activeTab === 0}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
              activeTab === 0 
                ? 'text-slate-300 cursor-not-allowed bg-slate-100/50' 
                : 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm active:scale-95'
            }`}
          >
            <ChevronLeft size={18} />
            Anterior
          </button>
          
          {activeTab < tabs.length - 1 ? (
             <button 
                type="button" 
                onClick={() => setActiveTab(Math.min(tabs.length - 1, activeTab + 1))}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-brand-primary hover:bg-brand-secondary shadow-md shadow-brand-primary/20 transition-all active:scale-95"
              >
                Próximo
                <ChevronRight size={18} />
              </button>
          ) : (
             <button 
                type="button"
                onClick={handleSaveClick} 
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                {isSaving ? 'Salvando...' : 'Finalizar PAF'}
              </button>
          )}
        </div>

      </div>
    </div>
  );
}
