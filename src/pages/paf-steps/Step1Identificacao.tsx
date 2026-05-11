import React, { useState, useEffect } from 'react';
import type { PAFData, FamilyMember, UserProfile } from '../../types';
import { Plus, Trash2, UserCheck, ClipboardList, RefreshCw, AlertCircle, Eye, FilePlus } from 'lucide-react';
import { useAuth } from '../../AuthProvider';
import { getUsersByCras } from '../../services/authService';
import { getNextPlanNumber, searchPAFByCPF } from '../../services/pafService';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  data: PAFData;
  handleChange: (field: keyof PAFData, value: any) => void;
  setPAFData: (newData: PAFData) => void;
  handleMembroChange: (index: number, field: keyof FamilyMember, value: string) => void;
  addMembro: () => void;
  removeMembro: (index: number) => void;
}

export default function Step1Identificacao({ data, handleChange, setPAFData, handleMembroChange, addMembro, removeMembro }: Props) {
  const [cpfError, setCpfError] = useState('');
  const [tecnicos, setTecnicos] = useState<UserProfile[]>([]);
  const [loadingTecnicos, setLoadingTecnicos] = useState(false);
  const [tecnicosLoaded, setTecnicosLoaded] = useState(false);
  const [checkingCpf, setCheckingCpf] = useState(false);
  const [existingPaf, setExistingPaf] = useState<PAFData | null>(null);
  const [showExistingModal, setShowExistingModal] = useState(false);
  const [checkedCpfs, setCheckedCpfs] = useState<Set<string>>(new Set());

  const { userProfile, user } = useAuth();
  const isAdmin = userProfile?.role === 'ADMIN';

  const isAdminOrCoordinator = userProfile?.role === 'ADMIN' || userProfile?.role === 'COORDENADOR';

  // Use a ref to track if we've already auto-set the primary technician to avoid loops
  const hasAutoSetPrimary = React.useRef(false);

  const loadTecnicos = async () => {
    if (tecnicosLoaded || loadingTecnicos) return;

    const crasToUse = !isAdmin && userProfile?.unidadeCras 
      ? userProfile.unidadeCras 
      : data.unidadeCras;

    if (crasToUse) {
      setLoadingTecnicos(true);
      try {
        const list = await getUsersByCras(crasToUse);
        setTecnicos(list);
        setTecnicosLoaded(true);
      } catch (err) {
        console.error('Error loading technicians:', err);
      } finally {
        setLoadingTecnicos(false);
      }
    } else {
      setTecnicos([]);
      setTecnicosLoaded(true);
    }
  };

  useEffect(() => {
    const fetchOnChange = async () => {
      // If we already loaded tecnicos and CRAS changes, clear/reload if it was already "used"
      // or just reset state to force reload on next click
      
      const crasToUse = !isAdmin && userProfile?.unidadeCras 
        ? userProfile.unidadeCras 
        : data.unidadeCras;

      if (!crasToUse) {
        setTecnicos([]);
        setTecnicosLoaded(false);
      } else if (tecnicosLoaded) {
        // If already loaded for a different CRAS, we should refresh it
        // but let's just reset so it reloads on demand
        setTecnicosLoaded(false);
      }
    };
    fetchOnChange();
  }, [isAdmin, userProfile?.unidadeCras, data.unidadeCras]);

  useEffect(() => {
    // If technicians are loaded and co-author is set, verify they still exist in current CRAS
    if (tecnicosLoaded && data.tecnicoId2 && !tecnicos.some(t => t.id === data.tecnicoId2)) {
      handleChange('tecnicoId2', '');
      handleChange('tecnicoNome2', '');
    }
  }, [tecnicosLoaded, tecnicos, data.tecnicoId2, handleChange]);

  useEffect(() => {
    // Auto-set current user as primary if not set and not privileged
    if (!data.tecnicoId1 && !isAdminOrCoordinator && user && !hasAutoSetPrimary.current) {
      handleChange('tecnicoId1', user.uid);
      handleChange('tecnicoNome1', userProfile?.name || '');
      hasAutoSetPrimary.current = true;
    }
  }, [data.tecnicoId1, isAdminOrCoordinator, user, userProfile?.name, handleChange]);

  const generateSequentialNumber = async (cras: string) => {
    if (!cras) return;
    const nextNum = await getNextPlanNumber(cras);
    if (nextNum) {
      handleChange('numeroPlano', nextNum);
    }
  };

  useEffect(() => {
    // Trigger sequential number generation when CRAS changes for NEW plans only
    // or if the plan number is currently empty
    if (data.unidadeCras && !data.id && !data.numeroPlano) {
      generateSequentialNumber(data.unidadeCras);
    }
  }, [data.unidadeCras, data.id]);

  const handleTecnico1Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tecnicoId = e.target.value;
    const tecnico = tecnicos.find(t => t.id === tecnicoId);
    if (tecnico) {
      handleChange('tecnicoId1', tecnico.id);
      handleChange('tecnicoNome1', tecnico.name);
      
      // If same as co-author, clear co-author
      if (tecnico.id === data.tecnicoId2) {
        handleChange('tecnicoId2', '');
        handleChange('tecnicoNome2', '');
      }
    }
  };

  const handleTecnico2Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tecnicoId = e.target.value;
    const tecnico = tecnicos.find(t => t.id === tecnicoId);
    if (tecnico) {
      handleChange('tecnicoId2', tecnico.id);
      handleChange('tecnicoNome2', tecnico.name);
    } else {
      handleChange('tecnicoId2', '');
      handleChange('tecnicoNome2', '');
    }
  };

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '');
    
    let formatted = '';
    if (digits.length > 0) {
      formatted = digits.substring(0, 3);
      if (digits.length > 3) {
        formatted += '.' + digits.substring(3, 6);
      }
      if (digits.length > 6) {
        formatted += '.' + digits.substring(6, 9);
      }
      if (digits.length > 9) {
        formatted += '-' + digits.substring(9, 11);
      }
    }
    return formatted;
  };

  const handleCpfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedCpf = formatCpf(rawValue);
    handleChange('cpf', formattedCpf);
    if (cpfError) setCpfError('');

    // Trigger check immediately if it reaches 14 characters
    if (formattedCpf.length === 14 && !data.id && !checkedCpfs.has(formattedCpf)) {
      setCheckingCpf(true);
      try {
        const found = await searchPAFByCPF(formattedCpf, userProfile as UserProfile);
        if (found) {
          setExistingPaf(found);
          setShowExistingModal(true);
        }
      } catch (err) {
        console.error('Error checking CPF:', err);
      } finally {
        setCheckingCpf(false);
        setCheckedCpfs(prev => new Set(prev).add(formattedCpf));
      }
    }
  };

  const handleCpfBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value && value.length === 14) {
      // Valid format, check for existing
      setCpfError('');
      
      // Don't check if we are already EDITING this exact plan
      // Or if we already checked this CPF in this session
      if (data.id || checkedCpfs.has(value)) return;

      setCheckingCpf(true);
      try {
        const found = await searchPAFByCPF(value, userProfile as UserProfile);
        if (found) {
          setExistingPaf(found);
          setShowExistingModal(true);
        }
      } catch (err) {
        console.error('Error checking CPF:', err);
      } finally {
        setCheckingCpf(false);
        setCheckedCpfs(prev => new Set(prev).add(value));
      }
    } else if (value && value.length > 0) {
      setCpfError('CPF inválido. Use o formato 000.000.000-00');
    } else {
      setCpfError('');
    }
  };

  const handleUseExisting = () => {
    if (existingPaf) {
      setPAFData(existingPaf);
      setShowExistingModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Existing PAF Modal */}
      <AnimatePresence>
        {showExistingModal && existingPaf && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowExistingModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="bg-brand-primary p-6 text-white text-center">
                <AlertCircle size={48} className="mx-auto mb-4 text-brand-light animate-pulse" />
                <h3 className="text-xl font-black uppercase tracking-tight">Plano Existente Encontrado</h3>
                <p className="text-white/70 text-sm font-bold mt-1">Já existe um acompanhamento registrado para este CPF.</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-brand-primary font-black">
                    {existingPaf.numeroPlano?.substring(0, 3) || '000'}
                  </div>
                  <div>
                    <h4 className="font-black text-brand-secondary uppercase">{existingPaf.responsavel}</h4>
                    <p className="text-xs font-bold text-slate-400">Plano Nº: {existingPaf.numeroPlano} • CRAS {existingPaf.unidadeCras}</p>
                    <p className="text-[10px] uppercase font-black text-slate-500 mt-1">Técnico: {existingPaf.tecnicoNome1}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleUseExisting}
                    className="w-full bg-brand-primary hover:bg-brand-secondary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-brand-primary/20"
                  >
                    <Eye size={18} /> Acompanhar Plano Existente
                  </button>
                  <button
                    onClick={() => setShowExistingModal(false)}
                    className="w-full bg-white border-2 border-slate-100 hover:border-slate-200 text-slate-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                  >
                    <FilePlus size={18} /> Criar Novo Plano
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Plan Number Identification */}
      <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-6 shadow-sm">

        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="bg-brand-primary text-white p-3 rounded-xl shadow-md">
            <ClipboardList size={24} />
          </div>
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-black text-brand-secondary uppercase tracking-[0.2em]">Nº Identificador do Plano (Controle Interno)</label>
              <button 
                type="button" 
                onClick={() => generateSequentialNumber(data.unidadeCras)}
                disabled={!data.unidadeCras}
                className="text-[10px] bg-brand-primary text-white px-2 py-0.5 rounded font-black hover:bg-brand-secondary transition-colors uppercase tracking-widest disabled:opacity-50"
              >
                Gerar Sugestão Sequencial
              </button>
            </div>
            <div className="relative">
               <input 
                type="text" 
                value={data.numeroPlano} 
                onChange={e => handleChange('numeroPlano', e.target.value.toUpperCase())} 
                placeholder="Ex: 050/2026"
                className="w-full p-4 rounded-xl border-2 border-brand-primary shadow-inner outline-none focus:ring-4 focus:ring-brand-primary/10 bg-slate-50 font-black text-3xl text-brand-primary tracking-widest text-center placeholder:text-slate-200 transition-all" 
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400/30 uppercase tracking-[0.2em] pointer-events-none hidden lg:block">ID PLANO</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label id="cras-label" className="block text-sm font-semibold text-slate-700 mb-1">Unidade CRAS <span className="text-red-500">*</span></label>
          {(!isAdmin && userProfile?.unidadeCras) ? (
            <div className="w-full p-3 rounded-lg border border-slate-200 bg-slate-100 font-bold text-brand-primary flex items-center">
              CRAS {userProfile.unidadeCras}
            </div>
          ) : (
            <select 
              id="cras-select"
              value={data.unidadeCras} 
              onChange={e => handleChange('unidadeCras', e.target.value)} 
              className="w-full p-3 rounded-lg border border-slate-200 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary bg-slate-50/50" 
              required 
              disabled={!isAdmin}
            >
              <option value="">Selecione o CRAS</option>
              <option value="Morada do Sol">CRAS Morada do Sol</option>
              <option value="Nagibão">CRAS Nagibão</option>
              <option value="Camboatã">CRAS Camboatã</option>
              <option value="Jaderlândia">CRAS Jaderlândia</option>
            </select>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Técnico Coautor (Opcional)</label>
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserCheck size={18} className="text-slate-400" />
              </div>
              <select 
                value={data.tecnicoId2 || ''} 
                onChange={handleTecnico2Change} 
                onFocus={loadTecnicos}
                className="w-full pl-10 p-3 rounded-lg border border-slate-200 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary bg-slate-50/50"
              >
                <option value="">{loadingTecnicos ? 'Carregando técnicos...' : 'Selecione um segundo técnico'}</option>
                {tecnicos
                  .filter(t => t.id !== (data.tecnicoId1 || user?.uid))
                  .map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))
                }
              </select>
            </div>
            
            {data.tecnicoId2 && (
              <div className="flex items-center p-2.5 bg-blue-50 border border-blue-100 rounded-lg animate-in fade-in slide-in-from-top-1">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold mr-3 shadow-sm">
                  {data.tecnicoNome2?.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-blue-800 leading-tight">{data.tecnicoNome2}</p>
                  <p className="text-[10px] text-blue-600">Coautor vinculado ao plano</p>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    handleChange('tecnicoId2', '');
                    handleChange('tecnicoNome2', '');
                  }}
                  className="text-blue-400 hover:text-blue-600 p-1"
                >
                  <Plus size={14} className="rotate-45" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Técnico Responsável</label>
          {isAdminOrCoordinator ? (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserCheck size={18} className="text-brand-primary" />
              </div>
              <select 
                value={data.tecnicoId1 || ''} 
                onChange={handleTecnico1Change} 
                onFocus={loadTecnicos}
                className="w-full pl-10 p-3 rounded-lg border border-slate-200 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary bg-slate-50/50 font-bold text-brand-secondary"
                required
              >
                <option value="">{loadingTecnicos ? 'Carregando técnicos...' : 'Selecione o técnico principal'}</option>
                {tecnicos.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="w-full p-3 rounded-lg border border-brand-primary/20 bg-brand-light/20 text-brand-secondary font-bold flex items-center">
               <UserCheck size={18} className="mr-2" />
               {data.tecnicoNome1 || userProfile?.name}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Data Inicial do PAF</label>
          <input type="date" value={data.dataInicial} onChange={e => handleChange('dataInicial', e.target.value)} className="w-full p-3 rounded-lg border border-slate-200 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary bg-slate-50/50" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 mb-1">Responsável Familiar <span className="text-red-500">*</span></label>
          <input type="text" value={data.responsavel} onChange={e => handleChange('responsavel', e.target.value)} className="w-full p-3 rounded-lg border border-slate-200 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary bg-slate-50/50" required />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">CPF <span className="text-red-500">*</span></label>
          <div className="relative">
            <input 
              type="text" 
              value={data.cpf} 
              onChange={handleCpfChange} 
              onBlur={handleCpfBlur}
              className={`w-full p-3 rounded-lg border outline-none focus:ring-1 bg-slate-50/50 pr-10 ${
                cpfError 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                  : 'border-slate-200 focus:border-brand-primary focus:ring-brand-primary'
              }`} 
              placeholder="000.000.000-00" 
              maxLength={14}
              required 
            />
            {checkingCpf && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <RefreshCw size={16} className="text-brand-primary animate-spin" />
              </div>
            )}
          </div>
          {cpfError && <p className="text-red-500 text-xs mt-1">{cpfError}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Telefone Principal <span className="text-red-500">*</span></label>
          <input type="text" value={data.telefone || ''} onChange={e => handleChange('telefone', e.target.value)} className="w-full p-3 rounded-lg border border-slate-200 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary bg-slate-50/50" placeholder="(00) 00000-0000" required />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Telefone Secundário / Recado</label>
          <input type="text" value={data.telefone2 || ''} onChange={e => handleChange('telefone2', e.target.value)} className="w-full p-3 rounded-lg border border-slate-200 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary bg-slate-50/50" placeholder="(00) 00000-0000" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">E-mail de Contato</label>
          <input type="email" value={data.emailContato || ''} onChange={e => handleChange('emailContato', e.target.value)} className="w-full p-3 rounded-lg border border-slate-200 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary bg-slate-50/50" placeholder="exemplo@email.com" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Endereço Completo</label>
          <input type="text" value={data.endereco} onChange={e => handleChange('endereco', e.target.value)} className="w-full p-3 rounded-lg border border-slate-200 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary bg-slate-50/50" placeholder="Rua, Número, Bairro..." />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-lg border border-slate-200">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Situação do PAF</label>
          <div className="flex flex-col space-y-2">
            {['Em andamento', 'Concluído'].map(sit => (
              <label key={sit} className="flex items-center space-x-3 cursor-pointer">
                <input type="radio" name="situacaoPaf" checked={data.situacao === sit} onChange={() => handleChange('situacao', sit)} className="w-4 h-4 text-brand-primary focus:ring-brand-primary" />
                <span className="text-slate-700 text-sm">{sit}</span>
              </label>
            ))}
          </div>
          {data.situacao && data.situacao !== 'Em andamento' && (
            <div className="mt-3">
               <label className="block text-xs font-semibold text-slate-500 mb-1">Data da situação</label>
               <input type="date" value={data.dataSituacao} onChange={e => handleChange('dataSituacao', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 bg-white" />
            </div>
          )}
        </div>
        <div>
           <label className="block text-sm font-semibold text-slate-700 mb-2">Periodicidade de Acompanhamento</label>
           <div className="flex flex-col space-y-2">
            {['Semanal', 'Quinzenal', 'Mensal'].map(per => (
              <label key={per} className="flex items-center space-x-3 cursor-pointer">
                <input type="radio" name="periodicidade" checked={data.periodicidade === per} onChange={() => handleChange('periodicidade', per)} className="w-4 h-4 text-brand-primary focus:ring-brand-primary" />
                <span className="text-slate-700 text-sm">{per}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-2">Demanda Inicial (Motivo do Acompanhamento)</label>
          <textarea 
            value={data.demandaInicial || ''} 
            onChange={e => handleChange('demandaInicial', e.target.value)}
            placeholder="Descreva o motivo que levou a família a buscar o serviço ou ser identificada..."
            className="w-full p-3 rounded-lg border border-slate-200 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary bg-slate-50/30 min-h-[100px]"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-800 mb-3">Forma de Acesso</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              'Demanda espontânea',
              'Busca ativa',
              'Encaminhamento pela rede socioassistencial',
              'Encaminhamento por outras políticas públicas',
              'Outros'
            ].map(forma => (
              <label key={forma} className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer ${data.formaAcesso === forma ? 'bg-brand-light/30 border-brand-primary' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                <input 
                  type="radio" 
                  name="formaAcesso" 
                  checked={data.formaAcesso === forma} 
                  onChange={() => handleChange('formaAcesso', forma)} 
                  className="w-4 h-4 text-brand-primary focus:ring-brand-primary mr-3" 
                />
                <span className={`text-sm ${data.formaAcesso === forma ? 'text-brand-secondary font-bold' : 'text-slate-600'}`}>{forma}</span>
              </label>
            ))}
          </div>

          {(data.formaAcesso === 'Encaminhamento por outras políticas públicas' || data.formaAcesso === 'Outros') && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4"
            >
              <label className="block text-xs font-bold text-slate-500 mb-1">
                {data.formaAcesso === 'Outros' ? 'Especifique:' : 'Especifique a política pública:'}
              </label>
              <input 
                type="text" 
                value={data.formaAcessoOutros || ''} 
                onChange={e => handleChange('formaAcessoOutros', e.target.value)}
                placeholder={data.formaAcesso === 'Outros' ? "Descreva a forma de acesso..." : "Ex: Saúde, Educação, Habitação..."}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
                required
              />
            </motion.div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-brand-secondary">Membros da Família em Acompanhamento</h3>
          <button type="button" onClick={addMembro} className="text-sm bg-brand-light text-brand-secondary hover:bg-brand-accent px-3 py-1.5 rounded-lg font-medium flex items-center transition border border-brand-accent/50">
            <Plus size={16} className="mr-1" /> Adicionar
          </button>
        </div>
        
        <div className="space-y-4">
          {data.membros.map((membro, idx) => (
            <div key={membro.id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="sm:col-span-5">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Nome</label>
                <input type="text" value={membro.nome} onChange={e => handleMembroChange(idx, 'nome', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 bg-white" />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Data Nascimento</label>
                <input type="date" value={membro.nascimento} onChange={e => handleMembroChange(idx, 'nascimento', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 bg-white" />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Parentesco</label>
                <input type="text" value={membro.parentesco} onChange={e => handleMembroChange(idx, 'parentesco', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 bg-white" />
              </div>
              <div className="sm:col-span-1 pt-2 sm:pt-0 pb-1 flex justify-end">
                <button type="button" onClick={() => removeMembro(idx)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition" title="Remover">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
