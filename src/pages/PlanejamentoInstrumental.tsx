import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Users, 
  Package, 
  Coffee, 
  ChevronLeft, 
  ChevronRight, 
  LayoutGrid, 
  List, 
  MoreVertical, 
  Trash2, 
  Edit2,
  FileSpreadsheet,
  Download,
  AlertCircle,
  MapPin,
  CheckCircle2,
  CalendarDays,
  FileBarChart,
  Target,
  ArrowUpRight,
  ClipboardList,
  Zap,
  Sparkles,
  Activity,
  Layers,
  Shield,
  Clock,
  Briefcase,
  Compass,
  Globe,
  Settings,
  Utensils,
  UserRound,
  Heart,
  Archive,
  Shapes,
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '../AuthProvider';
import { getPlanejamentos, savePlanejamento, updatePlanejamento, deletePlanejamento } from '../services/planejamentoService';
import type { PlanejamentoInstrumental } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const UNIDADES_LIST = ['Cras Camboatã', 'Cras Morada do Sol', 'Cras Jaderlândia', 'Cras Nagibão'] as const;
const SERVICOS_LIST = ['PAIF', 'SCFV', 'SPSBDGC', 'Outros'] as const;

export default function PlanejamentoInstrumentalUI() {
  const { user, userProfile } = useAuth();
  const [planejamentos, setPlanejamentos] = useState<PlanejamentoInstrumental[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedUnit, setSelectedUnit] = useState<string>(userProfile?.role === 'ADMIN' ? 'Todos' : userProfile?.unidadeCras || 'Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PlanejamentoInstrumental | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'grid' | 'dashboard'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    unidadeCras: (userProfile?.unidadeCras || 'Cras Camboatã') as any,
    data: format(new Date(), 'yyyy-MM-dd'),
    tematica: '',
    atividadeAcao: '',
    servico: 'PAIF' as any,
    local: '',
    materiaisNecessarios: '',
    quantidadeMateriais: 0,
    quantidadeFamilias: 0,
    quantidadeParticipantes: 0,
    quantidadeLanches: 0,
    observacoes: ''
  });

  useEffect(() => {
    fetchData();
  }, [userProfile]);

  const fetchData = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      const data = await getPlanejamentos(userProfile);
      setPlanejamentos(data);
    } catch (error) {
      console.error('Error fetching planejamentos:', error);
      toast.error('Erro ao carregar planejamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) return;

    try {
      if (editingItem?.id) {
        await updatePlanejamento(editingItem.id, {
          ...formData,
          quantidadeMateriais: Number(formData.quantidadeMateriais),
          quantidadeFamilias: Number(formData.quantidadeFamilias),
          quantidadeParticipantes: Number(formData.quantidadeParticipantes),
          quantidadeLanches: Number(formData.quantidadeLanches)
        });
        toast.success('Planejamento atualizado!');
      } else {
        await savePlanejamento({
          ...formData,
          quantidadeMateriais: Number(formData.quantidadeMateriais),
          quantidadeFamilias: Number(formData.quantidadeFamilias),
          quantidadeParticipantes: Number(formData.quantidadeParticipantes),
          quantidadeLanches: Number(formData.quantidadeLanches),
          tecnicoId: user.uid,
          tecnicoNome: userProfile.name
        });
        toast.success('Planejamento salvo!');
      }
      setIsModalOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (error) {
      toast.error('Erro ao salvar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este item?')) return;
    try {
      await deletePlanejamento(id);
      toast.success('Excluído');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  const handleEdit = (item: PlanejamentoInstrumental) => {
    setEditingItem(item);
    setFormData({
      unidadeCras: item.unidadeCras,
      data: item.data.split('T')[0],
      tematica: item.tematica,
      atividadeAcao: item.atividadeAcao || '',
      servico: item.servico,
      local: item.local || '',
      materiaisNecessarios: item.materiaisNecessarios,
      quantidadeMateriais: item.quantidadeMateriais,
      quantidadeFamilias: item.quantidadeFamilias,
      quantidadeParticipantes: item.quantidadeParticipantes || 0,
      quantidadeLanches: item.quantidadeLanches,
      observacoes: item.observacoes || ''
    });
    setIsModalOpen(true);
  };

  const filteredItems = planejamentos.filter(item => {
    const matchesUnit = selectedUnit === 'Todos' || item.unidadeCras === selectedUnit;
    const matchesMonth = isSameMonth(new Date(item.data), currentDate);
    const matchesSearch = item.tematica.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.servico.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesUnit && matchesMonth && matchesSearch;
  });

  const totals = filteredItems.reduce((acc, item) => ({
    familias: acc.familias + (item.quantidadeFamilias || 0),
    participantes: acc.participantes + (item.quantidadeParticipantes || 0),
    lanches: acc.lanches + (item.quantidadeLanches || 0),
    materiais: acc.materiais + (item.quantidadeMateriais || 0),
    atividades: acc.atividades + 1
  }), { familias: 0, participantes: 0, lanches: 0, materiais: 0, atividades: 0 });

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 lg:p-8 space-y-8 font-sans">
      
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-brand-primary font-black uppercase tracking-tighter text-xs">
            <Zap size={14} className="fill-brand-primary animate-pulse" />
            Management Suite
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            Planejamento Instrumental
          </h1>
          <p className="text-slate-500 font-medium text-sm">Organização estratégica de serviços e ações socioassistenciais</p>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setEditingItem(null);
            setFormData({
              unidadeCras: (userProfile?.unidadeCras || 'Cras Camboatã') as any,
              data: format(new Date(), 'yyyy-MM-dd'),
              tematica: '',
              atividadeAcao: '',
              servico: 'PAIF' as any,
              local: '',
              materiaisNecessarios: '',
              quantidadeMateriais: 0,
              quantidadeFamilias: 0,
              quantidadeParticipantes: 0,
              quantidadeLanches: 0,
              observacoes: ''
            });
            setIsModalOpen(true);
          }}
          className="bg-brand-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-brand-primary/25 flex items-center gap-3 self-start lg:self-center transition-all bg-gradient-to-br from-brand-primary to-blue-800"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" strokeWidth={3} />
          Nova Atividade
        </motion.button>
      </div>

      {/* Modern Control Bar */}
      <div className="bg-white/70 backdrop-blur-md p-2 rounded-[28px] border border-white shadow-xl shadow-slate-200/50 flex flex-col lg:flex-row items-center gap-4">
        
        {/* Date Selector */}
        <div className="flex items-center bg-slate-100/50 p-1 rounded-2xl w-full lg:w-auto">
          <button 
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-3 text-slate-400 hover:text-brand-primary hover:bg-white rounded-xl transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="px-6 py-2 min-w-[180px] text-center">
            <span className="text-xs font-black text-slate-800 uppercase tracking-widest">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </span>
          </div>
          <button 
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-3 text-slate-400 hover:text-brand-primary hover:bg-white rounded-xl transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por temática, serviço ou local..."
            className="w-full pl-14 pr-6 py-4 bg-transparent border-none text-sm font-medium placeholder:text-slate-300 focus:ring-0"
          />
        </div>

        {/* View Selection */}
        <div className="flex bg-slate-100/50 p-1 rounded-2xl">
          {[
            { id: 'dashboard', icon: Layers, label: 'Resumo' },
            { id: 'list', icon: List, label: 'Lista' },
            { id: 'grid', icon: LayoutGrid, label: 'Cards' },
            { id: 'calendar', icon: Calendar, label: 'Agenda' }
          ].map((view) => (
            <button 
              key={view.id}
              onClick={() => setViewMode(view.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                viewMode === view.id 
                  ? 'bg-white text-brand-primary shadow-sm font-black' 
                  : 'text-slate-400 font-bold hover:text-slate-600'
              } text-[10px] uppercase tracking-widest`}
            >
              <view.icon size={16} />
              <span className="hidden xl:block">{view.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Unit Filters */}
      <div className="flex flex-wrap gap-2 lg:gap-3">
        {['Todos', ...UNIDADES_LIST].map((unit) => (
          <button
            key={unit}
            onClick={() => setSelectedUnit(unit)}
            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] transition-all border-2
              ${selectedUnit === unit 
                ? 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                : 'bg-white border-white text-slate-500 hover:border-slate-200 hover:bg-slate-50'}
            `}
          >
            {unit}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
               <Zap className="animate-pulse text-brand-primary fill-brand-primary/20" size={18} />
            </div>
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode + selectedUnit + currentDate.toISOString()}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {viewMode === 'dashboard' ? (
              <div className="space-y-10">
                
                {/* Dashboard Hero Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Famílias', value: totals.familias, icon: Heart, color: 'text-brand-primary', bg: 'bg-brand-primary', trend: '+12%', shadow: 'shadow-blue-500/20' },
                    { label: 'Participantes', value: totals.participantes, icon: Users, color: 'text-sky-600', bg: 'bg-sky-500', trend: '+5%', shadow: 'shadow-sky-500/20' },
                    { label: 'Total Lanches', value: totals.lanches, icon: Utensils, color: 'text-slate-600', bg: 'bg-slate-600', trend: 'Estável', shadow: 'shadow-slate-500/20' },
                    { label: 'Total Materiais', value: totals.materiais, icon: Archive, color: 'text-slate-900', bg: 'bg-slate-900', trend: '-2%', shadow: 'shadow-slate-900/20' },
                  ].map((stat, i) => (
                    <div key={i} className="relative group overflow-hidden">
                      <div className={`h-full bg-white border border-slate-100 p-8 rounded-[36px] shadow-sm hover:shadow-2xl transition-all duration-500`}>
                        <div className="flex justify-between items-start mb-6">
                           <div className={`p-4 rounded-3xl ${stat.bg.replace('500', '50').replace('600', '100').replace('900', '100').replace('brand-primary', 'blue-50')} ${stat.color} group-hover:scale-110 transition-transform duration-500 shadow-inner`}>
                              <stat.icon size={24} strokeWidth={2.5} />
                           </div>
                           <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">
                              <ArrowUpRight size={10} />
                              {stat.trend}
                           </div>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                        <h4 className="text-4xl font-black text-slate-900">{stat.value}</h4>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Regional Analysis Table */}
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
                  <div className="p-8 lg:p-10 bg-slate-900">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                       <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Análise Geográfica</span>
                          <h3 className="text-2xl font-black text-white mt-1">Consolidado por Unidade</h3>
                       </div>
                       <div className="bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
                          <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Filtro Ativo</p>
                          <p className="text-sm font-black text-white uppercase">{selectedUnit}</p>
                       </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="px-10 py-6 border-b border-slate-100">Equipamento CRAS</th>
                          <th className="px-10 py-6 border-b border-slate-100 text-center">Famílias</th>
                          <th className="px-10 py-6 border-b border-slate-100 text-center">Participantes</th>
                          <th className="px-10 py-6 border-b border-slate-100 text-center">Materiais</th>
                          <th className="px-10 py-6 border-b border-slate-100 text-center">Lanches</th>
                          <th className="px-10 py-6 border-b border-slate-100 text-right">Progresso Anual</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {UNIDADES_LIST.map((unit) => {
                          const unitItems = planejamentos.filter(i => i.unidadeCras === unit);
                          const uTotals = unitItems.reduce((acc, i) => ({
                            f: acc.f + (i.quantidadeFamilias || 0),
                            p: acc.p + (i.quantidadeParticipantes || 0),
                            m: acc.m + (i.quantidadeMateriais || 0),
                            l: acc.l + (i.quantidadeLanches || 0)
                          }), { f: 0, p: 0, m: 0, l: 0 });
                          
                          return (
                            <tr key={unit} className="group hover:bg-slate-50/50 transition-colors">
                              <td className="px-10 py-6">
                                <div className="flex items-center gap-4">
                                   <div className={`w-3 h-3 rounded-full ${
                                      unit === 'Cras Camboatã' ? 'bg-sky-400' : 
                                      unit === 'Cras Morada do Sol' ? 'bg-blue-600' :
                                      unit === 'Cras Jaderlândia' ? 'bg-slate-400' :
                                      'bg-slate-900'
                                   }`}></div>
                                   <span className="text-sm font-black text-slate-800">{unit}</span>
                                </div>
                              </td>
                              <td className="px-10 py-6 text-center text-sm font-black text-slate-600">{uTotals.f}</td>
                              <td className="px-10 py-6 text-center text-sm font-black text-brand-primary">{uTotals.p}</td>
                              <td className="px-10 py-6 text-center text-sm font-black text-slate-600">{uTotals.m}</td>
                              <td className="px-10 py-6 text-center text-sm font-black text-slate-600">{uTotals.l}</td>
                              <td className="px-10 py-6">
                                 <div className="flex items-center justify-end gap-3">
                                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                       <div className="h-full bg-brand-primary" style={{ width: `${Math.min(100, (uTotals.f / 10))} %` }}></div>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400">{Math.round((uTotals.p / 5))} %</span>
                                 </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Secondary Metrics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between mb-8">
                         <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                            <Activity className="text-sky-500" size={18} />
                            Desempenho por Serviço
                         </h4>
                      </div>
                      <div className="space-y-6">
                         {SERVICOS_LIST.filter(s => s !== 'Outros').map((service, idx) => {
                            const serviceItems = filteredItems.filter(i => i.servico === service);
                            const sTotals = serviceItems.reduce((acc, i) => ({
                              f: acc.f + (i.quantidadeFamilias || 0),
                              p: acc.p + (i.quantidadeParticipantes || 0)
                            }), { f: 0, p: 0 });
                            
                            return (
                               <div key={service} className="group">
                                  <div className="flex justify-between items-end mb-2">
                                     <span className="text-xs font-black text-slate-600 uppercase tracking-wider">{service}</span>
                                     <span className="text-xs font-black text-slate-900">{sTotals.p} Part.</span>
                                  </div>
                                  <div className="relative h-4 bg-slate-50 rounded-full overflow-hidden">
                                     <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, sTotals.p)}%` }}
                                        className={`h-full ${idx === 0 ? 'bg-sky-400' : idx === 1 ? 'bg-blue-600' : 'bg-slate-900'}`}
                                     ></motion.div>
                                  </div>
                               </div>
                            );
                         })}
                      </div>
                   </div>

                   <div className="bg-brand-primary rounded-[32px] p-8 text-white relative overflow-hidden">
                      <div className="relative z-10 space-y-6 h-full flex flex-col justify-between">
                         <div>
                            <h4 className="text-sm font-black uppercase tracking-widest opacity-60">Status do Mês</h4>
                            <h3 className="text-3xl font-black mt-2">Agenda Consolidada</h3>
                         </div>
                         <div className="space-y-4">
                            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10">
                               <CheckCircle2 className="text-sky-300 fill-sky-300/10" size={24} />
                               <div>
                                  <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">{totals.atividades} Atividades</p>
                                  <p className="text-[10px] opacity-60 font-medium italic">Registradas para {format(currentDate, 'MMMM', { locale: ptBR })}</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10">
                               <Shield className="text-blue-300 fill-blue-300/10" size={24} />
                               <div>
                                  <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">Pendente de Materiais</p>
                                  <p className="text-[10px] opacity-60 font-medium italic">2 ações aguardando confirmação</p>
                               </div>
                            </div>
                         </div>
                      </div>
                      <div className="absolute top-0 right-0 p-12 opacity-10">
                        <FileSpreadsheet size={180} />
                      </div>
                   </div>
                </div>
              </div>
            ) : viewMode === 'list' ? (
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100">
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cronograma</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Local & Unidade</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ação / Temática</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Quantidades</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Gestão</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredItems.map((item) => (
                        <tr key={item.id} className="group hover:bg-slate-50/50 transition-all">
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className="text-base font-black text-slate-800 leading-none">{format(new Date(item.data), 'dd/MM')}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">{format(new Date(item.data), 'EEEE', { locale: ptBR })}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col gap-1.5">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border inline-block w-fit
                                ${item.unidadeCras === 'Cras Camboatã' ? 'bg-sky-50 text-sky-600 border-sky-100' : 
                                  item.unidadeCras === 'Cras Morada do Sol' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                  'bg-slate-50 text-slate-600 border-slate-100'}
                              `}>
                                {item.unidadeCras.replace('Cras ', '')}
                              </span>
                              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                <Compass size={12} className="text-brand-primary/40" />
                                {item.local || 'Local não definido'}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6 max-w-[400px]">
                            <div className="flex flex-col gap-1">
                               <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black text-brand-primary uppercase tracking-tight">{item.servico}</span>
                                  <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                  <span className="text-xs font-black text-slate-800 line-clamp-1">{item.tematica}</span>
                               </div>
                               <p className="text-[11px] text-slate-400 italic line-clamp-1">{item.atividadeAcao}</p>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex items-center justify-center gap-6">
                                <div className="text-center group-hover:scale-110 transition-transform">
                                   <p className="text-[9px] font-black text-slate-300 uppercase leading-none mb-1">Part.</p>
                                   <p className="text-sm font-black text-slate-800">{item.quantidadeParticipantes}</p>
                                </div>
                                <div className="text-center group-hover:scale-110 transition-transform">
                                   <p className="text-[9px] font-black text-slate-300 uppercase leading-none mb-1">Lanc.</p>
                                   <p className="text-sm font-black text-slate-800">{item.quantidadeLanches}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button 
                                onClick={() => handleEdit(item)}
                                className="p-3 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white rounded-2xl transition-all"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => item.id && handleDelete(item.id)}
                                className="p-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : viewMode === 'calendar' ? (
              <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
                {/* Calendar Header Days */}
                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-900">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dayTitle => (
                    <div key={dayTitle} className="py-6 text-center text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                      {dayTitle}
                    </div>
                  ))}
                </div>
                
                {/* Calendar Grid Body */}
                <div className="grid grid-cols-7">
                  {(() => {
                    const startMonth = startOfMonth(currentDate);
                    const endMonth = endOfMonth(currentDate);
                    const calendarDays = eachDayOfInterval({
                      start: new Date(startMonth.getFullYear(), startMonth.getMonth(), startMonth.getDate() - startMonth.getDay()),
                      end: new Date(endMonth.getFullYear(), endMonth.getMonth(), endMonth.getDate() + (6 - endMonth.getDay()))
                    });

                    return calendarDays.map((day, dIdx) => {
                      const dayItems = filteredItems.filter(item => isSameDay(new Date(item.data), day));
                      const inCurrentMonth = isSameMonth(day, currentDate);
                      const isTodayStr = isSameDay(day, new Date());

                      return (
                        <div 
                          key={dIdx}
                          onClick={() => {
                            if (!inCurrentMonth) return;
                            setFormData({
                              unidadeCras: (userProfile?.unidadeCras || 'Cras Camboatã') as any,
                              data: format(day, 'yyyy-MM-dd'),
                              tematica: '',
                              atividadeAcao: '',
                              servico: 'PAIF' as any,
                              local: '',
                              materiaisNecessarios: '',
                              quantidadeMateriais: 0,
                              quantidadeFamilias: 0,
                              quantidadeParticipantes: 0,
                              quantidadeLanches: 0,
                              observacoes: ''
                            });
                            setEditingItem(null);
                            setIsModalOpen(true);
                          }}
                          className={`min-h-[160px] p-4 border-r border-b border-slate-100 transition-all hover:bg-slate-50/80 group relative cursor-pointer ${!inCurrentMonth ? 'bg-slate-50/20 grayscale opacity-40' : 'bg-white'}`}
                        >
                          <div className="flex justify-between items-center mb-4">
                            <span className={`text-xs font-black w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              isTodayStr ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30 scale-110' : 
                              inCurrentMonth ? 'text-slate-800' : 'text-slate-200'
                            }`}>
                              {format(day, 'd')}
                            </span>
                            {inCurrentMonth && (
                               <div className="opacity-0 group-hover:opacity-100 p-2 text-brand-primary bg-brand-primary/10 rounded-xl transition-all shadow-sm">
                                  <Plus size={14} strokeWidth={3} />
                               </div>
                            )}
                          </div>
                          
                          <div className="space-y-2 overflow-y-auto max-h-[100px] custom-scrollbar pr-1" onClick={(e) => e.stopPropagation()}>
                            {dayItems.map((dayItem) => (
                              <button 
                                key={dayItem.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(dayItem);
                                }}
                                className={`w-full text-left group/item p-2.5 rounded-2xl text-[10px] font-black border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 block
                                  ${dayItem.unidadeCras === 'Cras Camboatã' ? 'bg-sky-50 text-sky-700 border-sky-100/50' : 
                                    dayItem.unidadeCras === 'Cras Morada do Sol' ? 'bg-blue-50 text-blue-700 border-blue-100/50' :
                                    dayItem.unidadeCras === 'Cras Jaderlândia' ? 'bg-slate-50 text-slate-700 border-slate-100/50' :
                                    'bg-slate-900 text-white border-slate-900'}
                                `}
                              >
                                <p className="line-clamp-2 uppercase tracking-tight">{dayItem.tematica}</p>
                                <div className="mt-2 text-[8px] opacity-40 group-hover/item:opacity-80 flex items-center gap-1">
                                   <Activity size={8} className="animate-pulse" />
                                   {dayItem.servico}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map((item) => (
                  <motion.div 
                    layout
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden relative"
                  >
                    {/* Background Decorative Element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>

                    <div className="relative z-10 space-y-6">
                       <div className="flex justify-between items-start">
                          <div className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm
                             ${item.servico === 'PAIF' ? 'bg-brand-primary text-white' : 
                               item.servico === 'SCFV' ? 'bg-sky-500 text-white' :
                               'bg-slate-900 text-white'}
                          `}>
                             {item.servico}
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                             <button onClick={() => handleEdit(item)} className="p-2.5 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white rounded-xl transition-all">
                                <Edit2 size={14} />
                             </button>
                             <button onClick={() => item.id && handleDelete(item.id)} className="p-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all">
                                <Trash2 size={14} />
                             </button>
                          </div>
                       </div>

                       <div className="space-y-4">
                          <div className="w-16 h-16 bg-slate-900 text-white rounded-[24px] flex flex-col items-center justify-center shadow-xl shadow-slate-900/10">
                              <span className="text-2xl font-black leading-none">{format(new Date(item.data), 'dd')}</span>
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{format(new Date(item.data), 'MMM', { locale: ptBR })}</span>
                          </div>
                          <div>
                             <h4 className="text-xl font-black text-slate-800 leading-tight line-clamp-2">{item.tematica}</h4>
                             <p className="text-xs text-slate-400 font-medium mt-2 flex items-center gap-2">
                                <Compass size={12} className="text-brand-primary" />
                                {item.unidadeCras}
                             </p>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4 py-6 border-t border-slate-50">
                          <div className="flex items-center gap-2">
                             <Users size={14} className="text-slate-300" />
                             <div>
                                <p className="text-[9px] font-black text-slate-300 uppercase leading-none mb-1">Partic.</p>
                                <p className="text-sm font-black text-slate-800">{item.quantidadeParticipantes}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <Utensils size={14} className="text-slate-300" />
                             <div>
                                <p className="text-[9px] font-black text-slate-300 uppercase leading-none mb-1">Lanches</p>
                                <p className="text-sm font-black text-slate-800">{item.quantidadeLanches}</p>
                             </div>
                          </div>
                       </div>

                       <div className="bg-slate-50 p-4 rounded-3xl">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                             <Archive size={12} className="text-brand-primary" />
                             Preparação
                          </p>
                          <p className="text-[11px] text-slate-600 font-medium italic line-clamp-2">{item.materiaisNecessarios || 'Nenhum material listado'}</p>
                       </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Modal / Elegant Overaly Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-2xl max-h-[90vh] shadow-2xl relative z-10 flex flex-col rounded-[40px] overflow-hidden"
            >
              <div className="bg-slate-900 p-12 text-white flex justify-between items-center">
                <div>
                   <span className="text-[10px] font-black text-blue-300 uppercase tracking-[0.3em]">Gestão de Ação</span>
                   <h2 className="text-4xl font-black tracking-tight mt-2 italic shadow-sm">
                     {editingItem ? 'Editando Ação' : 'Novo Registro'}
                   </h2>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="p-4 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-full transition-all group shadow-xl"
                >
                  <Plus size={32} className="rotate-45 group-hover:rotate-180 transition-transform duration-500" strokeWidth={1} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12">
                
                {/* Section: Identificação */}
                <div className="space-y-8">
                   <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                         <Activity size={24} strokeWidth={2.5} />
                      </div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest underline decoration-brand-primary decoration-4 underline-offset-8">Dados da Atividade</h3>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Equipamento Resp.</label>
                        <select 
                          value={formData.unidadeCras}
                          onChange={(e) => setFormData({...formData, unidadeCras: e.target.value as any})}
                          disabled={userProfile?.role !== 'ADMIN' && !!userProfile?.unidadeCras}
                          className="w-full h-16 px-6 bg-slate-50 border-2 border-transparent focus:border-brand-primary/20 rounded-3xl text-sm font-black text-slate-800 outline-none transition-all disabled:opacity-70 appearance-none"
                        >
                          {UNIDADES_LIST.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Data Prevista</label>
                        <input 
                          type="date"
                          value={formData.data}
                          onChange={(e) => setFormData({...formData, data: e.target.value})}
                          required
                          className="w-full h-16 px-6 bg-slate-50 border-2 border-transparent focus:border-brand-primary/20 rounded-3xl text-sm font-black text-slate-800 outline-none transition-all appearance-none"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Serviço Vinculado</label>
                        <div className="flex flex-wrap gap-3">
                          {SERVICOS_LIST.map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setFormData({...formData, servico: s})}
                              className={`flex-1 min-w-[120px] px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2
                                ${formData.servico === s ? 'bg-brand-primary border-brand-primary text-white shadow-lg' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}
                              `}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Temática do Encontro</label>
                        <input 
                          type="text"
                          value={formData.tematica}
                          onChange={(e) => setFormData({...formData, tematica: e.target.value})}
                          placeholder="Ex: Fortalecimento de Vínculos Familiares"
                          required
                          className="w-full h-16 px-8 bg-slate-50 border-2 border-transparent focus:border-brand-primary/20 rounded-3xl text-sm font-bold text-slate-800 outline-none transition-all placeholder:text-slate-300"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Atividade Específica</label>
                        <input 
                          type="text"
                          value={formData.atividadeAcao}
                          onChange={(e) => setFormData({...formData, atividadeAcao: e.target.value})}
                          placeholder="Ex: Oficina de Artesanato Criativo"
                          className="w-full h-16 px-8 bg-slate-50 border-2 border-transparent focus:border-brand-primary/20 rounded-3xl text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-300"
                        />
                      </div>
                   </div>
                </div>

                {/* Section: Logística */}
                <div className="space-y-8">
                   <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                      <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-600 shadow-inner">
                         <Compass size={24} strokeWidth={2.5} />
                      </div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest underline decoration-brand-primary decoration-4 underline-offset-8">Logística & Materiais</h3>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Local da Ação</label>
                        <input 
                          type="text"
                          value={formData.local}
                          onChange={(e) => setFormData({...formData, local: e.target.value})}
                          placeholder="Ex: Salão Paroquial / CRAS Camboatã"
                          className="w-full h-16 px-8 bg-slate-50 border-2 border-transparent focus:border-brand-primary/20 rounded-3xl text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-300"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Insumos Necessários</label>
                        <textarea 
                          value={formData.materiaisNecessarios}
                          onChange={(e) => setFormData({...formData, materiaisNecessarios: e.target.value})}
                          placeholder="Descreva os materiais fundamentais para a ação..."
                          rows={3}
                          className="w-full px-8 py-6 bg-slate-50 border-2 border-transparent focus:border-brand-primary/20 rounded-[32px] text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-300 resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:col-span-2">
                        {[
                          { key: 'familias', label: 'Famílias', field: 'quantidadeFamilias' },
                          { key: 'part', label: 'Particip.', field: 'quantidadeParticipantes' },
                          { key: 'lanc', label: 'Lanches', field: 'quantidadeLanches' },
                          { key: 'mat', label: 'Materiais', field: 'quantidadeMateriais' },
                        ].map(q => (
                          <div key={q.key} className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block leading-none">{q.label}</label>
                            <input 
                              type="number"
                              min="0"
                              value={formData[q.field as keyof typeof formData]}
                              onChange={(e) => setFormData({...formData, [q.field]: parseInt(e.target.value) || 0})}
                              className="w-full h-16 text-center bg-slate-50 border-2 border-transparent focus:border-brand-primary/20 rounded-2xl text-lg font-black text-slate-800 outline-none transition-all"
                            />
                          </div>
                        ))}
                      </div>
                   </div>
                </div>

                {/* Submit Container */}
                <div className="flex flex-col md:flex-row gap-4 pt-10 border-t border-slate-100">
                  {editingItem && (
                    <button 
                      type="button" 
                      onClick={() => {
                        if (editingItem.id) {
                          handleDelete(editingItem.id);
                          setIsModalOpen(false);
                        }
                      }}
                      className="flex-1 py-6 bg-red-50 hover:bg-red-100 text-red-500 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} />
                      Excluir
                    </button>
                  )}
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-6 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] transition-all"
                  >
                    Descartar
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-6 bg-brand-primary hover:bg-slate-900 text-white rounded-[28px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-brand-primary/20 transition-all flex items-center justify-center gap-2 group"
                  >
                    Confirmar Planejamento
                    <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
