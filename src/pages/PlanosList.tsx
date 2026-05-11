import { useState, useEffect } from 'react';
import { FileText, Loader2, Filter, ArrowUpDown, Edit, Eye, User, FilePlus, Trash2, RefreshCw, Clock, ClipboardCheck, Calendar, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getPAFs, softDeletePAF, permanentlyDeletePAF, restorePAF } from '../services/pafService';
import { useAuth } from '../AuthProvider';
import type { PAFData } from '../types';
import HistoryModal from '../components/HistoryModal';
import TasksModal from '../components/TasksModal';
import VisitManagementModal from '../components/VisitManagementModal';
import PAFViewModal from '../components/PAFViewModal';

interface PlanosListProps {
  onNewPlan: () => void;
  onEditPlan: (paf: PAFData) => void;
}

export default function PlanosList({ onNewPlan, onEditPlan }: PlanosListProps) {
  const { user, userProfile } = useAuth();
  const [pafs, setPafs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTecnico, setSelectedTecnico] = useState('');
  const [selectedCras, setSelectedCras] = useState('todos');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<'date' | 'responsavel' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'ativos' | 'lixeira'>('ativos');

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, permanent: boolean } | null>(null);
  const [historyModal, setHistoryModal] = useState<{ isOpen: boolean, paf: any | null }>({
    isOpen: false,
    paf: null
  });

  const [viewModal, setViewModal] = useState<{ isOpen: boolean, paf: any | null }>({
    isOpen: false,
    paf: null
  });

  const [tasksModal, setTasksModal] = useState<{ isOpen: boolean, paf: any | null }>({
    isOpen: false,
    paf: null
  });

  const [visitModal, setVisitModal] = useState<{ isOpen: boolean, paf: any | null }>({
    isOpen: false,
    paf: null
  });

  const fetchPAFs = async () => {
    if (user && userProfile) {
      setLoading(true);
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

  useEffect(() => {
    fetchPAFs();
  }, [user, userProfile]);

  const handleDelete = (id: string) => {
    setDeleteConfirm({ id, permanent: false });
  };

  const handlePermanentDelete = (id: string) => {
    setDeleteConfirm({ id, permanent: true });
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      if (deleteConfirm.permanent) {
        await permanentlyDeletePAF(deleteConfirm.id);
      } else {
        await softDeletePAF(deleteConfirm.id);
      }
      await fetchPAFs();
    } catch (error) {
      console.error("Delete failed:", error);
      // Fallback in case there were errors, though we probably want a better alert system
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restorePAF(id);
      await fetchPAFs();
    } catch (error) {
      console.error("Restore failed:", error);
    }
  };

  const activePafs = pafs.filter(paf => !paf.deletedAt);
  const deletedPafs = pafs.filter(paf => !!paf.deletedAt);

  // Extrair lista de técnicos únicos para o filtro
  const tecnicosList = Array.from(new Set(
    pafs.flatMap(paf => [paf.tecnicoNome1, paf.tecnicoNome2, paf.userName].filter(Boolean))
  )).sort() as string[];

  const displayedPafs = (viewMode === 'ativos' ? activePafs : deletedPafs)
    .filter(paf => {
      // 1. Filtro de Status
      let matchStatus = filterStatus === 'Todos';
      if (!matchStatus) {
        if (filterStatus === 'Rascunhos') {
          matchStatus = !!paf.isDraft;
        } else {
          matchStatus = !paf.isDraft && paf.situacao === filterStatus;
        }
      }
      
      // 2. Filtro de Pesquisa Geral
      const term = searchTerm.toLowerCase();
      const matchSearch = (paf.responsavel || '').toLowerCase().includes(term) || 
                          (paf.cpf || '').includes(term) ||
                          (paf.unidadeCras || '').toLowerCase().includes(term) ||
                          (paf.numeroPlano || '').toLowerCase().includes(term);

      // 3. Filtro de Data
      let matchDate = true;
      if (paf.createdAt) {
        const pafDate = new Date(paf.createdAt.toMillis());
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (pafDate < start) matchDate = false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (pafDate > end) matchDate = false;
        }
      }

      // 4. Filtro de Técnico
      let matchTecnico = true;
      if (selectedTecnico) {
        matchTecnico = paf.tecnicoNome1 === selectedTecnico || 
                       paf.tecnicoNome2 === selectedTecnico || 
                       paf.userName === selectedTecnico;
      }

      // 5. Filtro de CRAS (Para Admins)
      let matchCras = true;
      if (userProfile?.role === 'ADMIN' && selectedCras !== 'todos') {
        matchCras = (paf.unidadeCras || '').trim() === selectedCras.trim();
      }
      
      return matchStatus && matchSearch && matchDate && matchTecnico && matchCras;
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

  if (loading && pafs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Planos de Acompanhamento (PAF)</h1>
          <p className="text-slate-500 mt-1 text-sm">Gerencie e visualize os prontuários das famílias</p>
        </div>
        <button 
          onClick={onNewPlan}
          className="w-full lg:w-auto bg-brand-primary hover:bg-brand-secondary transition-colors text-white font-bold py-3.5 px-8 rounded-2xl shadow-xl shadow-brand-primary/20 flex items-center justify-center space-x-2 active:scale-95 transform transition"
        >
          <FilePlus size={20} />
          <span>Novo Plano</span>
        </button>
      </div>

      <div className="mb-6 flex overflow-x-auto pb-2 scrollbar-none border-b border-slate-100">
        <button
          onClick={() => setViewMode('ativos')}
          className={`flex-none flex items-center gap-2 px-6 py-3 font-bold text-sm transition-all relative ${viewMode === 'ativos' ? 'text-brand-primary' : 'text-slate-400 hover:text-slate-600'}`}
        >
          {viewMode === 'ativos' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-primary rounded-t-full" />}
          Ativos <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${viewMode === 'ativos' ? 'bg-brand-primary text-white' : 'bg-slate-100 text-slate-500'}`}>{activePafs.length}</span>
        </button>
        <button
          onClick={() => setViewMode('lixeira')}
          className={`flex-none flex items-center gap-2 px-6 py-3 font-bold text-sm transition-all relative ${viewMode === 'lixeira' ? 'text-rose-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          {viewMode === 'lixeira' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500 rounded-t-full" />}
          <Trash2 size={16} />
          Lixeira <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${viewMode === 'lixeira' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{deletedPafs.length}</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col gap-4 bg-slate-50/30">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nome, CPF ou número do plano..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary focus:outline-none transition-all placeholder:text-slate-400 text-sm"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                  showFilters || startDate || endDate || selectedTecnico
                    ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Filter size={18} />
                <span>Filtros Avançados</span>
                {(startDate || endDate || selectedTecnico) && (
                  <span className="w-2 h-2 bg-brand-primary rounded-full" />
                )}
              </button>

              {viewMode === 'ativos' && (
                <div className="hidden lg:flex items-center gap-2 ml-2">
                  {['Todos', 'Rascunhos', 'Em andamento', 'Concluído'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                        filterStatus === status 
                        ? 'bg-brand-primary text-white border-brand-primary shadow-md shadow-brand-primary/10' 
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-slate-200 mt-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Período de Início</label>
                    <input 
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/10 outline-none"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Período de Fim</label>
                    <input 
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/10 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Técnico Responsável</label>
                    <select
                      value={selectedTecnico}
                      onChange={(e) => setSelectedTecnico(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/10 outline-none appearance-none bg-white font-medium text-slate-700"
                    >
                      <option value="">Todos os técnicos</option>
                      {tecnicosList.map(tec => (
                        <option key={tec} value={tec}>{tec}</option>
                      ))}
                    </select>
                  </div>

                  {userProfile?.role === 'ADMIN' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Unidade CRAS</label>
                      <select
                        value={selectedCras}
                        onChange={(e) => setSelectedCras(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/10 outline-none appearance-none bg-white font-bold text-slate-700"
                      >
                        <option value="todos">Todas as unidades</option>
                        <option value="Morada do Sol">CRAS Morada do Sol</option>
                        <option value="Nagibão">CRAS Nagibão</option>
                        <option value="Jaderlândia">CRAS Jaderlândia</option>
                        <option value="Camboatã">CRAS Camboatã</option>
                      </select>
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    <button
                      onClick={() => {
                        setStartDate('');
                        setEndDate('');
                        setSelectedTecnico('');
                        setSelectedCras('todos');
                        setFilterStatus('Todos');
                        setSearchTerm('');
                      }}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                      Limpar Filtros
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status Buttons for Mobile (since hidden on tablet/laptop in the previous grid) */}
          <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <Filter size={14} className="text-slate-400 shrink-0" />
            {['Todos', 'Rascunhos', 'Em andamento', 'Concluído'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`flex-none px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                  filterStatus === status 
                  ? 'bg-brand-primary text-white border-brand-primary' 
                  : 'bg-white text-slate-500 border-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
        
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-5 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('responsavel')}>
                  <div className="flex items-center gap-2">Responsável <ArrowUpDown size={12} className={sortField === 'responsavel' ? 'text-brand-primary' : 'text-slate-300'} /></div>
                </th>
                <th className="p-5">Nº do Plano</th>
                <th className="p-5">CPF</th>
                <th className="p-5 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('status')}>
                  <div className="flex items-center gap-2">Status <ArrowUpDown size={12} className={sortField === 'status' ? 'text-brand-primary' : 'text-slate-300'} /></div>
                </th>
                <th className="p-5 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleSort('date')}>
                  <div className="flex items-center gap-2">
                    {viewMode === 'lixeira' ? "Excluido" : "Criado"} 
                    <ArrowUpDown size={12} className={sortField === 'date' ? 'text-brand-primary' : 'text-slate-300'} />
                  </div>
                </th>
                <th className="p-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedPafs.length > 0 ? (
                displayedPafs.map((paf) => (
                  <tr key={paf.id} className={`hover:bg-slate-50/50 transition-colors group ${paf.isDraft && viewMode === 'ativos' ? 'bg-amber-50/20' : ''}`}>
                    <td className="p-5">
                      <div className="font-bold text-slate-700 flex items-center gap-2">
                        {paf.responsavel || 'Não informado'}
                        {paf.isDraft && viewMode === 'ativos' && (
                          <span className="bg-amber-100 text-amber-700 text-[9px] uppercase font-black px-1.5 py-0.5 rounded border border-amber-200">
                            Rascunho
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-bold text-slate-400 mt-1 flex items-center gap-1 uppercase tracking-tighter">
                        <FileText size={12} /> {paf.unidadeCras || 'Geral'}
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-xs font-black border border-slate-200">
                        {paf.numeroPlano || '---'}
                      </span>
                    </td>
                    <td className="p-5 text-slate-500 font-medium text-sm">{paf.cpf || 'N/A'}</td>
                    <td className="p-5">
                      <span className={`inline-flex items-center px-3 py-1 text-[10px] font-black uppercase rounded-full border ${
                        paf.situacao === 'Concluído' ? 'bg-slate-100 text-slate-500 border-slate-200' : 
                        paf.situacao === 'Em andamento' ? 'bg-brand-light/30 text-brand-primary border-brand-primary/10' : 
                        'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        {paf.situacao || 'Em andamento'}
                      </span>
                    </td>
                    <td className="p-5 text-slate-400 font-medium text-xs">
                      {viewMode === 'lixeira' && paf.deletedAt
                        ? new Date(paf.deletedAt).toLocaleDateString('pt-BR')
                        : (paf.createdAt ? new Date(paf.createdAt.toMillis()).toLocaleDateString('pt-BR') : 'N/A')}
                    </td>
                    <td className="p-5">
                      {viewMode === 'ativos' ? (
                         <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => setViewModal({ isOpen: true, paf: paf as PAFData })} className="p-2 text-slate-400 hover:text-brand-primary hover:bg-brand-light rounded-lg transition" title="Visualizar Detalhes"><Eye size={18} /></button>
                           <button onClick={() => setVisitModal({ isOpen: true, paf })} className={`p-2 rounded-lg transition ${paf.proximaVisitaData ? 'text-brand-primary hover:bg-brand-light' : 'text-slate-200 cursor-not-allowed'}`} title="Consultar Visitas" disabled={!paf.proximaVisitaData}><Calendar size={18} /></button>
                           <button onClick={() => setTasksModal({ isOpen: true, paf })} className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition" title="Tarefas"><ClipboardCheck size={18} /></button>
                           <button onClick={() => setHistoryModal({ isOpen: true, paf })} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Histórico"><Clock size={18} /></button>
                           <button onClick={() => onEditPlan({ ...paf } as PAFData)} className="p-2 text-slate-400 hover:text-brand-primary hover:bg-brand-light rounded-lg transition" title="Editar"><Edit size={18} /></button>
                          <button onClick={() => handleDelete(paf.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" title="Excluir"><Trash2 size={18} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleRestore(paf.id)} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition" title="Restaurar"><RefreshCw size={18} /></button>
                          <button onClick={() => handlePermanentDelete(paf.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" title="Excluir Permanente"><Trash2 size={18} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-slate-200" size={40} /></td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100">
          {displayedPafs.length > 0 ? (
            displayedPafs.map((paf) => (
              <div key={paf.id} className={`p-5 space-y-4 ${paf.isDraft && viewMode === 'ativos' ? 'bg-amber-50/10' : ''}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 leading-tight">{paf.responsavel || 'Não informado'}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-black border border-slate-200">
                        № {paf.numeroPlano || '---'}
                      </span>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">CPF: {paf.cpf || 'N/A'} • {paf.unidadeCras || 'Geral'}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-full border ${
                    paf.situacao === 'Concluído' ? 'bg-slate-100 text-slate-500 border-slate-200' : 
                    paf.situacao === 'Em andamento' ? 'bg-brand-light/30 text-brand-primary border-brand-primary/10' : 
                    'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>
                    {paf.situacao || 'Em andamento'}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                  {viewMode === 'ativos' ? (
                    <>
                      <button onClick={() => setViewModal({ isOpen: true, paf: paf as PAFData })} className="p-2.5 bg-slate-100 text-slate-500 rounded-xl active:scale-95 transition" title="Visualizar"><Eye size={18} /></button>
                      <button onClick={() => onEditPlan({ ...paf } as PAFData)} className="flex-1 bg-brand-primary/10 text-brand-primary py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition">
                        <Edit size={14} /> Editar
                      </button>
                      <button onClick={() => setVisitModal({ isOpen: true, paf })} className={`p-2.5 rounded-xl active:scale-95 transition ${paf.proximaVisitaData ? 'bg-brand-light text-brand-primary' : 'bg-slate-50 text-slate-200'}`} disabled={!paf.proximaVisitaData}><Calendar size={18} /></button>
                      <button onClick={() => setTasksModal({ isOpen: true, paf })} className="p-2.5 bg-slate-100 text-slate-500 rounded-xl active:scale-95 transition"><ClipboardCheck size={18} /></button>
                      <button onClick={() => setHistoryModal({ isOpen: true, paf })} className="p-2.5 bg-slate-100 text-slate-500 rounded-xl active:scale-95 transition"><Clock size={18} /></button>
                      <button onClick={() => handleDelete(paf.id)} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl active:scale-95 transition border border-rose-100"><Trash2 size={18} /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleRestore(paf.id)} className="flex-1 bg-teal-50 text-teal-600 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-teal-100 active:scale-95 transition">
                        <RefreshCw size={14} /> Restaurar
                      </button>
                      <button onClick={() => handlePermanentDelete(paf.id)} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl active:scale-95 transition border border-rose-100"><Trash2 size={18} /></button>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-400 italic text-sm">Nenhum registro encontrado.</div>
          )}
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 text-rose-600 mb-4">
                <Trash2 size={24} />
                <h3 className="text-xl font-bold text-slate-800">Confirmar Exclusão</h3>
              </div>
              <p className="text-slate-600">
                {deleteConfirm.permanent 
                  ? "Tem certeza que deseja EXCLUIR DEFINITIVAMENTE este plano? Esta ação não pode ser desfeita e todos os dados serão perdidos." 
                  : "Deseja enviar este plano para a lixeira? Você poderá restaurá-lo em até 30 dias."}
              </p>
            </div>
            <div className="border-t border-slate-100 bg-slate-50 p-4 flex justify-end gap-3">
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              >
                Cancelar
              </button>
              <button 
                onClick={executeDelete}
                className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm transition"
              >
                {deleteConfirm.permanent ? "Excluir pra sempre" : "Mover para lixeira"}
              </button>
            </div>
          </div>
        </div>
      )}

      <HistoryModal 
        isOpen={historyModal.isOpen} 
        onClose={() => setHistoryModal({ ...historyModal, isOpen: false })} 
        history={historyModal.paf?.history || []}
        responsavel={historyModal.paf?.responsavel || ''}
      />

      <TasksModal
        isOpen={tasksModal.isOpen}
        onClose={() => {
          setTasksModal({ ...tasksModal, isOpen: false });
          fetchPAFs(); // Refresh to show task updates if any
        }}
        pafId={tasksModal.paf?.id || ''}
        initialTasks={tasksModal.paf?.tasks || []}
        responsavel={tasksModal.paf?.responsavel || ''}
        unidadeCras={tasksModal.paf?.unidadeCras || userProfile?.unidadeCras || ''}
      />

      {visitModal.isOpen && visitModal.paf && (
        <VisitManagementModal
          isOpen={visitModal.isOpen}
          onClose={() => {
            setVisitModal({ ...visitModal, isOpen: false });
            fetchPAFs();
          }}
          paf={visitModal.paf}
          onUpdate={fetchPAFs}
        />
      )}

      <PAFViewModal 
        isOpen={viewModal.isOpen} 
        onClose={() => setViewModal({ ...viewModal, isOpen: false })} 
        paf={viewModal.paf} 
      />
    </div>
  );
}
