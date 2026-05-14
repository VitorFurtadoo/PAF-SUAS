import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  MapPin, 
  Mail, 
  CheckCircle2, 
  Loader2, 
  ArrowLeft,
  Settings,
  MoreVertical,
  ShieldAlert,
  UserCheck,
  Building,
  Bell,
  Megaphone,
  Plus,
  Trash2,
  Edit2,
  X,
  Save,
  Clock,
  Sparkles,
  Info,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../AuthProvider';
import { getTeclicosPorUnidade, getAllUsers, updateUserRole, updateUserUnit } from '../services/userService';
import { getNotices, saveNotice, updateNotice, deleteNotice } from '../services/noticeService';
import { UserProfile, Notice } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function GestaoUsuarios() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filterUnit, setFilterUnit] = useState('Morada do Sol');
  const [activeTab, setActiveTab] = useState<'network' | 'admins' | 'notices'>('network');
  
  // Notices state
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [noticeFormData, setNoticeFormData] = useState({
    title: '',
    content: '',
    type: 'INFO' as 'INFO' | 'WARNING' | 'IMPORTANT' | 'ACHIEVEMENT',
    active: true
  });

  const isAdmin = userProfile?.role === 'ADMIN';
  const isCoordinator = userProfile?.role === 'COORDENADOR';

  useEffect(() => {
    fetchUsers();
    
    if (isAdmin) {
      const unsubscribeNotices = getNotices(false, (data) => {
        setNotices(data);
      });
      return () => unsubscribeNotices();
    }
  }, [userProfile]);

  const fetchUsers = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      if (isAdmin) {
        const data = await getAllUsers();
        setUsers(data);
      } else if (isCoordinator) {
        const data = await getTeclicosPorUnidade(userProfile.unidadeCras);
        setUsers(data);
      }
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: any) => {
    setUpdatingId(userId);
    try {
      await updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error("Erro ao atualizar cargo:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUnitChange = async (userId: string, newUnit: any) => {
    setUpdatingId(userId);
    try {
      await updateUserUnit(userId, newUnit);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, unidadeCras: newUnit } : u));
    } catch (error) {
      console.error("Erro ao atualizar unidade:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleNoticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    try {
      if (editingNotice) {
        await updateNotice(editingNotice.id!, noticeFormData);
        toast.success('Aviso atualizado com sucesso!');
      } else {
        await saveNotice({
          ...noticeFormData,
          authorId: userProfile.id || 'system',
          authorName: userProfile.name
        });
        toast.success('Novo aviso publicado!');
      }
      setIsNoticeModalOpen(false);
      setEditingNotice(null);
      setNoticeFormData({ title: '', content: '', type: 'INFO', active: true });
    } catch (error) {
      console.error("Error saving notice:", error);
      toast.error('Erro ao salvar aviso.');
    }
  };

  const handleEditNotice = (notice: Notice) => {
    setEditingNotice(notice);
    setNoticeFormData({
      title: notice.title,
      content: notice.content,
      type: notice.type,
      active: notice.active
    });
    setIsNoticeModalOpen(true);
  };

  const handleDeleteNotice = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este aviso?')) {
      try {
        await deleteNotice(id);
        toast.success('Aviso excluído.');
      } catch (error) {
        console.error("Error deleting notice:", error);
        toast.error('Erro ao excluir aviso.');
      }
    }
  };

  const filteredUsers = isAdmin 
    ? (activeTab === 'admins' 
        ? users.filter(u => u.role === 'ADMIN')
        : users.filter(u => u.role !== 'ADMIN' && u.unidadeCras === filterUnit))
    : users;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <ShieldAlert className="text-red-500" size={16} />;
      case 'COORDENADOR': return <Shield className="text-brand-primary" size={16} />;
      default: return <UserCheck className="text-emerald-500" size={16} />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrador';
      case 'COORDENADOR': return 'Coordenador';
      default: return 'Técnico';
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-3">
          <div className="bg-brand-light p-2.5 rounded-2xl">
            {activeTab === 'notices' ? <Bell className="text-brand-primary" size={24} /> : <Users className="text-brand-primary" size={24} />}
          </div>
          {isAdmin 
            ? (activeTab === 'network' ? 'Gestão da Rede SUAS' : activeTab === 'admins' ? 'Administradores do Sistema' : 'Centro de Avisos')
            : 'Gestão de Equipe'}
        </h1>
        <p className="text-slate-500 mt-2 text-sm md:text-base">
          {isAdmin 
            ? (activeTab === 'network' 
                ? 'Visualização e gerenciamento de todos os CRAS e profissionais do município.' 
                : activeTab === 'admins' 
                  ? 'Gerenciamento dos usuários com privilégios administrativos extraordinários.'
                  : 'Gerencie comunicados e avisos que aparecem na tela inicial para todos os usuários.')
            : `Profissionais vinculados ao CRAS ${userProfile?.unidadeCras}.`}
        </p>
      </header>

      {isAdmin && (
        <div className="mb-6 flex flex-wrap p-1 bg-slate-100 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('network')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'network' 
                ? 'bg-white text-brand-primary shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Gestão da Rede
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'admins' 
                ? 'bg-white text-red-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Administradores
          </button>
          <button
            onClick={() => setActiveTab('notices')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'notices' 
                ? 'bg-white text-emerald-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Centro de Avisos
          </button>
        </div>
      )}

      {activeTab === 'notices' && isAdmin ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-black text-slate-800">Meus Avisos</h2>
            <button 
              onClick={() => {
                setEditingNotice(null);
                setNoticeFormData({ title: '', content: '', type: 'INFO', active: true });
                setIsNoticeModalOpen(true);
              }}
              className="bg-brand-primary text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-brand-primary/20"
            >
              <Plus size={18} strokeWidth={3} />
              Criar Novo Aviso
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {notices.map((notice) => (
                <motion.div 
                  layout
                  key={notice.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`bg-white rounded-[32px] border border-slate-200 p-6 relative group overflow-hidden ${!notice.active && 'opacity-60 grayscale'}`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-3 rounded-2xl ${
                      notice.type === 'IMPORTANT' ? 'bg-red-50 text-red-500' :
                      notice.type === 'WARNING' ? 'bg-amber-50 text-amber-500' :
                      notice.type === 'ACHIEVEMENT' ? 'bg-emerald-50 text-emerald-500' :
                      'bg-blue-50 text-brand-primary'
                    }`}>
                      {notice.type === 'IMPORTANT' ? <Megaphone size={20} /> : 
                       notice.type === 'ACHIEVEMENT' ? <Sparkles size={20} /> :
                       <Bell size={20} />}
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEditNotice(notice)}
                        className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-xl transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteNotice(notice.id!)}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-900 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-slate-800 mb-2">{notice.title}</h3>
                  <p className="text-slate-500 text-sm font-medium line-clamp-3 mb-6">{notice.content}</p>

                  <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                         {notice.authorName.substring(0, 2).toUpperCase()}
                       </div>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{notice.authorName}</span>
                    </div>
                    {!notice.active && (
                      <span className="bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg">Arquivado</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {notices.length === 0 && (
              <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-200 rounded-[40px]">
                <Bell size={48} className="mx-auto text-slate-200 mb-4" />
                <h3 className="text-slate-800 font-black">Nenhum aviso ativo</h3>
                <p className="text-slate-400 text-sm mt-1">Crie comunicados importantes para toda a rede.</p>
              </div>
            )}
          </div>

          {/* Modal Overlay */}
          <AnimatePresence>
            {isNoticeModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsNoticeModalOpen(false)}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                />
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="bg-white w-full max-w-xl shadow-2xl relative z-10 rounded-[40px] overflow-hidden"
                >
                  <form onSubmit={handleNoticeSubmit} className="p-10 space-y-8">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                        {editingNotice ? 'Editar Aviso' : 'Novo Comunicado'}
                      </h2>
                      <button 
                        type="button"
                        onClick={() => setIsNoticeModalOpen(false)}
                        className="p-3 bg-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Título</label>
                        <input 
                          required
                          value={noticeFormData.title}
                          onChange={(e) => setNoticeFormData({...noticeFormData, title: e.target.value})}
                          placeholder="Ex: Novo Manual de Orientações"
                          className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 text-sm font-bold placeholder:text-slate-300 focus:ring-4 focus:ring-brand-primary/5 transition-all outline-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Tipo / Vibe</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: 'INFO', label: 'Informativo', icon: Info, color: 'text-brand-primary' },
                            { id: 'IMPORTANT', label: 'Urgente', icon: Megaphone, color: 'text-red-500' },
                            { id: 'WARNING', label: 'Aviso', icon: AlertTriangle, color: 'text-amber-500' },
                            { id: 'ACHIEVEMENT', label: 'Conquista', icon: Sparkles, color: 'text-emerald-500' },
                          ].map((type) => (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => setNoticeFormData({...noticeFormData, type: type.id as any})}
                              className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${
                                noticeFormData.type === type.id 
                                  ? 'bg-slate-900 border-slate-900 text-white' 
                                  : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'
                              }`}
                            >
                              <type.icon size={18} />
                              <span className="text-[10px] font-black uppercase tracking-widest">{type.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Mensagem</label>
                        <textarea 
                          required
                          value={noticeFormData.content}
                          onChange={(e) => setNoticeFormData({...noticeFormData, content: e.target.value})}
                          rows={4}
                          placeholder="Descreva o comunicado de forma clara e objetiva..."
                          className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 text-sm font-bold placeholder:text-slate-300 focus:ring-4 focus:ring-brand-primary/5 transition-all outline-none resize-none"
                        />
                      </div>

                      <div className="flex items-center gap-3 p-6 bg-slate-50 rounded-3xl cursor-pointer" onClick={() => setNoticeFormData({...noticeFormData, active: !noticeFormData.active})}>
                        <div className={`w-12 h-6 rounded-full relative transition-all ${noticeFormData.active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${noticeFormData.active ? 'left-7' : 'left-1'}`} />
                        </div>
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-widest text-slate-800 leading-none">Aviso Habilitado</p>
                          <p className="text-[10px] font-medium text-slate-400 mt-1">Este aviso aparecerá visível na dashboard se ativado.</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6">
                      <button 
                        type="submit"
                        className="w-full bg-brand-primary text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                      >
                        <Save size={18} strokeWidth={3} />
                        {editingNotice ? 'Salvar Alterações' : 'Publicar Comunicado'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <>
          {isAdmin && activeTab === 'network' && (
            <div className="mb-8 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              {['Morada do Sol', 'Nagibão', 'Camboatã', 'Jaderlândia'].map(unit => (
                <button
                  key={unit}
                  onClick={() => setFilterUnit(unit)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    filterUnit === unit 
                      ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20' 
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  CRAS {unit}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredUsers.map((u, index) => (
                <motion.div
                  layout
                  key={u.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-light group-hover:text-brand-primary transition-colors">
                        <Users size={28} />
                      </div>
                      <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 border ${
                        u.role === 'ADMIN' ? 'bg-red-50 text-red-600 border-red-100' :
                        u.role === 'COORDENADOR' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {getRoleIcon(u.role)}
                        <span className="text-[10px] font-black uppercase tracking-widest">{getRoleLabel(u.role)}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-slate-800 leading-tight truncate">{u.name}</h3>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Mail size={14} />
                        <span className="text-xs font-medium truncate">{u.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 pt-2">
                        <Building size={14} className="text-brand-primary" />
                        <span className="text-xs font-bold uppercase tracking-tighter">
                          {u.role === 'ADMIN' ? 'Administração Geral' : `CRAS ${u.unidadeCras}`}
                        </span>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Alterar Cargo</label>
                          <select 
                            disabled={updatingId === u.id}
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id!, e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all"
                          >
                            <option value="TECNICO">Técnico</option>
                            <option value="COORDENADOR">Coordenador</option>
                            <option value="ADMIN">Administrador</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Lotação</label>
                          <select 
                            disabled={updatingId === u.id}
                            value={u.unidadeCras}
                            onChange={(e) => handleUnitChange(u.id!, e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all"
                          >
                            <option value="Morada do Sol">Morada do Sol</option>
                            <option value="Nagibão">Nagibão</option>
                            <option value="Camboatã">Camboatã</option>
                            <option value="Jaderlândia">Jaderlândia</option>
                          </select>
                        </div>
                      </div>
                    )}
                    
                    {updatingId === u.id && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-3xl">
                        <Loader2 className="animate-spin text-brand-primary" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredUsers.length === 0 && (
              <div className="col-span-full py-24 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  {activeTab === 'admins' ? <ShieldAlert className="text-slate-300" size={48} /> : <Users className="text-slate-300" size={48} />}
                </div>
                <h3 className="text-slate-800 text-xl font-black">
                  {activeTab === 'admins' ? 'Nenhum administrador encontrado' : 'Nenhum profissional encontrado'}
                </h3>
                <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                  {activeTab === 'admins' 
                    ? 'Atualmente não existem outros usuários com perfil de administrador no sistema.'
                    : 'Tente ajustar os filtros de regional/CRAS para localizar os profissionais.'}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
