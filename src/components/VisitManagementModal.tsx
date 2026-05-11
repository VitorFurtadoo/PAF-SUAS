import React, { useState } from 'react';
import { X, Calendar, Clock, CheckCircle2, AlertCircle, Ban, History, MessageSquare, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { PAFData, VisitaHistory } from '../types';
import { updatePAFVisit } from '../services/pafService';
import { useAuth } from '../AuthProvider';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  paf: PAFData;
  onUpdate: () => void;
}

type VisitAction = 'confirm' | 'postpone' | 'cancel' | 'none';

export default function VisitManagementModal({ isOpen, onClose, paf, onUpdate }: Props) {
  const { user, userProfile } = useAuth();
  const [action, setAction] = useState<VisitAction>('none');
  const [loading, setLoading] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [novaData, setNovaData] = useState('');
  const [novaHora, setNovaHora] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const handleSave = async () => {
    if (action === 'none') return;
    if (!motivo && (action === 'postpone' || action === 'cancel')) {
      alert('Por favor, informe o motivo.');
      return;
    }
    if (action === 'postpone' && !novaData) {
      alert('Por favor, informe a nova data.');
      return;
    }

    setLoading(true);
    try {
      const visitEntry: VisitaHistory = {
        id: crypto.randomUUID(),
        dataAgendada: paf.proximaVisitaData || '',
        horaAgendada: paf.proximaVisitaHora,
        observacoesOriginais: paf.proximaVisitaObservacoes,
        status: action === 'confirm' ? 'concluida' : action === 'postpone' ? 'adiada' : 'cancelada',
        dataRealizacao: new Date().toISOString().split('T')[0],
        motivo,
        novaData: action === 'postpone' ? novaData : undefined,
        novaHora: action === 'postpone' ? novaHora : undefined,
        createdAt: new Date().toISOString()
      };

      const nextVisit = action === 'postpone' ? {
        data: novaData,
        hora: novaHora,
        obs: paf.proximaVisitaObservacoes
      } : undefined;

      await updatePAFVisit(paf.id, user?.uid || '', userProfile?.name || 'Sistema', visitEntry, nextVisit);
      onUpdate();
      onClose();
      // Reset state
      setAction('none');
      setMotivo('');
      setNovaData('');
      setNovaHora('');
    } catch (error) {
      console.error('Error saving visit status:', error);
      alert('Erro ao salvar alteração.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const hasScheduledVisit = !!paf.proximaVisitaData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-brand-primary/10 p-2.5 rounded-xl text-brand-primary">
              <Calendar size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Gestão de Visitas</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{paf.responsavel}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-400"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto">
          {!hasScheduledVisit ? (
            <div className="text-center py-12">
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar size={40} className="text-slate-200" />
              </div>
              <h4 className="text-slate-400 font-bold uppercase tracking-widest text-sm italic">Nenhuma visita agendada para este plano</h4>
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="mt-6 flex items-center gap-2 mx-auto text-brand-primary font-bold text-xs uppercase tracking-widest hover:underline"
              >
                <History size={14} /> Ver Histórico de Visitas ({paf.visitasHistory?.length || 0})
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="bg-brand-primary/5 border border-brand-primary/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">Próxima Visita Agendada</span>
                </div>
                <div className="flex flex-wrap gap-6 text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-brand-primary" />
                    <span className="font-bold text-sm tracking-tight">
                      {new Date(paf.proximaVisitaData + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  {paf.proximaVisitaHora && (
                    <div className="flex items-center gap-2">
                      <Clock size={18} className="text-brand-primary" />
                      <span className="font-bold text-sm tracking-tight">{paf.proximaVisitaHora}</span>
                    </div>
                  )}
                </div>
                {paf.proximaVisitaObservacoes && (
                  <div className="mt-4 pt-4 border-t border-brand-primary/10 flex gap-3 text-slate-500">
                    <MessageSquare size={16} className="shrink-0 mt-0.5 text-brand-primary/40" />
                    <p className="text-xs italic leading-relaxed">{paf.proximaVisitaObservacoes}</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">O que aconteceu?</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button 
                    onClick={() => setAction('confirm')}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${action === 'confirm' ? 'bg-green-50 border-green-500 text-green-700 shadow-lg shadow-green-500/10' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}`}
                  >
                    <CheckCircle2 size={24} />
                    <span className="font-bold text-xs uppercase tracking-widest">Realizada</span>
                  </button>
                  <button 
                    onClick={() => setAction('postpone')}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${action === 'postpone' ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-lg shadow-amber-500/10' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}`}
                  >
                    <AlertCircle size={24} />
                    <span className="font-bold text-xs uppercase tracking-widest">Adiar/Reagendar</span>
                  </button>
                  <button 
                    onClick={() => setAction('cancel')}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${action === 'cancel' ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-lg shadow-rose-500/10' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}`}
                  >
                    <Ban size={24} />
                    <span className="font-bold text-xs uppercase tracking-widest">Cancelar</span>
                  </button>
                </div>
              </div>

              {action !== 'none' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6 pt-4 border-t border-slate-100">
                  {action === 'postpone' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nova Data</label>
                        <input 
                          type="date" 
                          value={novaData}
                          onChange={e => setNovaData(e.target.value)}
                          className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-700" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nova Hora</label>
                        <input 
                          type="time" 
                          value={novaHora}
                          onChange={e => setNovaHora(e.target.value)}
                          className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-700" 
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Justificativa / Observações</label>
                    <textarea 
                      value={motivo}
                      onChange={e => setMotivo(e.target.value)}
                      placeholder={action === 'confirm' ? 'Observações sobre como foi a visita...' : 'Explique o motivo do adiamento/cancelamento...'}
                      className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-brand-primary outline-none font-medium text-slate-700 min-h-[100px]"
                    />
                  </div>
                </motion.div>
              )}

              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-brand-primary transition-colors"
              >
                <History size={14} /> {showHistory ? 'Ocultar Histórico' : `Ver Histórico de Visitas (${paf.visitasHistory?.length || 0})`}
              </button>
            </div>
          )}

          <AnimatePresence>
            {showHistory && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 space-y-4 overflow-hidden"
              >
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Histórico de Visitas Passadas</h5>
                {paf.visitasHistory && paf.visitasHistory.length > 0 ? (
                  <div className="space-y-3">
                    {paf.visitasHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(visit => (
                      <div key={visit.id} className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex gap-4">
                        <div className={`mt-1 p-2 rounded-lg shrink-0 ${
                          visit.status === 'concluida' ? 'bg-green-100 text-green-600' :
                          visit.status === 'adiada' ? 'bg-amber-100 text-amber-600' :
                          'bg-rose-100 text-rose-600'
                        }`}>
                          {visit.status === 'concluida' ? <CheckCircle2 size={16} /> :
                           visit.status === 'adiada' ? <AlertCircle size={16} /> :
                           <Ban size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-xs uppercase text-slate-700">
                              Visita {visit.status === 'concluida' ? 'Realizada' : visit.status === 'adiada' ? 'Adiada' : 'Cancelada'}
                            </span>
                            <span className="text-[9px] font-black text-slate-400">{new Date(visit.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold mb-2">
                             Agendada para: {new Date(visit.dataAgendada + 'T00:00:00').toLocaleDateString('pt-BR')} {visit.horaAgendada && `às ${visit.horaAgendada}`}
                          </p>
                          {visit.motivo && (
                            <div className="bg-white/80 p-2 rounded-lg text-[10px] text-slate-600 leading-relaxed italic">
                              "{visit.motivo}"
                            </div>
                          )}
                          {visit.novaData && (
                            <p className="mt-2 text-[10px] font-black text-brand-primary uppercase tracking-widest">
                               Reagendada para: {new Date(visit.novaData + 'T00:00:00').toLocaleDateString('pt-BR')} {visit.novaHora && `às ${visit.novaHora}`}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-6 text-slate-400 italic text-xs">Nenhum registro no histórico.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-2xl transition active:scale-95 text-xs uppercase tracking-widest"
          >
            Cancelar
          </button>
          {hasScheduledVisit && action !== 'none' && (
            <button 
              onClick={handleSave}
              disabled={loading}
              className="px-8 py-3 bg-brand-primary hover:bg-brand-secondary text-white font-black rounded-2xl shadow-xl shadow-brand-primary/20 transition flex items-center gap-2 active:scale-95 disabled:opacity-50 text-xs uppercase tracking-widest"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              Salvar Alteração
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
