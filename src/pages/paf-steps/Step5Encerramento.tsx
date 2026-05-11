import React, { useEffect } from 'react';
import type { PAFData } from '../../types';
import { Calendar, Clock, MessageSquare } from 'lucide-react';

interface Props {
  data: PAFData;
  handleChange: (field: keyof PAFData, value: any) => void;
}

export default function Step5Encerramento({ data, handleChange }: Props) {
  // Pre-fill current date if empty
  useEffect(() => {
    if (!data.dataElaboracao) {
      const today = new Date().toISOString().split('T')[0];
      handleChange('dataElaboracao', today);
    }
  }, [data.dataElaboracao, handleChange]);

  return (
    <div className="space-y-10">
      
      {/* VII */}
      <section>
        <h3 className="text-lg font-bold text-brand-secondary mb-4 border-b border-slate-200 pb-2">VII - INFORMAÇÕES NÃO SOLICITADAS E FORNECIDAS ESPONTANEAMENTE</h3>
        <textarea 
          value={data.informacoesNaoSolicitadas} 
          onChange={e => handleChange('informacoesNaoSolicitadas', e.target.value)}
          className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-brand-primary resize-y"
          placeholder="Anote aqui informações relevantes trazidas pela família que não constam nas perguntas anteriores..."
        />
      </section>

      {/* VIII */}
      <section>
        <h3 className="text-lg font-bold text-brand-secondary mb-4 border-b border-slate-200 pb-2">VIII - ELABORAÇÃO DO PLANO</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
          <div className="md:col-span-1">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Data</label>
            <input type="date" value={data.dataElaboracao} onChange={e => handleChange('dataElaboracao', e.target.value)} className="w-full p-3 rounded-lg border border-slate-200 bg-white" />
          </div>
          <div className="md:col-span-3">
             <label className="block text-sm font-semibold text-slate-700 mb-1">Observações da Elaboração</label>
             <textarea rows={3} value={data.observacoesElaboracao} onChange={e => handleChange('observacoesElaboracao', e.target.value)} className="w-full p-3 rounded-lg border border-slate-200 bg-white" />
          </div>
        </div>
      </section>

      {/* AGENDAMENTO DE PRÓXIMA VISITA */}
      <section className="bg-brand-primary/5 border border-brand-primary/20 rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-brand-primary p-2.5 rounded-xl text-white">
            <Calendar size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-brand-secondary uppercase tracking-tight">Agendamento de Próxima Visita</h3>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-0.5">Planejamento e Controle de Acompanhamento</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Calendar size={16} className="text-brand-primary" />
              Data da Visita
            </label>
            <input 
              type="date" 
              value={data.proximaVisitaData || ''} 
              onChange={e => handleChange('proximaVisitaData', e.target.value)} 
              className="w-full p-3.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-primary outline-none transition-all font-medium"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Clock size={16} className="text-brand-primary" />
              Hora
            </label>
            <input 
              type="time" 
              value={data.proximaVisitaHora || ''} 
              onChange={e => handleChange('proximaVisitaHora', e.target.value)} 
              className="w-full p-3.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-primary outline-none transition-all font-medium"
            />
          </div>
          <div className="md:col-span-3">
             <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
               <MessageSquare size={16} className="text-brand-primary" />
               Observações / Pauta da Visita
             </label>
             <textarea 
               rows={1}
               value={data.proximaVisitaObservacoes || ''} 
               onChange={e => handleChange('proximaVisitaObservacoes', e.target.value)} 
               placeholder="Ex: Entrega de cesta básica, acompanhamento escolar..."
               className="w-full p-3.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-primary outline-none transition-all font-medium resize-none min-h-[52px]" 
             />
          </div>
        </div>
      </section>

      {/* ENCERRAMENTO */}
      <section className="mt-12 pt-8 border-t-2 border-dashed border-slate-300">
        <div className="bg-red-50/50 border border-red-100 rounded-xl p-6">
          <h3 className="text-lg font-bold text-red-800 mb-4 pb-2 border-b border-red-200/50">ENCERRAMENTO DO ACOMPANHAMENTO FAMILIAR</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-red-800/80 mb-1">Data do Encerramento</label>
              <input type="date" value={data.dataEncerramento} onChange={e => handleChange('dataEncerramento', e.target.value)} className="w-full p-3 rounded-lg border border-red-200 bg-white" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-red-800/80 mb-2">Motivo</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                {['1) Mudança de domicílio', '2) Encaminhamento para o CREAS', '3) Objetivos do PAIF alcançados', '4) Óbito', '5) Recusa da família'].map(motivo => (
                  <label key={motivo} className="flex items-center space-x-2 cursor-pointer bg-white p-2 rounded border border-red-100">
                    <input type="radio" checked={data.motivoEncerramento === motivo} onChange={() => handleChange('motivoEncerramento', motivo)} className="text-red-500 focus:ring-red-500" />
                    <span className="text-xs text-red-900">{motivo}</span>
                  </label>
                ))}
              </div>
              <div className="flex items-center space-x-3 bg-white p-2 rounded border border-red-100 mt-2">
                <label className="flex items-center space-x-2 shrink-0 cursor-pointer">
                    <input type="radio" checked={data.motivoEncerramento === '6) Outros'} onChange={() => handleChange('motivoEncerramento', '6) Outros')} className="text-red-500 focus:ring-red-500" />
                    <span className="text-xs text-red-900 font-bold">6) Outros:</span>
                </label>
                <input type="text" value={data.motivoOutros} onChange={e => handleChange('motivoOutros', e.target.value)} disabled={data.motivoEncerramento !== '6) Outros'} className="flex-1 p-1.5 border-b border-red-200 outline-none focus:border-red-500 bg-transparent disabled:opacity-50 text-sm" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12 pt-8">
             <div className="border-t border-slate-400 pt-3 text-center">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">TÉCNICO/EQUIPE DE REFERÊNCIA</p>
             </div>
             <div className="border-t border-slate-400 pt-3 text-center">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">ASSINATURA DO(S) RESPONSÁVEL(S)/FAMÍLIA</p>
             </div>
          </div>
        </div>
      </section>

    </div>
  );
}
