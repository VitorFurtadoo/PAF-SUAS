import { useState, useEffect } from 'react';
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
  Building
} from 'lucide-react';
import { useAuth } from '../AuthProvider';
import { getTeclicosPorUnidade, getAllUsers, updateUserRole, updateUserUnit } from '../services/userService';
import { UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function GestaoUsuarios() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filterUnit, setFilterUnit] = useState('Morada do Sol');
  const [activeTab, setActiveTab] = useState<'network' | 'admins'>('network');

  const isAdmin = userProfile?.role === 'ADMIN';
  const isCoordinator = userProfile?.role === 'COORDENADOR';

  useEffect(() => {
    fetchUsers();
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
            <Users className="text-brand-primary" size={24} />
          </div>
          {isAdmin 
            ? (activeTab === 'network' ? 'Gestão da Rede SUAS' : 'Administradores do Sistema')
            : 'Gestão de Equipe'}
        </h1>
        <p className="text-slate-500 mt-2 text-sm md:text-base">
          {isAdmin 
            ? (activeTab === 'network' 
                ? 'Visualização e gerenciamento de todos os CRAS e profissionais do município.' 
                : 'Gerenciamento dos usuários com privilégios administrativos extraordinários.')
            : `Profissionais vinculados ao CRAS ${userProfile?.unidadeCras}.`}
        </p>
      </header>

      {isAdmin && (
        <div className="mb-6 flex p-1 bg-slate-100 rounded-2xl w-fit">
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
            Administradores do Sistema
          </button>
        </div>
      )}

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
    </div>
  );
}
