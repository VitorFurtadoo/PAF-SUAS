import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  FileText, 
  Trash2, 
  Edit2, 
  MoreVertical,
  ChevronRight,
  ClipboardCheck,
  AlertCircle,
  Download,
  Check
} from 'lucide-react';
import { useAuth } from '../AuthProvider';
import { getFichasAtendimento, saveFichaAtendimento, deleteFichaAtendimento } from '../services/fichaAtendimentoService';
import { getTeclicosPorUnidade } from '../services/userService';
import { generateFichaAtendimentoPdf } from '../utils/generatePdf';
import type { FichaAtendimento, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface FichasAtendimentoProps {
  defaultCreate?: boolean;
  selectedFichaId?: string | null;
  onClearSelectedFichaId?: () => void;
}

export default function FichasAtendimento({ 
  defaultCreate = false,
  selectedFichaId = null,
  onClearSelectedFichaId
}: FichasAtendimentoProps) {
  const { user, userProfile } = useAuth();
  const [fichas, setFichas] = useState<FichaAtendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [panelMode, setPanelMode] = useState<'view' | 'edit' | 'create'>('create');
  const [selectedFicha, setSelectedFicha] = useState<FichaAtendimento | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Todos');
  const [selectedCras, setSelectedCras] = useState('todos');
  const [tecnicos, setTecnicos] = useState<UserProfile[]>([]);
  
  // States for dynamic evolution/progress tracking
  const [newEvolDescription, setNewEvolDescription] = useState('');
  const [newEvolEncaminhamentos, setNewEvolEncaminhamentos] = useState('');
  const [newEvolDate, setNewEvolDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAddingEvol, setIsAddingEvol] = useState(false);
  const [evolSaving, setEvolSaving] = useState(false);

  // States for quick visit scheduling from within Ficha
  const [isQuickScheduling, setIsQuickScheduling] = useState(false);
  const [quickVisitData, setQuickVisitData] = useState({ date: '', time: '', obs: '' });

  // Trigger opening a selected ficha from calendar reference
  useEffect(() => {
    if (selectedFichaId && fichas.length > 0) {
      const found = fichas.find(f => f.id === selectedFichaId);
      if (found) {
        handleOpenPanel('view', found);
      }
      if (onClearSelectedFichaId) {
        onClearSelectedFichaId();
      }
    }
  }, [selectedFichaId, fichas]);

  useEffect(() => {
    if (defaultCreate) {
      handleOpenPanel('create');
    }
  }, [defaultCreate]);

  useEffect(() => {
    const loadTecnicos = async () => {
      try {
        if (userProfile?.role === 'ADMIN') {
          const uList = await getTeclicosPorUnidade('');
          setTecnicos(uList.filter(u => u.id !== user?.uid));
        } else if (userProfile?.unidadeCras) {
          const uList = await getTeclicosPorUnidade(userProfile.unidadeCras);
          setTecnicos(uList.filter(u => u.id !== user?.uid));
        }
      } catch (error) {
        console.error("Erro ao carregar técnicos para co-autor", error);
      }
    };
    loadTecnicos();
  }, [userProfile?.unidadeCras, userProfile?.role, user?.uid]);

  // Form states
  const [formData, setFormData] = useState<Partial<FichaAtendimento>>({
    unidadeCras: (userProfile?.role === 'ADMIN') ? '' : (userProfile?.unidadeCras || ''),
    dataAtendimento: new Date().toISOString().split('T')[0],
    tipoAtendimento: [],
    responsavelFamiliar: '',
    cpf: '',
    coAutorId: '',
    coAutorNome: '',
    demandaInicial: '',
    formaAcesso: '',
    tipoAtendimentoOutro: '',
    descricao: '',
    encaminhamentos: '',
    descricaoEncaminhamento: '',
    proximaVisitaData: '',
    proximaVisitaHora: '',
    proximaVisitaObservacoes: ''
  });

  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleToggleType = (type: string) => {
    const currentTypes = formData.tipoAtendimento || [];
    if (currentTypes.includes(type)) {
      setFormData({ ...formData, tipoAtendimento: currentTypes.filter(t => t !== type) });
    } else {
      setFormData({ ...formData, tipoAtendimento: [...currentTypes, type] });
    }
  };

  useEffect(() => {
    loadFichas();
  }, [userProfile?.unidadeCras, selectedCras]);

  const loadFichas = async () => {
    setLoading(true);
    try {
      const crasToFetch = userProfile?.role === 'ADMIN' 
        ? (selectedCras === 'todos' ? undefined : selectedCras)
        : userProfile?.unidadeCras;
      
      const data = await getFichasAtendimento(crasToFetch);
      setFichas(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const [customAcessoActive, setCustomAcessoActive] = useState(false);

  const handleOpenPanel = (mode: 'view' | 'edit' | 'create', ficha?: FichaAtendimento) => {
    setPanelMode(mode);
    setCustomAcessoActive(false);
    if (ficha) {
      setSelectedFicha(ficha);
      const isStandard = ['Demanda espontânea', 'Encaminhamento da rede', 'Encaminhamento da rede socioassistencial', 'Busca ativa', ''].includes(ficha.formaAcesso || '');
      if (!isStandard) setCustomAcessoActive(true);
      
      setFormData({
        ...ficha,
        tipoAtendimento: Array.isArray(ficha.tipoAtendimento) ? ficha.tipoAtendimento : [ficha.tipoAtendimento],
        tipoAtendimentoOutro: ficha.tipoAtendimentoOutro || '',
        proximaVisitaData: ficha.proximaVisitaData || '',
        proximaVisitaHora: ficha.proximaVisitaHora || '',
        proximaVisitaObservacoes: ficha.proximaVisitaObservacoes || ''
      });
    } else {
      setSelectedFicha(null);
      setFormData({
        unidadeCras: (userProfile?.role === 'ADMIN') ? '' : (userProfile?.unidadeCras || ''),
        dataAtendimento: new Date().toISOString().split('T')[0],
        tipoAtendimento: [],
        tipoAtendimentoOutro: '',
        responsavelFamiliar: '',
        cpf: '',
        coAutorId: '',
        coAutorNome: '',
        demandaInicial: '',
        formaAcesso: '',
        descricao: '',
        encaminhamentos: '',
        descricaoEncaminhamento: '',
        proximaVisitaData: '',
        proximaVisitaHora: '',
        proximaVisitaObservacoes: ''
      });
    }
    setShowPanel(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    const errors: string[] = [];
    if (!formData.unidadeCras) errors.push("Unidade CRAS");
    if (!formData.dataAtendimento) errors.push("Data do Atendimento");
    if (!formData.responsavelFamiliar?.trim()) errors.push("Nome do Cidadão");
    if (!formData.cpf?.trim()) errors.push("CPF do Cidadão");
    if (!formData.demandaInicial?.trim()) errors.push("Demanda Inicial");
    if (!formData.formaAcesso?.trim()) errors.push("Forma de Acesso");
    if (!formData.tipoAtendimento || formData.tipoAtendimento.length === 0) errors.push("Pelo menos um Tipo de Atendimento");
    if (formData.tipoAtendimento?.includes('Outro') && !formData.tipoAtendimentoOutro?.trim()) {
      errors.push("Especificação do Tipo de Atendimento");
    }
    if (!formData.descricao?.trim()) errors.push("Descrição / Evolução");

    if (formData.tipoAtendimento?.includes('Encaminhamento') && !formData.descricaoEncaminhamento?.trim()) {
      errors.push("Descrição do Encaminhamento");
    }

    if (errors.length > 0) {
      alert(`Os seguintes campos são obrigatórios:\n- ${errors.join("\n- ")}`);
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        unidadeCras: userProfile?.role === 'ADMIN' ? formData.unidadeCras : (userProfile?.unidadeCras || formData.unidadeCras),
        tecnicoId: selectedFicha?.tecnicoId || user.uid,
        tecnicoNome: selectedFicha?.tecnicoNome || userProfile?.name || 'Técnico',
      } as FichaAtendimento;

      await saveFichaAtendimento(dataToSave);
      setShowPanel(false);
      loadFichas();
    } catch (error) {
      alert('Erro ao salvar ficha');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja realmente excluir esta ficha de atendimento?')) {
      try {
        await deleteFichaAtendimento(id);
        if (showPanel && selectedFicha?.id === id) setShowPanel(false);
        loadFichas();
      } catch (error) {
        alert('Erro ao excluir');
      }
    }
  };

  const handleAddEvolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFicha || !user) return;
    if (!newEvolDescription.trim()) {
      alert("Por favor, preencha a descrição do andamento/evolução.");
      return;
    }

    setEvolSaving(true);
    try {
      const newEpolVal = {
        id: Math.random().toString(36).substring(2, 11),
        data: newEvolDate,
        tecnicoId: user.uid,
        tecnicoNome: userProfile?.name || 'Técnico',
        descricao: newEvolDescription.trim(),
        encaminhamentos: newEvolEncaminhamentos.trim() || undefined
      };

      const updatedEvolucoes = [...(selectedFicha.evolucoes || []), newEpolVal];
      const updatedFicha: FichaAtendimento = {
        ...selectedFicha,
        evolucoes: updatedEvolucoes
      };

      await saveFichaAtendimento(updatedFicha);
      setSelectedFicha(updatedFicha);
      setNewEvolDescription('');
      setNewEvolEncaminhamentos('');
      setNewEvolDate(new Date().toISOString().split('T')[0]);
      setIsAddingEvol(false);
      
      // Update local state list
      setFichas(fichas.map(f => f.id === selectedFicha.id ? updatedFicha : f));
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar evolução.");
    } finally {
      setEvolSaving(false);
    }
  };

  const handleDeleteEvolution = async (evolId: string) => {
    if (!selectedFicha) return;
    if (!window.confirm("Deseja realmente remover esta evolução?")) return;

    try {
      const updatedEvolucoes = (selectedFicha.evolucoes || []).filter(e => e.id !== evolId);
      const updatedFicha: FichaAtendimento = {
        ...selectedFicha,
        evolucoes: updatedEvolucoes
      };

      await saveFichaAtendimento(updatedFicha);
      setSelectedFicha(updatedFicha);
      setFichas(fichas.map(f => f.id === selectedFicha.id ? updatedFicha : f));
    } catch (err) {
      console.error(err);
      alert("Erro ao remover evolução.");
    }
  };

  const filteredFichas = fichas.filter(f => {
    // Se o usuário logado for técnico, só pode visualizar as fichas criadas por ele
    // ou do qual ele é co-autor (a não ser que seja admin ou coordenador)
    if (userProfile?.role === 'TECNICO') {
      const isCreator = f.tecnicoId === user?.uid;
      const isCoAuthor = f.coAutorId === user?.uid;
      if (!isCreator && !isCoAuthor) return false;
    }

    const matchesSearch = f.responsavelFamiliar.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         f.tecnicoNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (f.coAutorNome && f.coAutorNome.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (f.cpf && f.cpf.includes(searchTerm));
    
    const fichaTypes = Array.isArray(f.tipoAtendimento) ? f.tipoAtendimento : [f.tipoAtendimento];
    const matchesFilter = filterType === 'Todos' || fichaTypes.includes(filterType);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-brand-primary uppercase tracking-tight">Fichas de Atendimento</h1>
          <p className="text-slate-500 font-medium">Registro diário de atendimentos e evoluções</p>
        </div>
        <button
          onClick={() => handleOpenPanel('create')}
          className="bg-brand-primary hover:bg-brand-secondary text-white px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 transition-all active:scale-95 uppercase tracking-wider text-sm"
        >
          <Plus size={20} /> Nova Ficha
        </button>
      </div>

      {/* Filters Area */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar por responsável ou técnico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-slate-50 focus:border-brand-primary outline-none transition-all font-medium text-slate-600"
            />
          </div>
          
          {userProfile?.role === 'ADMIN' && (
            <div className="w-full md:w-64">
              <select
                value={selectedCras}
                onChange={(e) => setSelectedCras(e.target.value)}
                className="w-full p-3 rounded-2xl border-2 border-slate-50 focus:border-brand-primary outline-none transition-all font-bold text-slate-600 bg-slate-50"
              >
                <option value="todos">Todos os CRAS</option>
                <option value="Morada do Sol">Morada do Sol</option>
                <option value="Nagibão">Nagibão</option>
                <option value="Camboatã">Camboatã</option>
                <option value="Jaderlândia">Jaderlândia</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-t border-slate-50 pt-3">
          {['Todos', 'Escuta qualificada', 'Acolhida particularizada', 'Acolhida coletiva', 'Encaminhamento', 'Visita Domiciliar'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                filterType === type 
                ? 'bg-brand-primary text-white shadow-md' 
                : 'bg-slate-50 text-slate-400 hover:bg-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* List Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando fichas...</p>
        </div>
      ) : filteredFichas.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <FileText className="text-slate-200" size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-400">Nenhuma ficha encontrada</h3>
          <p className="text-slate-300">Comece registrando o primeiro atendimento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFichas.map((ficha) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={ficha.id}
              onClick={() => handleOpenPanel('view', ficha)}
              className="group bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all border border-slate-100 relative overflow-hidden cursor-pointer"
            >
              <div className="absolute top-3 right-3 flex gap-1 z-10" onClick={(e) => e.stopPropagation()}>
                {(ficha.tecnicoId === user?.uid || userProfile?.role === 'ADMIN' || userProfile?.role === 'COORDENADOR') && (
                  <button 
                    onClick={() => handleOpenPanel('edit', ficha)}
                    className="p-2 bg-slate-50 text-brand-primary hover:bg-brand-primary hover:text-white rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                )}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    generateFichaAtendimentoPdf(ficha);
                  }}
                  className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm"
                  title="Exportar PDF"
                >
                  <Download size={16} />
                </button>
                {(ficha.tecnicoId === user?.uid || userProfile?.role === 'ADMIN' || userProfile?.role === 'COORDENADOR') && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(ficha.id!);
                    }}
                    className="p-2 bg-slate-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-2xl ${
                  (Array.isArray(ficha.tipoAtendimento) ? ficha.tipoAtendimento : [ficha.tipoAtendimento]).includes('Visita Domiciliar') ? 'bg-amber-100 text-amber-600' :
                  (Array.isArray(ficha.tipoAtendimento) ? ficha.tipoAtendimento : [ficha.tipoAtendimento]).includes('Encaminhamento') ? 'bg-emerald-100 text-emerald-600' :
                  (Array.isArray(ficha.tipoAtendimento) ? ficha.tipoAtendimento : [ficha.tipoAtendimento]).some(t => t.includes('Acolhida')) ? 'bg-indigo-100 text-indigo-600' :
                  'bg-brand-primary/10 text-brand-primary'
                }`}>
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                      {ficha.dataAtendimento.split('-').reverse().join('/')}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {ficha.unidadeCras}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-brand-secondary line-clamp-1 group-hover:text-brand-primary transition-colors">
                    {ficha.responsavelFamiliar}
                  </h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(Array.isArray(ficha.tipoAtendimento) ? ficha.tipoAtendimento : [ficha.tipoAtendimento]).map((t, idx) => (
                      <span key={idx} className="text-[9px] font-bold text-slate-400 uppercase tracking-tight bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                        {t}
                      </span>
                    ))}
                    {ficha.evolucoes && ficha.evolucoes.length > 0 && (
                      <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-tight bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        {ficha.evolucoes.length} {ficha.evolucoes.length === 1 ? 'Evolução' : 'Evoluções'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed font-medium">
                  {ficha.descricao}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex flex-col gap-1 items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">
                      {ficha.tecnicoNome.charAt(0)}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                      {ficha.tecnicoNome}
                    </span>
                  </div>
                  {ficha.coAutorNome && (
                    <span className="text-[8px] bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded border border-sky-100 font-bold max-w-full truncate uppercase tracking-tight">
                      Co-autor: {ficha.coAutorNome}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      generateFichaAtendimentoPdf(ficha);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all active:scale-95"
                  >
                    <Download size={12} />
                    Exportar
                  </button>
                  <ChevronRight size={16} className="text-brand-primary group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Centered Modal */}
      <AnimatePresence>
        {showPanel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPanel(false)}
              className="absolute inset-0 bg-brand-secondary/60 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-[40px] shadow-2xl flex flex-col overflow-hidden border border-white/20"
            >
              <div className="bg-brand-primary p-6 md:p-8 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-2xl">
                    <ClipboardCheck size={28} />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">
                      {panelMode === 'create' ? 'Novo Atendimento' : 
                       panelMode === 'edit' ? 'Editar Atendimento' : 
                       'Detalhes do Atendimento'}
                    </h2>
                    <p className="text-white/70 text-[10px] md:text-xs font-black uppercase tracking-widest mt-0.5">Ficha de Atendimento Socioassistencial</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPanel(false)}
                  className="bg-white/10 hover:bg-white/20 p-2.5 rounded-2xl transition-all active:scale-90"
                >
                  <Plus className="rotate-45" size={28} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
                  {panelMode === 'view' && selectedFicha ? (
                    <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Data</span>
                          <span className="font-bold text-slate-700">{selectedFicha.dataAtendimento.split('-').reverse().join('/')}</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Unidade CRAS</span>
                          <span className="font-bold text-slate-700">{selectedFicha.unidadeCras}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cidadão Atendido</span>
                          <h3 className="text-2xl font-black text-brand-secondary uppercase">{selectedFicha.responsavelFamiliar}</h3>
                          {selectedFicha.cpf && (
                            <p className="text-xs font-bold text-slate-400">CPF: {selectedFicha.cpf}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Demanda Inicial</span>
                          <span className="font-bold text-slate-700">{selectedFicha.demandaInicial || '-'}</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Forma de Acesso</span>
                          <span className="font-bold text-slate-700">{selectedFicha.formaAcesso || '-'}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(selectedFicha.tipoAtendimento) ? selectedFicha.tipoAtendimento : [selectedFicha.tipoAtendimento]).map((t, idx) => (
                          <span key={idx} className="bg-brand-primary/10 text-brand-primary px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-brand-primary/10">
                            {t}
                          </span>
                        ))}
                         <span className="bg-slate-100 text-slate-500 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                           Técnico: {selectedFicha.tecnicoNome}
                         </span>
                         {selectedFicha.coAutorNome && (
                           <span className="bg-sky-50 text-sky-700 border border-sky-100 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                             Co-autor: {selectedFicha.coAutorNome}
                           </span>
                         )}
                      </div>

                      <div className="space-y-6">
                        {selectedFicha.descricaoEncaminhamento && (
                          <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                            <h4 className="text-sm font-black text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                               <AlertCircle size={16} /> Descrição do Encaminhamento
                            </h4>
                            <p className="text-slate-700 font-medium whitespace-pre-wrap">
                              {selectedFicha.descricaoEncaminhamento}
                            </p>
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-black text-brand-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" /> Descrição / Evolução
                          </h4>
                          <div className="bg-slate-50 p-6 rounded-3xl text-slate-700 leading-relaxed font-medium whitespace-pre-wrap italic border border-slate-100">
                            {selectedFicha.descricao}
                          </div>
                        </div>

                        {selectedFicha.encaminhamentos && (
                          <div>
                            <h4 className="text-sm font-black text-brand-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Encaminhamentos
                            </h4>
                            <div className="bg-emerald-50/30 p-6 rounded-3xl text-slate-700 leading-relaxed font-medium whitespace-pre-wrap border border-emerald-100">
                              {selectedFicha.encaminhamentos}
                            </div>
                          </div>
                        )}

                        {/* 📅 AGENDAMENTO DE VISITA DOMICILIAR */}
                        <div className="border-t border-slate-100 pt-6 mt-6 space-y-4">
                          <h4 className="text-sm font-black text-brand-secondary uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={16} className="text-amber-600" /> Agenda de Visita Domiciliar
                          </h4>

                          {selectedFicha.proximaVisitaData ? (
                            <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-150 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-2xl border border-amber-50">
                                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-1">Data da Visita</span>
                                  <span className="font-bold text-slate-700">
                                    {selectedFicha.proximaVisitaData.split('-').reverse().join('/')}
                                  </span>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-amber-50">
                                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-1">Horário</span>
                                  <span className="font-bold text-slate-700">{selectedFicha.proximaVisitaHora || 'Não definido'}</span>
                                </div>
                              </div>

                              {selectedFicha.proximaVisitaObservacoes && (
                                <div className="bg-white p-4 rounded-2xl border border-amber-50">
                                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-1">Observações / Motivo</span>
                                  <p className="text-xs text-slate-600 font-medium whitespace-pre-wrap">{selectedFicha.proximaVisitaObservacoes}</p>
                                </div>
                              )}

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (window.confirm('Deseja confirmar a realização desta visita?')) {
                                      try {
                                        // 1. Add an evolution history entry
                                        const visitDateText = selectedFicha.proximaVisitaData!.split('-').reverse().join('/');
                                        const noteText = selectedFicha.proximaVisitaObservacoes ? `\nMotivo/Obs: ${selectedFicha.proximaVisitaObservacoes}` : '';
                                        const newEvolEntry = {
                                          id: Math.random().toString(36).substring(2, 11),
                                          data: new Date().toISOString().split('T')[0],
                                          tecnicoId: user?.uid || '',
                                          tecnicoNome: userProfile?.name || 'Técnico',
                                          descricao: `Visita domiciliar realizada (agendada para ${visitDateText}).${noteText}`
                                        };

                                        // 2. Add as historical visit
                                        const visitHistoryEntry = {
                                          id: crypto.randomUUID(),
                                          date: selectedFicha.proximaVisitaData,
                                          time: selectedFicha.proximaVisitaHora || '',
                                          tecnico: userProfile?.name || 'Técnico',
                                          status: 'Realizada',
                                          motivo: selectedFicha.proximaVisitaObservacoes || 'Confirmada via ficha de atendimento'
                                        };

                                        const updatedFicha = {
                                          ...selectedFicha,
                                          proximaVisitaData: '',
                                          proximaVisitaHora: '',
                                          proximaVisitaObservacoes: '',
                                          evolucoes: [...(selectedFicha.evolucoes || []), newEvolEntry],
                                          visitasHistory: [...(selectedFicha.visitasHistory || []), visitHistoryEntry]
                                        };

                                        await saveFichaAtendimento(updatedFicha);
                                        setSelectedFicha(updatedFicha);
                                        setFichas(fichas.map(f => f.id === selectedFicha.id ? updatedFicha : f));
                                        alert('Visita confirmada e registrada no histórico de evoluções!');
                                      } catch (error) {
                                        alert('Erro ao confirmar visita.');
                                      }
                                    }
                                  }}
                                  className="flex-1 py-2.5 bg-emerald-650 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 transition-all cursor-pointer"
                                >
                                  <Check size={14} /> Confirmar Realização
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (window.confirm('Deseja desmarcar/excluir este agendamento?')) {
                                      try {
                                        const updatedFicha = {
                                          ...selectedFicha,
                                          proximaVisitaData: '',
                                          proximaVisitaHora: '',
                                          proximaVisitaObservacoes: ''
                                        };
                                        await saveFichaAtendimento(updatedFicha);
                                        setSelectedFicha(updatedFicha);
                                        setFichas(fichas.map(f => f.id === selectedFicha.id ? updatedFicha : f));
                                        alert('Agendamento excluído.');
                                      } catch (error) {
                                        alert('Erro ao desmarcar.');
                                      }
                                    }
                                  }}
                                  className="py-2.5 px-4 bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                >
                                  Desmarcar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-slate-50/50 p-6 rounded-2xl text-center border border-dashed border-slate-100 flex flex-col items-center justify-center">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhuma visita agendada pendente</p>
                              {!isQuickScheduling && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsQuickScheduling(true);
                                  }}
                                  className="mt-3 text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 font-black uppercase tracking-wider py-1.5 px-3 rounded-lg transition border border-amber-100 cursor-pointer"
                                >
                                  + Agendar Visita
                                </button>
                              )}
                            </div>
                          )}

                          {isQuickScheduling && (
                            <motion.form
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              onSubmit={async (e) => {
                                e.preventDefault();
                                if (!quickVisitData.date) {
                                  alert("Agende uma data válida.");
                                  return;
                                }
                                try {
                                  const updatedFicha = {
                                    ...selectedFicha,
                                    proximaVisitaData: quickVisitData.date,
                                    proximaVisitaHora: quickVisitData.time || '',
                                    proximaVisitaObservacoes: quickVisitData.obs || ''
                                  };
                                  await saveFichaAtendimento(updatedFicha);
                                  setSelectedFicha(updatedFicha);
                                  setFichas(fichas.map(f => f.id === selectedFicha.id ? updatedFicha : f));
                                  setIsQuickScheduling(false);
                                  setQuickVisitData({ date: '', time: '', obs: '' });
                                  alert('Visita agendada com sucesso!');
                                } catch (error) {
                                  alert('Erro ao agendar visita.');
                                }
                              }}
                              className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 space-y-4"
                            >
                              <div className="flex justify-between items-center">
                                <h5 className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Novo Agendamento</h5>
                                <button
                                  type="button"
                                  onClick={() => setIsQuickScheduling(false)}
                                  className="text-amber-500 hover:text-amber-750 text-xs font-black uppercase cursor-pointer"
                                >
                                  Fechar
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[9px] font-black text-amber-700 uppercase mb-1">Data da Visita</label>
                                  <input
                                    type="date"
                                    required
                                    value={quickVisitData.date}
                                    onChange={(e) => setQuickVisitData({ ...quickVisitData, date: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-xl border border-amber-100 bg-white font-bold text-slate-600 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-black text-amber-700 uppercase mb-1">Horário</label>
                                  <input
                                    type="time"
                                    value={quickVisitData.time}
                                    onChange={(e) => setQuickVisitData({ ...quickVisitData, time: e.target.value })}
                                    className="w-full text-xs p-2.5 rounded-xl border border-amber-100 bg-white font-bold text-slate-600 focus:outline-none"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-amber-700 uppercase mb-1">Observações do Agendamento</label>
                                <textarea
                                  rows={2}
                                  placeholder="Motivo da visita domiciliar..."
                                  value={quickVisitData.obs}
                                  onChange={(e) => setQuickVisitData({ ...quickVisitData, obs: e.target.value })}
                                  className="w-full text-xs p-3 rounded-xl border border-amber-100 bg-white font-bold text-slate-600 focus:outline-none"
                                />
                              </div>
                              <div className="flex gap-2 justify-end">
                                <button
                                  type="button"
                                  onClick={() => setIsQuickScheduling(false)}
                                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-amber-100 text-amber-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="submit"
                                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                                >
                                  Agendar e Salvar
                                </button>
                              </div>
                            </motion.form>
                          )}
                        </div>

                        {/* 🌟 EVOLUÇÕES CONTINUADAS (HISTÓRICO DE PROGRESSO E ACOMPANHAMENTO) */}
                        <div className="border-t border-slate-100 pt-6 mt-6 space-y-4">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="text-sm font-black text-brand-secondary uppercase tracking-widest flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Histórico de Evoluções e Acompanhamento
                            </h4>
                            {!isAddingEvol && (
                              <button
                                type="button"
                                onClick={() => setIsAddingEvol(true)}
                                className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black uppercase tracking-wider py-1.5 px-3 rounded-lg transition border border-indigo-100"
                              >
                                + Nova Evolução
                              </button>
                            )}
                          </div>

                          {/* Evolution entries timeline */}
                          {(!selectedFicha.evolucoes || selectedFicha.evolucoes.length === 0) ? (
                            <div className="bg-slate-50/50 p-6 rounded-2xl text-center border border-dashed border-slate-100">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhuma evolução registrada para este cidadão</p>
                              <p className="text-[10px] text-slate-400 font-medium mt-1">Utilize o andamento do atendimento para adicionar evoluções contínuas.</p>
                            </div>
                          ) : (
                            <div className="relative pl-4 border-l-2 border-slate-100 space-y-6 py-2">
                              {selectedFicha.evolucoes.map((evol, index) => {
                                const canDeleteEvol = user?.uid === evol.tecnicoId || userProfile?.role === 'ADMIN' || userProfile?.role === 'COORDENADOR';
                                return (
                                  <div key={evol.id} className="relative group/item">
                                    {/* Circle marker */}
                                    <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-white" />
                                    
                                    <div className="bg-slate-50 hover:bg-slate-50/80 p-5 rounded-2xl border border-slate-100 transition-all">
                                      <div className="flex justify-between items-start mb-2">
                                        <div>
                                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block mb-0.5">
                                            Evolução #{index + 1}
                                          </span>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-700">
                                              {evol.data.split('-').reverse().join('/')}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold">•</span>
                                            <span className="text-[10px] bg-slate-200/50 text-slate-500 font-extrabold px-1.5 py-0.5 rounded uppercase">
                                              Téc: {evol.tecnicoNome}
                                            </span>
                                          </div>
                                        </div>

                                        {canDeleteEvol && (
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteEvolution(evol.id)}
                                            className="text-slate-300 hover:text-red-500 p-1 rounded-lg hover:bg-red-50/50 transition opacity-0 group-hover/item:opacity-100"
                                            title="Excluir evolução"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        )}
                                      </div>

                                      <p className="text-xs text-slate-600 font-semibold leading-relaxed whitespace-pre-wrap">
                                        {evol.descricao}
                                      </p>

                                      {evol.encaminhamentos && (
                                        <div className="mt-3 pt-3 border-t border-slate-200/50">
                                          <span className="text-[9px] font-black text-slate-400 block uppercase tracking-widest mb-1">Encaminhamentos / Orientações:</span>
                                          <p className="text-[11px] font-medium text-slate-500 italic bg-white p-2.5 rounded-lg border border-slate-100">
                                            {evol.encaminhamentos}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Quick Add Evolution Form */}
                          <AnimatePresence>
                            {isAddingEvol && (
                              <motion.form
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                onSubmit={handleAddEvolution}
                                className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl space-y-4 overflow-hidden mt-4 text-left"
                              >
                                <div className="flex justify-between items-center border-b border-indigo-100/50 pb-2">
                                  <span className="text-xs font-black text-indigo-700 uppercase tracking-widest block">Novo Registro de Evolução</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNewEvolDescription('');
                                      setNewEvolEncaminhamentos('');
                                      setIsAddingEvol(false);
                                    }}
                                    className="text-indigo-400 hover:text-indigo-600 text-xs font-black uppercase"
                                  >
                                    Fechar
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-[9px] font-black text-indigo-700 uppercase mb-1">Responsável</label>
                                    <input
                                      type="text"
                                      disabled
                                      value={userProfile?.name || 'Técnico'}
                                      className="w-full text-xs p-2.5 rounded-xl border border-indigo-100 bg-white/70 font-bold text-slate-400"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-black text-indigo-700 uppercase mb-1">Data da Evolução</label>
                                    <input
                                      type="date"
                                      required
                                      value={newEvolDate}
                                      onChange={(e) => setNewEvolDate(e.target.value)}
                                      className="w-full text-xs p-2.5 rounded-xl border border-indigo-100 bg-white font-bold text-slate-600 focus:outline-indigo-300"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[9px] font-black text-indigo-700 uppercase mb-1">Descrição do Andamento / Evolução <span className="text-red-500">*</span></label>
                                  <textarea
                                    required
                                    rows={4}
                                    placeholder="Descreva o andamento do atendimento continuado, nova escuta ou desdobramentos..."
                                    value={newEvolDescription}
                                    onChange={(e) => setNewEvolDescription(e.target.value)}
                                    className="w-full text-xs p-3 rounded-xl border border-indigo-100 bg-white font-bold text-slate-600 placeholder-indigo-300 outline-none focus:ring-1 focus:ring-indigo-400"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[9px] font-black text-indigo-700 uppercase mb-1">Novos Encaminhamentos / Orientações (Opcional)</label>
                                  <textarea
                                    rows={2}
                                    placeholder="Descreva se realizou algum novo encaminhamento ou orientação nesta evolução..."
                                    value={newEvolEncaminhamentos}
                                    onChange={(e) => setNewEvolEncaminhamentos(e.target.value)}
                                    className="w-full text-xs p-3 rounded-xl border border-indigo-100 bg-white font-bold text-slate-600 placeholder-indigo-300 outline-none focus:ring-1 focus:ring-indigo-400"
                                  />
                                </div>

                                <div className="flex gap-2 justify-end pt-2">
                                  <button
                                    type="button"
                                    onClick={() => setIsAddingEvol(false)}
                                    className="px-4 py-2 bg-white hover:bg-slate-100 border border-indigo-100 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={evolSaving}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md shadow-indigo-600/10 transition-all flex items-center gap-1.5"
                                  >
                                    {evolSaving ? 'Salvando...' : 'Adicionar e Salvar'}
                                  </button>
                                </div>
                              </motion.form>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <div className="pt-8 flex gap-3">
                         <button
                           onClick={() => generateFichaAtendimentoPdf(selectedFicha)}
                           className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition shadow-lg shadow-emerald-600/20"
                         >
                           <Download size={18} /> Exportar PDF
                         </button>
                         {(selectedFicha.tecnicoId === user?.uid || userProfile?.role === 'ADMIN' || userProfile?.role === 'COORDENADOR') && (
                           <button
                             onClick={() => setPanelMode('edit')}
                             className="flex-1 bg-brand-secondary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition shadow-lg shadow-brand-secondary/20"
                           >
                             <Edit2 size={18} /> Editar Registro
                           </button>
                         )}
                         {(selectedFicha.tecnicoId === user?.uid || userProfile?.role === 'ADMIN' || userProfile?.role === 'COORDENADOR') && (
                           <button
                             onClick={() => handleDelete(selectedFicha.id!)}
                             className="px-6 bg-rose-50 text-rose-500 rounded-2xl active:scale-95 transition border border-rose-100 hover:bg-rose-500 hover:text-white"
                           >
                             <Trash2 size={18} />
                           </button>
                         )}
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Unidade CRAS</label>
                          <select
                            required
                            disabled={userProfile?.role !== 'ADMIN'}
                            value={formData.unidadeCras}
                            onChange={(e) => setFormData({...formData, unidadeCras: e.target.value as any})}
                            className={`w-full p-4 rounded-2xl border-2 border-slate-50 focus:border-brand-primary outline-none transition-all font-bold text-slate-600 bg-slate-50 ${userProfile?.role !== 'ADMIN' ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            <option value="">Selecione...</option>
                            <option value="Morada do Sol">Morada do Sol</option>
                            <option value="Nagibão">Nagibão</option>
                            <option value="Camboatã">Camboatã</option>
                            <option value="Jaderlândia">Jaderlândia</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Data do Atendimento</label>
                          <input
                            required
                            type="date"
                            value={formData.dataAtendimento}
                            onChange={(e) => setFormData({...formData, dataAtendimento: e.target.value})}
                            className="w-full p-4 rounded-2xl border-2 border-slate-50 focus:border-brand-primary outline-none transition-all font-bold text-slate-600 bg-slate-50"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Cidadão Atendido (Nome Completo)</label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                            <input
                              required
                              type="text"
                              placeholder="Nome do cidadão..."
                              value={formData.responsavelFamiliar}
                              onChange={(e) => setFormData({...formData, responsavelFamiliar: e.target.value})}
                              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-50 focus:border-brand-primary outline-none transition-all font-bold text-slate-600 bg-slate-50"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Telefone p/ Contato</label>
                          <input
                            type="text"
                            placeholder="(00) 00000-0000"
                            value={formData.telefone || ''}
                            onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                            className="w-full p-4 rounded-2xl border-2 border-slate-50 focus:border-brand-primary outline-none transition-all font-bold text-slate-600 bg-slate-50"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">CPF do Cidadão</label>
                          <input
                            type="text"
                            placeholder="000.000.000-00"
                            value={formData.cpf}
                            onChange={(e) => setFormData({...formData, cpf: maskCPF(e.target.value)})}
                            className="w-full p-4 rounded-2xl border-2 border-slate-50 focus:border-brand-primary outline-none transition-all font-bold text-slate-600 bg-slate-50"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Co-autor (Opcional - p/ visualizar preenchimento)</label>
                          <select
                            value={formData.coAutorId || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const selectedTech = tecnicos.find(t => t.id === val);
                              setFormData({
                                ...formData,
                                coAutorId: val || undefined,
                                coAutorNome: selectedTech ? selectedTech.name : undefined
                              });
                            }}
                            className="w-full p-4 rounded-2xl border-2 border-slate-50 focus:border-brand-primary outline-none transition-all font-bold text-slate-600 bg-slate-50"
                          >
                            <option value="">Nenhum</option>
                            {tecnicos.map((tech) => (
                              <option key={tech.id} value={tech.id}>{tech.name} ({tech.role})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Demanda Inicial</label>
                          <input
                            type="text"
                            placeholder="Ex: Bolsa Família, Cesta Básica..."
                            value={formData.demandaInicial}
                            onChange={(e) => setFormData({...formData, demandaInicial: e.target.value})}
                            className="w-full p-4 rounded-2xl border-2 border-slate-50 focus:border-brand-primary outline-none transition-all font-bold text-slate-600 bg-slate-50"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Forma de Acesso</label>
                          <select
                            value={customAcessoActive ? 'Outros' : formData.formaAcesso}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'Outros') {
                                setCustomAcessoActive(true);
                                setFormData({...formData, formaAcesso: ''});
                              } else {
                                setCustomAcessoActive(false);
                                setFormData({...formData, formaAcesso: val});
                              }
                            }}
                            className="w-full p-4 rounded-2xl border-2 border-slate-50 focus:border-brand-primary outline-none transition-all font-bold text-slate-600 bg-slate-50"
                          >
                            <option value="">Selecione...</option>
                            <option value="Demanda espontânea">Demanda espontânea</option>
                            <option value="Encaminhamento da rede socioassistencial">Encaminhamento da rede socioassistencial</option>
                            <option value="Busca ativa">Busca ativa</option>
                            <option value="Outros">Outros</option>
                          </select>

                          {customAcessoActive && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-2"
                            >
                              <input
                                type="text"
                                placeholder="Especifique a forma de acesso..."
                                value={formData.formaAcesso}
                                onChange={(e) => setFormData({...formData, formaAcesso: e.target.value})}
                                className="w-full p-4 rounded-2xl border-2 border-slate-50 focus:border-brand-primary outline-none transition-all font-bold text-slate-600 bg-slate-50"
                                autoFocus
                              />
                            </motion.div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Tipo de Atendimento (Selecione um ou mais)</label>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                          {[
                            'Escuta qualificada', 
                            'Acolhida particularizada', 
                            'Acolhida coletiva', 
                            'Encaminhamento', 
                            'Visita Domiciliar',
                            'Outro'
                          ].map((type) => {
                            const isSelected = formData.tipoAtendimento?.includes(type);
                            return (
                              <button
                                key={type}
                                type="button"
                                onClick={() => handleToggleType(type)}
                                className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 text-center flex items-center justify-center min-h-[50px] ${
                                  isSelected 
                                  ? 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                                  : 'bg-white border-slate-100 text-slate-400 hover:border-brand-primary/30'
                                }`}
                              >
                                {type}
                              </button>
                            );
                          })}
                        </div>

                        {formData.tipoAtendimento?.includes('Outro') && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-3"
                          >
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Especifique o Tipo de Atendimento</label>
                            <input
                              type="text"
                              required
                              placeholder="Qual outro tipo de atendimento?"
                              value={formData.tipoAtendimentoOutro}
                              onChange={(e) => setFormData({...formData, tipoAtendimentoOutro: e.target.value})}
                              className="w-full p-4 rounded-2xl border-2 border-slate-50 focus:border-brand-primary outline-none transition-all font-bold text-slate-600 bg-slate-50"
                            />
                          </motion.div>
                        )}
                      </div>

                      {formData.tipoAtendimento?.includes('Encaminhamento') && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-100"
                        >
                          <label className="block text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-2">Descrição do Encaminhamento (Obrigatório)</label>
                          <textarea
                            required
                            rows={3}
                            placeholder="Descreva para onde e por que foi encaminhado..."
                            value={formData.descricaoEncaminhamento}
                            onChange={(e) => setFormData({...formData, descricaoEncaminhamento: e.target.value})}
                            className="w-full p-4 rounded-xl border-2 border-white focus:border-amber-400 outline-none transition-all font-bold text-slate-600 bg-white resize-none"
                          />
                        </motion.div>
                      )}

                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Descrição / Evolução do Atendimento</label>
                        <textarea
                          required
                          rows={6}
                          placeholder="Descreva o que foi tratado..."
                          value={formData.descricao}
                          onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                          className="w-full p-4 rounded-2xl border-2 border-slate-50 focus:border-brand-primary outline-none transition-all font-bold text-slate-600 bg-slate-50 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Encaminhamentos Efetuados</label>
                        <textarea
                          rows={3}
                          placeholder="Quais orientações foram dadas?"
                          value={formData.encaminhamentos}
                          onChange={(e) => setFormData({...formData, encaminhamentos: e.target.value})}
                          className="w-full p-4 rounded-2xl border-2 border-slate-50 focus:border-brand-primary outline-none transition-all font-bold text-slate-600 bg-slate-50 resize-none"
                        />
                      </div>

                      <div className="bg-amber-50/40 p-6 rounded-3xl border-2 border-dashed border-amber-200 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="text-amber-600" size={18} />
                          <h4 className="text-xs font-black text-amber-850 uppercase tracking-wider">Agendar Visita Domiciliar (Opcional)</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Data da Próxima Visita</label>
                            <input
                              type="date"
                              value={formData.proximaVisitaData || ''}
                              onChange={(e) => setFormData({...formData, proximaVisitaData: e.target.value})}
                              className="w-full text-xs p-3 rounded-xl border border-amber-100 bg-white font-bold text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Horário Agendado</label>
                            <input
                              type="time"
                              value={formData.proximaVisitaHora || ''}
                              onChange={(e) => setFormData({...formData, proximaVisitaHora: e.target.value})}
                              className="w-full text-xs p-3 rounded-xl border border-amber-100 bg-white font-bold text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Observações do Agendamento</label>
                          <textarea
                            rows={2}
                            placeholder="Descreva o motivo ou foco principal da visita domiciliar..."
                            value={formData.proximaVisitaObservacoes || ''}
                            onChange={(e) => setFormData({...formData, proximaVisitaObservacoes: e.target.value})}
                            className="w-full text-xs p-3 rounded-xl border border-amber-100 bg-white font-bold text-slate-600 outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      <div className="flex gap-4 pt-4 sticky bottom-0 bg-white pb-2">
                        <button
                          type="button"
                          onClick={() => setShowPanel(false)}
                          className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 border-2 border-slate-50 hover:bg-slate-50 transition-all font-sans"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="flex-[2] py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-brand-primary hover:bg-brand-secondary shadow-lg shadow-brand-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 font-sans"
                        >
                          <ClipboardCheck size={20} />
                          Salvar Registro
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
    </div>
  );
}
