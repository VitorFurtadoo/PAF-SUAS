import React, { useState } from 'react';
import { AlertCircle, X, Send, CheckCircle2, MessageSquare, HelpCircle, Bug } from 'lucide-react';
import { submitErrorReport } from '../services/bugReportService';
import { motion, AnimatePresence } from 'motion/react';

export default function ErrorReportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'bug' | 'suggestion' | 'question'>('bug');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      await submitErrorReport(description, type);
      setIsSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        setDescription('');
      }, 3000);
    } catch (error) {
      alert('Erro ao enviar o relatório. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg shadow-red-200 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 group"
        title="Reportar Erro ou Sugestão"
      >
        <AlertCircle size={24} />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 font-bold text-sm uppercase tracking-wider">
          Reportar Erro
        </span>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setIsOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              {isSuccess ? (
                <div className="p-10 text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={48} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-2">Enviado com Sucesso!</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Agradecemos o seu feedback. Nossa equipe técnica analisará o relato o mais breve possível.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-red-600 p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-xl">
                        <AlertCircle size={20} />
                      </div>
                      <h3 className="text-lg font-black uppercase tracking-tight">Reportar Problema</h3>
                    </div>
                    <button 
                      onClick={() => !isSubmitting && setIsOpen(false)}
                      className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">O que você deseja fazer?</label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setType('bug')}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                            type === 'bug' ? 'border-red-600 bg-red-50 text-red-600' : 'border-slate-100 hover:border-slate-200 text-slate-500'
                          }`}
                        >
                          <Bug size={20} className="mb-1" />
                          <span className="text-[10px] font-bold">ERRO</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setType('suggestion')}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                            type === 'suggestion' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 hover:border-slate-200 text-slate-500'
                          }`}
                        >
                          <MessageSquare size={20} className="mb-1" />
                          <span className="text-[10px] font-bold">SUGESTÃO</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setType('question')}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                            type === 'question' ? 'border-emerald-600 bg-emerald-50 text-emerald-600' : 'border-slate-100 hover:border-slate-200 text-slate-500'
                          }`}
                        >
                          <HelpCircle size={20} className="mb-1" />
                          <span className="text-[10px] font-bold">DÚVIDA</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Descrição</label>
                      <textarea
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        placeholder="Descreva detalhadamente o ocorrido..."
                        className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-red-600 focus:ring-0 outline-none transition-all text-sm font-medium text-slate-700 bg-slate-50 placeholder:italic"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !description.trim()}
                      className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-red-200 transition-all active:scale-[0.98]"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send size={18} />
                          Enviar Relatório
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
