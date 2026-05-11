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
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../AuthProvider';
import { getFichasAtendimento, saveFichaAtendimento, deleteFichaAtendimento } from '../services/fichaAtendimentoService';
import type { FichaAtendimento } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function FichasAtendimento() {
  const { user, userProfile } = useAuth();
  const [fichas, setFichas] = useState<FichaAtendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [panelMode, setPanelMode] = useState<'view' | 'edit' | 'create'>('create');
  const [selectedFicha, setSelectedFicha] = useState<FichaAtendimento | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Todos');

  // Form states
  const [formData, setFormData] = useState<Partial<FichaAtendimento>>({
    unidadeCras: (userProfile?.unidadeCras === 'Administração') ? '' : (userProfile?.unidadeCras || ''),
    dataAtendimento: new Date().toISOString().split('T')[0],
    tipoAtendimento: [],
    responsavelFamiliar: '',
    cpf: '',
    descricao: '',
    encaminhamentos: '',
    descricaoEncaminhamento: ''
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
  }, [userProfile?.unidadeCras]);

  const loadFichas = async () => {
    setLoading(true);
    try {
      const data = await getFichasAtendimento(userProfile?.unidadeCras);
      setFichas(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPanel = (mode: 'view' | 'edit' | 'create', ficha?: FichaAtendimento) => {
    setPanelMode(mode);
    if (ficha) {
      setSelectedFicha(ficha);
      setFormData({
        ...ficha,
        tipoAtendimento: Array.isArray(ficha.tipoAtendimento) ? ficha.tipoAtendimento : [ficha.tipoAtendimento]
      });
    } else {
      setSelectedFicha(null);
      setFormData({
        unidadeCras: (userProfile?.unidadeCras === 'Administração') ? '' : (userProfile?.unidadeCras || ''),
        dataAtendimento: new Date().toISOString().split('T')[0],
        tipoAtendimento: [],
        responsavelFamiliar: '',
        cpf: '',
        descricao: '',
        encaminhamentos: '',
        descricaoEncaminhamento: ''
      });
    }
    setShowPanel(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const dataToSave = {
        ...formData,
        tecnicoId: user.uid,
        tecnicoNome: userProfile?.name || 'Técnico',
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

  const filteredFichas = fichas.filter(f => {
    const matchesSearch = f.responsavelFamiliar.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         f.tecnicoNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
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
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
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
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => handleOpenPanel('edit', ficha)}
                  className="p-2 bg-slate-50 text-brand-primary hover:bg-brand-primary hover:text-white rounded-xl transition-all"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(ficha.id!)}
                  className="p-2 bg-slate-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                >
                  <Trash2 size={16} />
                </button>
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
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed font-medium">
                  {ficha.descricao}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">
                    {ficha.tecnicoNome.charAt(0)}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                    {ficha.tecnicoNome}
                  </span>
                </div>
                <button className="text-brand-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                  <ChevronRight size={16} />
                </button>
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

                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(selectedFicha.tipoAtendimento) ? selectedFicha.tipoAtendimento : [selectedFicha.tipoAtendimento]).map((t, idx) => (
                          <span key={idx} className="bg-brand-primary/10 text-brand-primary px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-brand-primary/10">
                            {t}
                          </span>
                        ))}
                         <span className="bg-slate-100 text-slate-500 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                           Técnico: {selectedFicha.tecnicoNome}
                         </span>
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
                      </div>

                      <div className="pt-8 flex gap-3">
                         <button
                           onClick={() => setPanelMode('edit')}
                           className="flex-1 bg-brand-secondary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition shadow-lg shadow-brand-secondary/20"
                         >
                           <Edit2 size={18} /> Editar Registro
                         </button>
                         <button
                           onClick={() => handleDelete(selectedFicha.id!)}
                           className="px-6 bg-rose-50 text-rose-500 rounded-2xl active:scale-95 transition border border-rose-100 hover:bg-rose-500 hover:text-white"
                         >
                           <Trash2 size={18} />
                         </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Unidade CRAS</label>
                          <select
                            required
                            value={formData.unidadeCras}
                            onChange={(e) => setFormData({...formData, unidadeCras: e.target.value as any})}
                            className="w-full p-4 rounded-2xl border-2 border-slate-50 focus:border-brand-primary outline-none transition-all font-bold text-slate-600 bg-slate-50"
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
