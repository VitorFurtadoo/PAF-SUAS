import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  Send, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Trash2,
  Filter,
  Layers,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../AuthProvider';
import { addSuggestion, getSuggestions, updateSuggestionStatus, deleteSuggestion } from '../services/suggestionService';
import { Suggestion } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function Sugestoes() {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [description, setDescription] = useState('');
  const [area, setArea] = useState<Suggestion['area']>('Outros');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');

  const isAdmin = userProfile?.role === 'ADMIN' || userProfile?.role === 'COORDENADOR';

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const data = await getSuggestions();
      setSuggestions(data);
    } catch (error) {
      console.error("Erro ao carregar sugestões:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !user || !userProfile) return;

    setSending(true);
    try {
      await addSuggestion({
        userId: user.uid,
        userName: userProfile.name,
        userUnit: userProfile.unidadeCras,
        area,
        description
      });
      setDescription('');
      setArea('Outros');
      await fetchSuggestions();
    } catch (error) {
      console.error("Erro ao enviar sugestão:", error);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (id: string, status: Suggestion['status']) => {
    try {
      await updateSuggestionStatus(id, status);
      setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir esta sugestão?')) return;
    try {
      await deleteSuggestion(id);
      setSuggestions(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error("Erro ao excluir sugestão:", error);
    }
  };

  const areas = [
    'Identificação', 
    'Diagnóstico', 
    'Metas', 
    'Serviços', 
    'Relatórios', 
    'Ações CRAS', 
    'Outros'
  ];

  const getStatusInfo = (status: Suggestion['status']) => {
    switch (status) {
      case 'PENDENTE': return { label: 'Pendente', icon: Clock, color: 'bg-amber-100 text-amber-700 border-amber-200' };
      case 'ANALISE': return { label: 'Em Análise', icon: AlertCircle, color: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'APROVADO': return { label: 'Aprovado', icon: CheckCircle2, color: 'bg-indigo-100 text-indigo-700 border-indigo-200' };
      case 'IMPLEMENTADO': return { label: 'Implementado', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      case 'REJEITADO': return { label: 'Rejeitado', icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200' };
    }
  };

  const filteredSuggestions = filterStatus === 'TODOS' 
    ? suggestions 
    : suggestions.filter(s => s.status === filterStatus);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
          <div className="bg-brand-light p-2.5 rounded-2xl">
            <Lightbulb className="text-brand-primary" size={24} />
          </div>
          Laboratório de Ideias
        </h1>
        <p className="text-slate-500 mt-2 text-sm md:text-base">Sua opinião ajuda a construir um sistema mais eficiente para todos.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário / Input */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sticky top-24">
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              <MessageSquare size={18} className="text-brand-primary" />
              Nova Sugestão
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Área de Melhoria</label>
                <select 
                  value={area}
                  onChange={(e) => setArea(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all"
                >
                  {areas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Descrição</label>
                <textarea 
                  required
                  placeholder="Explique sua ideia ou relate o que pode ser melhorado..."
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all resize-none"
                />
              </div>

              <button 
                type="submit"
                disabled={sending || !description.trim()}
                className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-brand-primary/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                Enviar Sugestão
              </button>
            </form>
          </div>
        </div>

        {/* Mural de Sugestões */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <TrendingUp size={20} className="text-brand-primary" />
              Mural de Melhorias
            </h3>
            
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-sm">
              <Filter size={14} className="text-slate-400 ml-1" />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent border-none outline-none text-[10px] font-black uppercase text-slate-500 cursor-pointer py-1"
              >
                <option value="TODOS">Todos</option>
                <option value="PENDENTE">Pendentes</option>
                <option value="ANALISE">Em Análise</option>
                <option value="APROVADO">Aprovados</option>
                <option value="IMPLEMENTADO">Prontos</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
              </div>
            ) : filteredSuggestions.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {filteredSuggestions.map((s, idx) => {
                  const statusInfo = getStatusInfo(s.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <motion.div
                      layout
                      key={s.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="p-5 md:p-6">
                        <div className="flex justify-between items-start gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-slate-50 p-2 rounded-xl text-brand-primary border border-slate-100">
                              <Layers size={18} />
                            </div>
                            <div>
                              <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">{s.area}</span>
                              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold">
                                <span>{s.userName}</span>
                                <span>•</span>
                                <span>CRAS {s.userUnit}</span>
                                {s.createdAt && (
                                  <>
                                    <span>•</span>
                                    <span>{new Date(s.createdAt.toMillis()).toLocaleDateString('pt-BR')}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className={`px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 ${statusInfo.color}`}>
                            <StatusIcon size={12} />
                            {statusInfo.label}
                          </div>
                        </div>

                        <p className="text-slate-700 text-sm font-medium leading-relaxed mb-6 whitespace-pre-wrap">
                          {s.description}
                        </p>

                        {/* Controles para Admin / Coordenador */}
                        {(isAdmin || s.userId === user?.uid) && (
                          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              {isAdmin && (
                                <div className="flex gap-1">
                                  <button 
                                    onClick={() => handleStatusChange(s.id!, 'ANALISE')}
                                    className="px-2 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all border border-transparent hover:border-blue-100"
                                  >
                                    Analisar
                                  </button>
                                  <button 
                                    onClick={() => handleStatusChange(s.id!, 'APROVADO')}
                                    className="px-2 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all border border-transparent hover:border-indigo-100"
                                  >
                                    Aprovar
                                  </button>
                                  <button 
                                    onClick={() => handleStatusChange(s.id!, 'IMPLEMENTADO')}
                                    className="px-2 py-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all border border-transparent hover:border-emerald-100"
                                  >
                                    Pronto
                                  </button>
                                </div>
                              )}
                            </div>

                            <button 
                              onClick={() => handleDelete(s.id!)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all ml-auto"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            ) : (
              <div className="bg-slate-50 rounded-3xl p-20 text-center border-2 border-dashed border-slate-200">
                <Lightbulb className="mx-auto text-slate-300 mb-4" size={48} />
                <h4 className="text-slate-800 font-bold">Nenhuma sugestão encontrada</h4>
                <p className="text-slate-500 text-sm mt-1">Seja o primeiro a enviar uma ideia!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
