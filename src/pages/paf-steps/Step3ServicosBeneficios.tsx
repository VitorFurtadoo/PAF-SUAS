import React from 'react';
import type { PAFData } from '../../types';
import InfoTooltip from '../../components/InfoTooltip';

interface Props {
  data: PAFData;
  handleChange: (field: keyof PAFData, value: any) => void;
  toggleCheckbox: (list: string[], item: string, field: keyof PAFData) => void;
  toggleSubCheckbox: (list: string[], item: string, groupField: 'programasRendaQuais' | 'beneficiosEventuaisQuais') => void;
}

const SERVICOS_BASICA = ['PAIF', 'SCFV', 'Serviço no domicílio para gestantes e crianças'];
const SERVICOS_MEDIA = ['PAEFI', 'Medidas Socioeducativas (Meio Aberto)', 'Para idosos, PCD e suas famílias', 'Para pessoas em situação de rua'];
const SERVICOS_ALTA = ['Acolhimento Institucional'];

const PROGRAMAS_RENDA = ['Bolsa Família', 'BPC - Benefício de Prestação Continuada', 'Acessuas Trabalho'];
const BENEFICIOS_EVENTUAIS = ['Cesta Básica', 'Auxílio Natalidade', 'Auxílio Funeral', 'Aluguel Social', 'Auxílio transporte'];
const RECURSOS = ['Creches', 'Escolas em tempo integral', 'Projetos sociais em contraturno escolar', 'OSC\'s e/ou associação de bairro'];

