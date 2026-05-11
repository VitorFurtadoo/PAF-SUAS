import { HelpCircle, X, LayoutDashboard, Users, FileBarChart } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col zoom-in-95 animate-in">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center space-x-3 text-[#007cc0]">
            <div className="p-2 bg-[#007cc0]/10 rounded-lg">
              <HelpCircle size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Como funciona o PAF SUAS</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <div className="space-y-6 text-slate-600">
            <section>
              <h4 className="text-lg font-bold text-slate-800 mb-2">Visão Geral</h4>
              <p>
                O Sistema PAF SUAS foi desenvolvido para facilitar a gestão e documentação do Plano de Acompanhamento Familiar no âmbito do CRAS e CREAS.
              </p>
            </section>
            
            <section className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h5 className="font-bold text-slate-800 flex items-center mb-2">
                  <LayoutDashboard size={18} className="mr-2 text-[#007cc0]" />
                  Dashboard
                </h5>
                <p className="text-sm">Visão global com atalhos rápidos e resumo dos últimos casos registrados para acompanhamento contínuo.</p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                 <h5 className="font-bold text-slate-800 flex items-center mb-2">
                  <Users size={18} className="mr-2 text-[#007cc0]" />
                  Planos de Acompanhamento
                </h5>
                <p className="text-sm">
                  Lista de todos os PAFs cadastrados. Você pode criar um novo plano, pesquisar por CPF/Nome, editar dados ou exportar como arquivo PDF oficial.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                 <h5 className="font-bold text-slate-800 flex items-center mb-2">
                  <FileBarChart size={18} className="mr-2 text-[#007cc0]" />
                  Relatórios
                </h5>
                <p className="text-sm">
                  Painel estratégico com gráficos interativos que mostram o volume de acompanhamentos no período selecionado e os status dos casos.
                </p>
              </div>
            </section>

            <section>
              <h4 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Protocolos de Atendimento (Baseado na Cartilha)</h4>
              
              <div className="space-y-4 text-sm">
                <div>
                  <h5 className="font-bold text-[#007cc0]">Acolhida particularizada</h5>
                  <p>Contato inicial de uma família, ou algum de seus membros, com o Serviço. Processo de escuta das necessidades e demandas trazidas pelas famílias e oferta de informações.</p>
                </div>
                
                <div>
                  <h5 className="font-bold text-[#007cc0]">Atendimento</h5>
                  <p>Ação imediata de prestação ou oferta de atenção, quando os objetivos a serem alcançados forem de curto prazo. Pode se encerrar na resolução de uma demanda específica ou dar início ao acompanhamento.</p>
                </div>
                
                <div>
                  <h5 className="font-bold text-[#007cc0]">Ações Comunitárias e Oficinas</h5>
                  <p>Ações voltadas para a articulação no território, comunicação comunitária e fortalecimento de vínculos. As oficinas são encontros para refletir sobre temas de interesse e vulnerabilidades.</p>
                </div>
                
                <div>
                  <h5 className="font-bold text-[#007cc0]">Diagnóstico Familiar</h5>
                  <p>Análise técnica da equipe de referência sobre a situação de vulnerabilidade social vivenciada pela família, a partir da escuta das demandas para inserção no acompanhamento.</p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <h5 className="font-bold text-[#007cc0] text-base">Plano de Acompanhamento Familiar (PAF)</h5>
                  <p className="mt-1 text-slate-700">Planejamento das estratégias adotadas para o fortalecimento das potencialidades/recursos e enfrentamento das vulnerabilidades. É construído de forma compartilhada entre profissionais e famílias considerando: demandas, recursos mobilizados e intervenções.</p>
                </div>

                <div>
                  <h5 className="font-bold text-[#007cc0]">Acompanhamento e Mediações Periódicas</h5>
                  <p>Intervenção continuada e planejada (aprox. 03 meses a 02 anos). As mediações materializam esse processo nos atendimentos particularizados, promovendo interações para a superação.</p>
                </div>

                <div>
                  <h5 className="font-bold text-[#007cc0]">Encaminhamentos</h5>
                  <p>Processos de orientação e direcionamento das famílias para serviços socioassistenciais ou outros setores. Tem por objetivo a promoção do acesso aos direitos e a conquista da cidadania.</p>
                </div>

                <div>
                  <h5 className="font-bold text-[#007cc0]">Avaliações e Desligamento</h5>
                  <p>Análise contínua (com as famílias) se as ações têm o efeito desejado. O desligamento é planejado progressivamente a partir dessas avaliações. Caso a vulnerabilidade se agrave para violação de direitos, articula-se com o CREAS (Média Complexidade).</p>
                </div>
              </div>
            </section>
          </div>
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-[#007cc0] hover:bg-[#00669e] text-white font-bold rounded-lg shadow-sm transition-colors"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}
