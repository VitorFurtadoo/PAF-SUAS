import React, { useState, useEffect } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  parseISO,
  isToday,
  eachDayOfInterval
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Users, 
  MapPin, 
  Clock, 
  Search,
  Filter,
  MoreVertical,
  ExternalLink,
  ChevronDown,
  Info,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../AuthProvider';
import { getPAFs, updatePAFVisit } from '../services/pafService';
import { getFichasAtendimento, saveFichaAtendimento } from '../services/fichaAtendimentoService';
import type { PAFData, FichaAtendimento } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface CalendarioVisitasProps {
  onEditPlan: (paf: PAFData) => void;
  onOpenFicha?: (fichaId: string) => void;
}

interface ExtendedVisita {
  id: string;
  paf: PAFData;
  data: string;
  hora: string;
  observacoes?: string;
  status: 'Pendente' | 'Realizada';
  tecnico?: string;
}

export default function CalendarioVisitas({ onEditPlan, onOpenFicha }: CalendarioVisitasProps) {
  const { user, userProfile } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [pafs, setPafs] = useState<PAFData[]>([]);
  const [fichas, setFichas] = useState<FichaAtendimento[]>([]);
  const [selectedDayStr, setSelectedDayStr] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCras, setSelectedCras] = useState(() => {
    if (userProfile?.role === 'ADMIN') return 'todos';
    return userProfile?.unidadeCras || 'todos';
  });
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const handleOpenTarget = (vPaf: PAFData) => {
    if (vPaf.isFicha) {
      if (onOpenFicha) {
        onOpenFicha(vPaf.id!);
      } else {
        toast.info("Agendamento vinculado à Ficha de Atendimento");
      }
    } else {
      onEditPlan(vPaf);
    }
  };

  const handleConfirmVisit = async (v: PAFData) => {
    if (!user || !userProfile || !v.id) return;
    
    setConfirmingId(v.id);
    try {
      if (v.isFicha) {
        const originalFicha = fichas.find(f => f.id === v.id);
        if (!originalFicha) throw new Error("Ficha não encontrada");

        const visitDateText = originalFicha.proximaVisitaData!.split('-').reverse().join('/');
        const noteText = originalFicha.proximaVisitaObservacoes ? `\nMotivo/Obs: ${originalFicha.proximaVisitaObservacoes}` : '';
        const newEvolEntry = {
          id: Math.random().toString(36).substring(2, 11),
          data: new Date().toISOString().split('T')[0],
          tecnicoId: user.uid,
          tecnicoNome: userProfile.name,
          descricao: `Visita domiciliar realizada (agendada para ${visitDateText}).${noteText}`
        };

        const visitHistoryEntry = {
          id: crypto.randomUUID(),
          date: originalFicha.proximaVisitaData,
          time: originalFicha.proximaVisitaHora || '',
          tecnico: userProfile.name,
          status: 'Realizada',
          motivo: originalFicha.proximaVisitaObservacoes || 'Confirmada via agenda de visitas'
        };

        const updatedFicha = {
          ...originalFicha,
          proximaVisitaData: '',
          proximaVisitaHora: '',
          proximaVisitaObservacoes: '',
          evolucoes: [...(originalFicha.evolucoes || []), newEvolEntry],
          visitasHistory: [...(originalFicha.visitasHistory || []), visitHistoryEntry]
        };

        await saveFichaAtendimento(updatedFicha);
        setFichas(prev => prev.map(f => f.id === v.id ? updatedFicha : f));
        toast.success('Visita da Ficha de Atendimento confirmada como realizada!');
      } else {
        const visitHistoryEntry = {
          id: crypto.randomUUID(),
          date: v.proximaVisitaData || format(new Date(), 'yyyy-MM-dd'),
          time: v.proximaVisitaHora || format(new Date(), 'HH:mm'),
          tecnico: userProfile.name,
          status: 'Realizada',
          motivo: 'Confirmada via agenda de visitas'
        };

        await updatePAFVisit(v.id, user.uid, userProfile.name, visitHistoryEntry);
        
        setPafs(prev => prev.map(p => p.id === v.id ? {
          ...p,
          proximaVisitaData: null,
          proximaVisitaHora: null,
          proximaVisitaObservacoes: null
        } : p));
        
        toast.success('Visita do PAF confirmada como realizada!');
      }
    } catch (error) {
      console.error('Erro ao confirmar visita:', error);
      toast.error('Erro ao confirmar visita.');
    } finally {
      setConfirmingId(null);
    }
  };

  const handleDayClick = (dateStr: string) => {
    setSelectedDayStr(dateStr);
    setTimeout(() => {
      listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setLoading(true);
      try {
        const data = await getPAFs(userProfile!, user.uid);
        setPafs(data);

        const crasToFetch = userProfile?.role === 'ADMIN' ? undefined : userProfile?.unidadeCras;
        const fichasData = await getFichasAtendimento(crasToFetch);
        setFichas(fichasData || []);
      } catch (error) {
        console.error('Erro ao buscar visitas:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, userProfile]);

  const crasUnits = [
    "Morada do Sol",
    "Nagibão",
    "Camboatã",
    "Jaderlândia"
  ];

  // Agrupar visitas por data - CONSIDERANDO FILTROS para que os pontos no calendário combinem com a lista
  const filteredVisitasMap = React.useMemo(() => {
    const acc: Record<string, ExtendedVisita[]> = {};

    // 1. Processar pafs
    pafs.forEach(paf => {
      if (paf.deletedAt) return;

      const matchSearch = (paf.responsavel || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (paf.cpf || '').includes(searchTerm);
      const matchCras = selectedCras === 'todos' || 
                        (paf.unidadeCras && paf.unidadeCras.trim() === selectedCras.trim());

      if (!matchSearch || !matchCras) return;

      // Visita agendada (Pendente)
      if (paf.proximaVisitaData) {
        const dateKey = paf.proximaVisitaData.includes('T') ? paf.proximaVisitaData.split('T')[0] : paf.proximaVisitaData;
        if (!acc[dateKey]) acc[dateKey] = [];
        
        acc[dateKey].push({
          id: `pending-${paf.id}`,
          paf,
          data: dateKey,
          hora: paf.proximaVisitaHora || '',
          observacoes: paf.proximaVisitaObservacoes || '',
          status: 'Pendente',
          tecnico: paf.tecnicoNome1
        });
      }

      // Visitas do histórico (Realizadas)
      if (paf.visitasHistory && Array.isArray(paf.visitasHistory)) {
        paf.visitasHistory.forEach((h: any) => {
          if (h.status === 'Realizada' || h.status === 'concluida') {
            const rawDate = h.date || h.dataAgendada || h.dataRealizacao;
            if (!rawDate) return;
            
            const dateKey = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
            if (!acc[dateKey]) acc[dateKey] = [];

            acc[dateKey].push({
              id: `history-${h.id}`,
              paf,
              data: dateKey,
              hora: h.time || h.horaAgendada || '',
              observacoes: h.motivo || h.observacoesOriginais || '',
              status: 'Realizada',
              tecnico: h.tecnico || paf.tecnicoNome1
            });
          }
        });
      }
    });

    // 2. Processar fichas
    fichas.forEach(ficha => {
      const matchSearch = (ficha.responsavelFamiliar || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (ficha.cpf || '').includes(searchTerm);
      const matchCras = selectedCras === 'todos' || 
                        (ficha.unidadeCras && ficha.unidadeCras.trim() === selectedCras.trim());

      if (!matchSearch || !matchCras) return;

      // Pendente
      if (ficha.proximaVisitaData) {
        const dateKey = ficha.proximaVisitaData.includes('T') ? ficha.proximaVisitaData.split('T')[0] : ficha.proximaVisitaData;
        if (!acc[dateKey]) acc[dateKey] = [];

        const mockPaf = {
          id: ficha.id,
          responsavel: ficha.responsavelFamiliar,
          cpf: ficha.cpf || '',
          unidadeCras: ficha.unidadeCras as any,
          endereco: 'Endereço registrado na Ficha de Atendimento',
          tecnicoNome1: ficha.tecnicoNome,
          isFicha: true
        } as any as PAFData;

        acc[dateKey].push({
          id: `pending-ficha-${ficha.id}`,
          paf: mockPaf,
          data: dateKey,
          hora: ficha.proximaVisitaHora || '',
          observacoes: ficha.proximaVisitaObservacoes || '',
          status: 'Pendente',
          tecnico: ficha.tecnicoNome
        });
      }

      // Histórico
      if (ficha.visitasHistory && Array.isArray(ficha.visitasHistory)) {
        ficha.visitasHistory.forEach((h: any) => {
          const rawDate = h.date || h.dataAgendada || h.dataRealizacao;
          if (!rawDate) return;
          
          const dateKey = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
          if (!acc[dateKey]) acc[dateKey] = [];

          const mockPaf = {
            id: ficha.id,
            responsavel: ficha.responsavelFamiliar,
            cpf: ficha.cpf || '',
            unidadeCras: ficha.unidadeCras as any,
            endereco: 'Endereço registrado na Ficha de Atendimento',
            tecnicoNome1: ficha.tecnicoNome,
            isFicha: true
          } as any as PAFData;

          acc[dateKey].push({
            id: `history-ficha-${h.id}`,
            paf: mockPaf,
            data: dateKey,
            hora: h.time || '',
            observacoes: h.motivo || '',
            status: 'Realizada',
            tecnico: h.tecnico || ficha.tecnicoNome
          });
        });
      }
    });

    return acc;
  }, [pafs, fichas, searchTerm, selectedCras]);

  const renderHeader = () => {
    return (
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Agenda de Visitas</h1>
            <p className="text-slate-500 text-sm font-medium">Gerenciamento visual de atendimentos em domicílio</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-500"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="px-4 py-1 text-center min-w-[150px]">
            <span className={`text-sm font-black uppercase tracking-widest ${isSameMonth(currentMonth, new Date()) ? 'text-brand-primary' : 'text-slate-800'}`}>
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
          </div>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-500"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day, index) => (
          <div key={index} className="text-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{day}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, 'yyyy-MM-dd');
        const isSelected = selectedDayStr === formattedDate;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isTodayDay = isToday(day);
        const dayVisitas = filteredVisitasMap[formattedDate] || [];
        const currentFormattedDate = formattedDate;

        days.push(
          <div
            key={day.toString()}
            className={`
              min-h-[100px] md:min-h-[120px] p-2 border border-slate-100 transition-all relative overflow-hidden group
              ${!isCurrentMonth ? 'bg-slate-50/50' : 'bg-white'}
              ${isSelected ? 'ring-2 ring-brand-primary ring-inset z-10' : ''}
              hover:bg-slate-50 cursor-pointer
            `}
            onClick={() => handleDayClick(currentFormattedDate)}
          >
            <div className="flex justify-between items-start mb-1">
              <span className={`
                text-xs font-bold leading-none w-6 h-6 flex items-center justify-center rounded-lg
                ${!isCurrentMonth ? 'text-slate-300' : isTodayDay ? 'bg-brand-primary text-white shadow-sm' : 'text-slate-600'}
              `}>
                {format(day, 'd')}
              </span>
              {dayVisitas.length > 0 && (
                <div className="flex -space-x-1">
                  {dayVisitas.some(v => v.status === 'Pendente') && (
                    <div className="w-4 h-4 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center">
                       <span className="text-[8px] font-black text-white">{dayVisitas.filter(v => v.status === 'Pendente').length}</span>
                    </div>
                  )}
                  {dayVisitas.some(v => v.status === 'Realizada') && (
                    <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                       <span className="text-[8px] font-black text-white">{dayVisitas.filter(v => v.status === 'Realizada').length}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1">
              {dayVisitas.slice(0, 3).map((v, idx) => (
                <div 
                  key={idx} 
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold truncate border flex items-center gap-1
                    ${v.status === 'Realizada' ? 'bg-slate-100 text-slate-500 border-slate-200 line-through opacity-70' : 
                      v.paf.unidadeCras === 'Morada do Sol' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                      v.paf.unidadeCras === 'Nagibão' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      v.paf.unidadeCras === 'Camboatã' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                      'bg-amber-50 text-amber-700 border-amber-100'}
                  `}
                >
                  <Users size={8} />
                  {(v.paf.responsavel || '').split(' ')[0]}
                </div>
              ))}
              {dayVisitas.length > 3 && (
                <div className="text-[9px] font-black text-slate-400 pl-1">
                  + {dayVisitas.length - 3} mais
                </div>
              )}
            </div>
            
            {/* Indicador de hoje sutil se não selecionado */}
            {isTodayDay && !isSelected && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary opacity-50"></div>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }

    return <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">{rows}</div>;
  };

  const renderVisitasList = () => {
    if (!selectedDayStr) return null;

    const dayVisitas = filteredVisitasMap[selectedDayStr] || [];

    const displayDate = parseISO(selectedDayStr);

    return (
      <div className="mt-8" ref={listRef}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-800">
              Visitas para {format(displayDate, "dd 'de' MMMM", { locale: ptBR })}
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              {dayVisitas.length} {dayVisitas.length === 1 ? 'visita agendada' : 'visitas agendadas'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar família..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all w-full sm:w-64"
              />
            </div>
            
            {(userProfile?.role === 'ADMIN' || userProfile?.role === 'COORDENADOR') && (
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                  value={selectedCras}
                  onChange={(e) => setSelectedCras(e.target.value)}
                  className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all cursor-pointer font-bold text-slate-700"
                >
                  <option value="todos">Todas Unidades</option>
                  {crasUnits.map(unit => <option key={unit} value={unit}>CRAS {unit}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              </div>
            )}
          </div>
        </div>

        {dayVisitas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {dayVisitas.map((v) => (
                <motion.div
                  key={v.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`bg-white border rounded-2xl p-5 hover:shadow-md transition-all group relative overflow-hidden ${
                    v.status === 'Realizada' ? 'border-emerald-100 bg-emerald-50/10' : 'border-slate-200'
                  }`}
                >
                  {v.status === 'Realizada' && (
                    <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-emerald-500/10 rounded-full flex items-end justify-start pb-6 pl-6">
                      <CheckCircle size={32} className="text-emerald-500/20" />
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-2">
                      <div className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-2 shadow-sm
                        ${v.paf.unidadeCras === 'Morada do Sol' ? 'bg-blue-600 text-white' : 
                          v.paf.unidadeCras === 'Nagibão' ? 'bg-emerald-600 text-white' :
                          v.paf.unidadeCras === 'Camboatã' ? 'bg-purple-600 text-white' :
                          'bg-amber-600 text-white'}
                      `}>
                        <MapPin size={12} />
                        {v.paf.unidadeCras}
                      </div>
                      
                      {v.status === 'Realizada' && (
                        <div className="px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-2 shadow-sm">
                          <CheckCircle size={12} />
                          Realizada
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => handleOpenTarget(v.paf)}
                      className="p-1.5 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-all z-10"
                    >
                      <ExternalLink size={18} />
                    </button>
                  </div>

                  <div className="mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Responsável Familiar</p>
                    <h3 className="font-black text-lg text-slate-800 group-hover:text-brand-primary transition-colors leading-tight">{v.paf.responsavel}</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">CPF: {v.paf.cpf || '---'}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                      <div className="w-8 h-8 bg-slate-50 flex items-center justify-center rounded-lg text-brand-primary">
                        <Clock size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                          {v.status === 'Realizada' ? 'Horário da Visita' : 'Horário Agendado'}
                        </p>
                        <span>{v.hora || 'Hora não definida'}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                      <div className="w-8 h-8 bg-slate-50 flex items-center justify-center rounded-lg text-brand-primary">
                        <MapPin size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Endereço</p>
                        <span className="line-clamp-1">{v.paf.endereco}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                      <div className="w-8 h-8 bg-slate-50 flex items-center justify-center rounded-lg text-brand-primary">
                        <Users size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Técnico</p>
                        <span>{v.tecnico || 'Técnico não atribuído'}</span>
                      </div>
                    </div>
                  </div>

                  {v.observacoes && (
                    <div className="mt-4 pt-4 border-t border-slate-50">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        {v.status === 'Realizada' ? 'Observações da Realização' : 'Observações do Agendamento'}
                      </p>
                      <div className="flex gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <Info size={14} className="text-brand-primary shrink-0 mt-0.5" />
                        <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                          {v.observacoes}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex flex-col gap-2">
                    {v.status === 'Pendente' && (
                      <button 
                        onClick={() => handleConfirmVisit(v.paf)}
                        disabled={confirmingId === v.paf.id}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                      >
                        {confirmingId === v.paf.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                        Confirmar Realização
                      </button>
                    )}
                    
                    <button 
                      onClick={() => handleOpenTarget(v.paf)}
                      className="w-full py-2.5 bg-slate-50 hover:bg-brand-primary hover:text-white text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 border border-slate-100 group-hover:border-transparent flex items-center justify-center gap-2"
                    >
                      <ExternalLink size={14} />
                      {v.paf.isFicha ? 'Abrir Ficha de Atendimento' : 'Abrir Plano (PAF)'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <CalendarIcon size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Nenhuma visita agendada</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-4">
              {searchTerm || (selectedCras !== 'todos' && userProfile?.role === 'ADMIN')
                ? 'Os filtros aplicados não retornaram resultados para este dia.'
                : 'Não há agendamentos registrados para esta data.'}
            </p>
            {(searchTerm || selectedCras !== 'todos') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCras('todos');
                }}
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-xs font-black uppercase tracking-widest transition-all"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold text-sm animate-pulse">Sincronizando agenda...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto overflow-hidden animate-in fade-in duration-500">
      {renderHeader()}
      
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 md:p-6 mb-8">
        {renderDays()}
        {renderCells()}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Morada do Sol</p>
          <p className="text-xl font-black text-blue-800">{pafs.filter(p => !p.deletedAt && p.unidadeCras === 'Morada do Sol' && p.proximaVisitaData).length}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Nagibão</p>
          <p className="text-xl font-black text-emerald-800">{pafs.filter(p => !p.deletedAt && p.unidadeCras === 'Nagibão' && p.proximaVisitaData).length}</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 p-3 rounded-2xl">
          <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">Camboatã</p>
          <p className="text-xl font-black text-purple-800">{pafs.filter(p => !p.deletedAt && p.unidadeCras === 'Camboatã' && p.proximaVisitaData).length}</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-3 rounded-2xl">
          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Jaderlândia</p>
          <p className="text-xl font-black text-amber-800">{pafs.filter(p => !p.deletedAt && p.unidadeCras === 'Jaderlândia' && p.proximaVisitaData).length}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-8 bg-brand-primary/5 p-4 rounded-2xl border border-brand-primary/10">
        <div className="w-8 h-8 bg-brand-primary text-white rounded-lg flex items-center justify-center shrink-0">
          <Info size={18} />
        </div>
        <p className="text-xs font-bold text-brand-primary/80 leading-relaxed">
          Dica: Clique em qualquer dia do calendário para ver o detalhamento das visitas agendadas. Você pode filtrar por nome da família ou por unidade do CRAS.
        </p>
      </div>

      {renderVisitasList()}
    </div>
  );
}