export default function Step3ServicosBeneficios({ data, handleChange, toggleCheckbox, toggleSubCheckbox }: Props) {
  return (
    <div className="space-y-10">
      
      {/* III - SERVIÇOS */}
      <section>
        <h3 className="text-lg font-bold text-brand-secondary mb-4 border-b border-slate-200 pb-2">III - Utiliza algum tipo de Serviço? Quais?</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-brand-primary mb-4 pb-2 border-b border-slate-200 text-sm uppercase tracking-wide flex items-center">
              Proteção Social Básica
              <InfoTooltip text="Previne situações de risco fortalecendo vínculos familiares e comunitários. Ex: CRAS." />
            </h4>
            <div className="space-y-3">
              {SERVICOS_BASICA.map(svc => (
                 <label key={svc} className="flex items-start space-x-3 p-1 cursor-pointer group">
                   <input type="checkbox" checked={data.servicosBasica.includes(svc)} onChange={() => toggleCheckbox(data.servicosBasica, svc, 'servicosBasica')} className="w-4 h-4 mt-0.5 rounded border-slate-300 text-brand-primary focus:ring-brand-primary" />
                   <span className="text-sm text-slate-700 group-hover:text-slate-900 leading-tight">{svc}</span>
                 </label>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-amber-600 mb-4 pb-2 border-b border-slate-200 text-sm uppercase tracking-wide flex items-center">
              Especial de Média
              <InfoTooltip text="Atendimento a famílias e indivíduos com seus direitos violados mas cujos vínculos familiares não foram rompidos. Ex: CREAS." />
            </h4>
            <div className="space-y-3">
              {SERVICOS_MEDIA.map(svc => (
                 <label key={svc} className="flex items-start space-x-3 p-1 cursor-pointer group">
                   <input type="checkbox" checked={data.servicosEspecialMedia.includes(svc)} onChange={() => toggleCheckbox(data.servicosEspecialMedia, svc, 'servicosEspecialMedia')} className="w-4 h-4 mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500" />
                   <span className="text-sm text-slate-700 group-hover:text-slate-900 leading-tight">{svc}</span>
                 </label>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-rose-600 mb-4 pb-2 border-b border-slate-200 text-sm uppercase tracking-wide flex items-center">
              Especial de Alta
              <InfoTooltip text="Serviços para indivíduos com vínculos familiares rompidos ou em situação de abandono. Ex: Acolhimento." />
            </h4>
            <div className="space-y-3">
              {SERVICOS_ALTA.map(svc => (
                 <label key={svc} className="flex items-start space-x-3 p-1 cursor-pointer group">
                   <input type="checkbox" checked={data.servicosEspecialAlta.includes(svc)} onChange={() => toggleCheckbox(data.servicosEspecialAlta, svc, 'servicosEspecialAlta')} className="w-4 h-4 mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500" />
                   <span className="text-sm text-slate-700 group-hover:text-slate-900 leading-tight">{svc}</span>
                 </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* IV - PROGRAMAS E BENEFÍCIOS */}
      <section>
        <h3 className="text-lg font-bold text-brand-secondary mb-4 border-b border-slate-200 pb-2">IV - PROGRAMAS, PROJETOS, SERVIÇOS E BENEFÍCIOS SOCIOASSISTENCIAIS</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 border border-slate-200 rounded-xl p-6">
          
          {/* Programs */}
          <div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">a) Participa de Programas, Projetos Sociais ou de geração de renda?</label>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" checked={data.programasRendaParticipa === 'Sim'} onChange={() => handleChange('programasRendaParticipa', 'Sim')} className="text-brand-primary focus:ring-brand-primary" />
                  <span className="text-sm">Sim</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" checked={data.programasRendaParticipa === 'Não'} onChange={() => handleChange('programasRendaParticipa', 'Não')} className="text-brand-primary focus:ring-brand-primary" />
                  <span className="text-sm">Não</span>
                </label>
              </div>
            </div>

            <div className={`space-y-4 transition-opacity ${data.programasRendaParticipa !== 'Sim' ? 'opacity-40 pointer-events-none' : ''}`}>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2">Em caso positivo, quais?</p>
              {PROGRAMAS_RENDA.map(prog => (
                <label key={prog} className="flex items-start space-x-3 cursor-pointer">
                  <input type="checkbox" checked={data.programasRendaQuais.includes(prog)} onChange={() => toggleSubCheckbox(data.programasRendaQuais, prog, 'programasRendaQuais')} className="w-4 h-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary" />
                  <span className="text-sm text-slate-700">{prog}</span>
                </label>
              ))}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Municipal. Qual(is): / Outros:</label>
                <input type="text" value={data.programasRendaOutros} onChange={e => handleChange('programasRendaOutros', e.target.value)} className="w-full p-2.5 rounded-md border border-slate-300 bg-white shadow-sm" />
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">b) Recebe algum outro benefício eventual?</label>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" checked={data.beneficiosEventuaisRecebe === 'Sim'} onChange={() => handleChange('beneficiosEventuaisRecebe', 'Sim')} className="text-brand-primary focus:ring-brand-primary" />
                  <span className="text-sm">Sim</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" checked={data.beneficiosEventuaisRecebe === 'Não'} onChange={() => handleChange('beneficiosEventuaisRecebe', 'Não')} className="text-brand-primary focus:ring-brand-primary" />
                  <span className="text-sm">Não</span>
                </label>
              </div>
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 transition-opacity ${data.beneficiosEventuaisRecebe !== 'Sim' ? 'opacity-40 pointer-events-none' : ''}`}>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2 sm:col-span-2">Em caso positivo, quais?</p>
              {BENEFICIOS_EVENTUAIS.map(ben => (
                <label key={ben} className="flex items-start space-x-2 cursor-pointer">
                  <input type="checkbox" checked={data.beneficiosEventuaisQuais.includes(ben)} onChange={() => toggleSubCheckbox(data.beneficiosEventuaisQuais, ben, 'beneficiosEventuaisQuais')} className="w-4 h-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary mt-0.5" />
                  <span className="text-sm text-slate-700 leading-tight">{ben}</span>
                </label>
              ))}
              <div className="sm:col-span-2 pt-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Outro:</label>
                <input type="text" value={data.beneficiosEventuaisOutros} onChange={e => handleChange('beneficiosEventuaisOutros', e.target.value)} className="w-full p-2.5 rounded-md border border-slate-300 bg-white shadow-sm" />
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* V - RECURSOS DO TERRITORIO */}
      <section>
        <h3 className="text-lg font-bold text-brand-secondary mb-4 border-b border-slate-200 pb-2">V - RECURSOS QUE O TERRITÓRIO POSSUI (ARTICULAÇÃO DA REDE)</h3>
        <p className="text-sm font-semibold text-slate-700 mb-3">Rede de Apoio Institucional (Recursos Institucionais)</p>
        
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-center">
          {RECURSOS.map(rec => (
            <label key={rec} className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-2 border border-slate-200 rounded-lg shrink-0 hover:border-brand-primary transition">
              <input type="checkbox" checked={data.recursosTerritorio.includes(rec)} onChange={() => toggleCheckbox(data.recursosTerritorio, rec, 'recursosTerritorio')} className="w-4 h-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary" />
              <span className="text-sm text-slate-700">{rec}</span>
            </label>
          ))}
          <div className="flex-1 min-w-[200px] flex items-center space-x-2">
            <span className="text-sm font-semibold text-slate-600 whitespace-nowrap">Outros:</span>
            <input type="text" value={data.recursosTerritorioOutros} onChange={e => handleChange('recursosTerritorioOutros', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 bg-white" />
          </div>
        </div>
      </section>

    </div>
  );
}
