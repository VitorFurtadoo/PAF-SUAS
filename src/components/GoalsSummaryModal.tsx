import React from 'react';
import { X, Target, Users, CheckCircle2 } from 'lucide-react';
import type { Goal } from '../types';

interface GoalsSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  metasFamilia: Goal[];
  metasEquipe: Goal[];
  responsavel: string;
}

export default function GoalsSummaryModal({ 
  isOpen, 
  onClose, 
  metasFamilia, 
  metasEquipe,
  responsavel
}: GoalsSummaryModalProps) {
  if (!isOpen) return null;

  const renderGoalList = (goals: Goal[], title: string, icon: React.ReactNode, colorClass: string) => (
    <div className="mb-8 last:mb-0">
      <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg ${colorClass}`}>
        {icon}
        <h3 className="font-bold text-lg">{title}</h3>
      </div>
      
      {goals.length === 0 || (goals.length === 1 && !goals[0].meta) ? (
        <p className="text-slate-500 italic px-4">Nenhuma meta registrada nesta categoria.</p>
      ) : (
        <div className="space-y-4">
          {goals.filter(g => g.meta).map((goal, index) => (
            <div key={goal.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">Meta #{index + 1}</span>
                {goal.prazo && (
                  <span className="text-xs text-slate-500 font-medium">Prazo: {goal.prazo}</span>
                )}
              </div>
              <p className="text-slate-800 font-semibold mb-2">{goal.meta}</p>
              {goal.compromisso && (
                <div className="mt-2 text-sm bg-slate-50 p-2 rounded border-l-4 border-brand-primary">
                  <span className="font-bold text-slate-700 block text-xs uppercase mb-1">Compromisso:</span>
                  <p className="text-slate-600">{goal.compromisso}</p>
                </div>
              )}
              {goal.resultado && (
                <div className="mt-2 text-sm bg-green-50 p-2 rounded border-l-4 border-green-500">
                  <span className="font-bold text-green-700 block text-xs uppercase mb-1">Resultado Esperado:</span>
                  <p className="text-green-600">{goal.resultado}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="bg-white border-b border-slate-200 p-6 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Consolidado de Metas</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">Beneficiário: <span className="text-brand-primary">{responsavel || 'Não informado'}</span></p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
          {renderGoalList(
            metasFamilia, 
            "Metas da Família", 
            <Target className="text-blue-600" size={24} />, 
            "bg-blue-50 text-blue-800 border-l-4 border-blue-500"
          )}
          
          <div className="h-px bg-slate-200 my-8"></div>
          
          {renderGoalList(
            metasEquipe, 
            "Metas da Equipe Técnica", 
            <Target className="text-brand-primary" size={24} />, 
            "bg-brand-light text-brand-secondary border-l-4 border-brand-primary"
          )}
        </div>
        
        <div className="bg-white border-t border-slate-200 p-6 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95"
          >
            Fechar Visualização
          </button>
        </div>
      </div>
    </div>
  );
}
