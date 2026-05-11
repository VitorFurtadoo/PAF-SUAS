import { useState, useEffect } from 'react';
import { Users, FileText, TrendingUp, AlertCircle, FilePlus, Loader2, Filter, ArrowUpDown, Search, Calendar, Clock } from 'lucide-react';
import { getPAFs } from '../services/pafService';
import { useAuth } from '../AuthProvider';

interface DashboardProps {
  onNewPlan: () => void;
}

export default function Dashboard({ onNewPlan }: DashboardProps) {
  const { user, userProfile } = useAuth();
  const [pafs, setPafs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<'date' | 'responsavel' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchPAFs = async () => {
      if (user && userProfile) {
        try {
          const data = await getPAFs(userProfile, user.uid);
          setPafs(data);
        } catch (error) {
          console.error("Failed to fetch PAFs:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchPAFs();
  }, [user]);

  const activePafs = pafs.filter(p => !p.situacao || p.situacao === 'Em andamento');
  const familiesCount = pafs.length;
  
  const calculateMetasEvolucao = () => {
    if (pafs.length === 0) return 0;
    
    let totalMetas = 0;
    let completedMetas = 0;
    
    pafs.forEach(paf => {
      if (paf.metasFamilia) {
         totalMetas += paf.metasFamilia.length;
         completedMetas += paf.metasFamilia.filter((m: any) => m.resultado && m.resultado.toLowerCase().includes('sim')).length;
      }
    });

    if (totalMetas === 0) return 100;
    return Math.round((completedMetas / totalMetas) * 100);
  };

  const priorityCases = pafs.filter(p => p.vulnerabilidades?.length >= 3).length;

  const getUpcomingVisits = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return pafs
      .filter(paf => {
        if (!paf.proximaVisitaData) return false;
        const [year, month, day] = paf.proximaVisitaData.split('-').map(Number);
        const visitDate = new Date(year, month - 1, day);
        return visitDate >= today;
      })
      .sort((a, b) => {
        const dateA = new Date(a.proximaVisitaData + 'T' + (a.proximaVisitaHora || '00:00'));
        const dateB = new Date(b.proximaVisitaData + 'T' + (b.proximaVisitaHora || '00:00'));
        return dateA.getTime() - dateB.getTime();
      });
  };

  const upcomingVisits = getUpcomingVisits();
  const nextVisit = upcomingVisits.length > 0 ? upcomingVisits[0] : null;

  const filteredAndSortedPafs = pafs
    .filter(paf => {
      // Search filter
      if (searchTerm && !paf.responsavel?.toLowerCase().includes(searchTerm.toLowerCase()) && !paf.cpf?.includes(searchTerm)) {
        return false;
      }

      // Status filter
      if (filterStatus === 'Todos') return true;
      if (filterStatus === 'Rascunhos') return !!paf.isDraft;
      
      const currentSituacao = paf.situacao || 'Em andamento';
      return !paf.isDraft && currentSituacao === filterStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        const dateA = a.createdAt?.toMillis() || 0;
        const dateB = b.createdAt?.toMillis() || 0;
        comparison = dateA - dateB;
      } else if (sortField === 'responsavel') {
        comparison = (a.responsavel || '').localeCompare(b.responsavel || '');
      } else if (sortField === 'status') {
        comparison = (a.situacao || '').localeCompare(b.situacao || '');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const toggleSort = (field: 'date' | 'responsavel' | 'status') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight">Painel de Acompanhamento Familiar</h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">Bem-vindo(a), {userProfile?.name} <span className="hidden md:inline">({userProfile?.role} - {userProfile?.unidadeCras})</span></p>
        </div>
        <button 
          onClick={onNewPlan}
          className="w-full lg:w-auto bg-brand-primary hover:bg-brand-secondary transition-colors text-white font-bold py-3.5 px-6 rounded-2xl shadow-xl shadow-brand-primary/20 flex items-center justify-center space-x-2 active:scale-95 transition-transform"
        >
          <FilePlus size={20} />
          <span>Novo Plano</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8">
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-brand-primary mb-2 bg-brand-light w-10 h-10 rounded-lg flex items-center justify-center"><Users size={20} /></div>
          <h3 className="text-2xl md:text-4xl font-bold text-brand-primary mb-1">{familiesCount}</h3>
          <p className="text-slate-400 font-medium tracking-wide text-[10px] md:text-xs uppercase">Famílias</p>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-brand-primary mb-2 bg-brand-light w-10 h-10 rounded-lg flex items-center justify-center"><FileText size={20} /></div>
          <h3 className="text-2xl md:text-4xl font-bold text-brand-primary mb-1">{activePafs.length}</h3>
          <p className="text-slate-400 font-medium tracking-wide text-[10px] md:text-xs uppercase">PAF Ativos</p>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-brand-primary mb-2 bg-brand-light w-10 h-10 rounded-lg flex items-center justify-center"><TrendingUp size={20} /></div>
          <h3 className="text-2xl md:text-4xl font-bold text-brand-primary mb-1">{calculateMetasEvolucao()}%</h3>
          <p className="text-slate-400 font-medium tracking-wide text-[10px] md:text-xs uppercase">Evolução</p>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-brand-primary mb-2 bg-brand-light w-10 h-10 rounded-lg flex items-center justify-center"><AlertCircle size={20} /></div>
          <h3 className="text-2xl md:text-4xl font-bold text-brand-primary mb-1">{priorityCases}</h3>
          <p className="text-slate-400 font-medium tracking-wide text-[10px] md:text-xs uppercase">Prioritários</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-800 shrink-0">Lista de PAFs</h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-grow max-w-2xl justify-end">
                <div className="relative flex-grow sm:max-w-xs">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Buscar por nome ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-9 pr-3 text-xs font-medium focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-slate-400" />
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs font-semibold focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
                  >
                    <option value="Todos">Todos</option>
                    <option value="Rascunhos">Rascunhos</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Concluído">Concluídos</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="p-5 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('responsavel')}>
                      <div className="flex items-center gap-1">Responsável <ArrowUpDown size={12} className={sortField === 'responsavel' ? 'text-brand-primary' : ''} /></div>
                    </th>
                    <th className="p-5 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('status')}>
                      <div className="flex items-center justify-center gap-1">Status <ArrowUpDown size={12} className={sortField === 'status' ? 'text-brand-primary' : ''} /></div>
                    </th>
                    <th className="p-5 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('date')}>
                      <div className="flex items-center justify-end gap-1">Data <ArrowUpDown size={12} className={sortField === 'date' ? 'text-brand-primary' : ''} /></div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAndSortedPafs.length > 0 ? (
                    filteredAndSortedPafs.map(paf => (
                      <tr key={paf.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="p-5">
                          <div className="flex items-center gap-2">
                            <div className="font-bold text-slate-700">{paf.responsavel || 'Não informado'}</div>
                            {paf.isDraft && (
                              <span className="bg-amber-50 text-amber-600 text-[9px] uppercase font-black px-1.5 py-0.5 rounded border border-amber-100">
                                Rascunho
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-medium text-slate-400 mt-0.5">CPF: {paf.cpf || 'N/A'}</div>
                        </td>
                        <td className="p-5 text-center">
                          <span className={`inline-block px-3 py-1 text-[10px] font-black uppercase rounded-full ${
                            paf.situacao === 'Concluído' ? 'bg-slate-100 text-slate-500' : 
                            'bg-brand-light/40 text-brand-primary border border-brand-primary/10'
                          }`}>
                            {paf.situacao || 'Em andamento'}
                          </span>
                        </td>
                        <td className="p-5 text-right font-medium text-slate-500 text-xs">
                          {paf.createdAt ? new Date(paf.createdAt.toMillis()).toLocaleDateString('pt-BR') : 'N/A'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-10 text-center text-slate-400 italic text-sm">
                        Nenhum registro encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards for Dashboard */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredAndSortedPafs.slice(0, 10).map(paf => (
                <div key={paf.id} className="p-5">
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-bold text-slate-700">{paf.responsavel || 'Não informado'}</div>
                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full ${
                      paf.situacao === 'Concluído' ? 'bg-slate-100 text-slate-500' : 
                      'bg-brand-light/40 text-brand-primary border border-brand-primary/10'
                    }`}>
                      {paf.situacao || 'Ativo'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    <span>CPF: {paf.cpf || 'N/A'}</span>
                    <span>{paf.createdAt ? new Date(paf.createdAt.toMillis()).toLocaleDateString('pt-BR') : 'N/A'}</span>
                  </div>
                </div>
              ))}
              {filteredAndSortedPafs.length === 0 && (
                <div className="p-10 text-center text-slate-400 italic text-sm">Nenhum registro.</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* PRÓXIMAS VISITAS AGENDADAS */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-brand-primary rounded-full"></div>
              Próximas Visitas ({upcomingVisits.length})
            </h2>
            
            {nextVisit ? (
              <div className="space-y-4">
                <div className="bg-brand-primary/5 border border-brand-primary/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3 text-[10px] font-black uppercase tracking-widest text-brand-primary">
                    <span>Visita mais próxima</span>
                    <span className="bg-brand-primary text-white px-2 py-0.5 rounded">Foco</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">{nextVisit.responsavel}</h4>
                  <div className="flex items-center gap-3 text-slate-500 mb-3">
                    <div className="flex items-center gap-1 text-[11px] font-bold">
                      <Calendar size={12} className="text-brand-primary" />
                      {new Date(nextVisit.proximaVisitaData + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </div>
                    {nextVisit.proximaVisitaHora && (
                      <div className="flex items-center gap-1 text-[11px] font-bold">
                        <Clock size={12} className="text-brand-primary" />
                        {nextVisit.proximaVisitaHora}
                      </div>
                    )}
                  </div>
                  {nextVisit.proximaVisitaObservacoes && (
                    <div className="bg-white/60 p-2 rounded-lg text-[10px] text-slate-600 italic">
                      "{nextVisit.proximaVisitaObservacoes}"
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {upcomingVisits.slice(1, 4).map((visit, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all group">
                      <div className="bg-slate-100 p-2 rounded-lg text-slate-400 group-hover:bg-brand-light group-hover:text-brand-primary transition-all">
                        <Calendar size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-slate-700 truncate">{visit.responsavel}</p>
                        <p className="text-[10px] font-bold text-slate-400">
                          {new Date(visit.proximaVisitaData + 'T00:00:00').toLocaleDateString('pt-BR')} {visit.proximaVisitaHora && `às ${visit.proximaVisitaHora}`}
                        </p>
                      </div>
                    </div>
                  ))}
                  {upcomingVisits.length > 4 && (
                    <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">
                       + {upcomingVisits.length - 4} outras agendadas
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="text-slate-200" size={24} />
                </div>
                <p className="text-slate-400 text-xs italic font-medium">Nenhuma visita agendada para os próximos dias.</p>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-slate-300 rounded-full"></div>
              Últimas Atividades
            </h2>
            <div className="space-y-6 relative ml-3 before:absolute before:inset-0 before:h-full before:w-px before:bg-slate-100">
              {pafs.slice(0, 5).map((paf: any, idx: number) => (
                 <div key={idx} className="relative pl-6 group">
                  <div className="absolute left-0 top-1.5 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-white bg-slate-300 group-first:bg-brand-primary group-first:scale-125 transition-all shadow-sm"></div>
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-transparent hover:border-slate-100 hover:bg-white transition-all">
                    <p className="font-semibold text-xs text-slate-700 leading-snug">PAF criado: <span className="text-brand-primary underline decoration-brand-primary/30 underline-offset-2">{paf.responsavel}</span></p>
                    <span className="text-[10px] font-bold text-slate-400 block mt-1">
                      {paf.createdAt ? new Date(paf.createdAt.toMillis()).toLocaleDateString('pt-BR') : 'Hoje'}
                    </span>
                  </div>
                </div>
              ))}
              
              {pafs.length === 0 && (
                <div className="text-slate-400 text-center py-4 text-sm italic">Sem atividades.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
