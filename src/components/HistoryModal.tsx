import React from 'react';
import { X, Clock, User, Calendar, MessageSquare } from 'lucide-react';
import type { HistoryEntry } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  responsavel: string;
}

export default function HistoryModal({ isOpen, onClose, history, responsavel }: HistoryModalProps) {
  if (!isOpen) return null;

  // Sort history by date desc to show most recent first
  const sortedHistory = [...(history || [])].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Clock className="text-brand-primary" size={24} />
              Histórico de Alterações
            </h2>
            <p className="text-slate-500 text-sm mt-1">PAF de: <span className="font-semibold text-slate-700">{responsavel}</span></p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {sortedHistory.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-500 italic">Nenhum histórico disponível para este registro.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-100 ml-3 pl-8 space-y-8">
              {sortedHistory.map((item, index) => (
                <div key={item.id} className="relative">
                  {/* Dot */}
                  <div className={`absolute -left-[41px] top-0 w-5 h-5 rounded-full border-4 border-white shadow-sm ${
                    index === 0 ? 'bg-brand-primary scale-110 shadow-brand-primary/20' : 'bg-slate-300'
                  }`} />
                  
                  <div className={`p-4 rounded-xl border transition-all ${
                    index === 0 ? 'bg-brand-light/20 border-brand-primary/20 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                           item.action === 'Criação' ? 'bg-green-100 text-green-700' : 
                           item.action === 'Finalização' ? 'bg-blue-100 text-blue-700' :
                           item.action === 'Rascunho' ? 'bg-amber-100 text-amber-700' :
                           'bg-slate-100 text-slate-700'
                         }`}>
                           {item.action}
                         </span>
                         <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                           <Calendar size={12} />
                           {new Date(item.date).toLocaleDateString('pt-BR')} às {new Date(item.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                         </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-sm text-slate-700">
                        <User size={16} className="mt-0.5 text-slate-400 shrink-0" />
                        <span className="font-semibold">{item.userName}</span>
                      </div>
                      
                      {item.summary && (
                        <div className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50/50 p-2 rounded">
                          <MessageSquare size={16} className="mt-0.5 text-slate-400 shrink-0" />
                          <p className="italic">"{item.summary}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors shadow-md"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
