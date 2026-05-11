import { useState } from 'react';
import { LayoutDashboard, Users, FileText, Calendar, Link as LinkIcon, FileBarChart, HelpCircle, LogOut, Clock, Type, Plus, Minus, Lightbulb, AlertCircle } from 'lucide-react';
import HelpModal from './HelpModal';

import { useAuth } from '../AuthProvider';
import { useAccessibility } from '../contexts/AccessibilityContext';

interface SidebarProps {
  currentView: 'dashboard' | 'planos' | 'form' | 'relatorios' | 'equipe' | 'sugestoes' | 'fichas' | 'bug-reports';
  onViewChange: (view: 'dashboard' | 'planos' | 'form' | 'relatorios' | 'equipe' | 'sugestoes' | 'fichas' | 'bug-reports') => void;
}

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { userProfile, logout } = useAuth();
  const { increaseFontSize, decreaseFontSize, resetFontSize, fontSize } = useAccessibility();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'planos', label: 'Planos de Acompanhamento', icon: Users },
    { id: 'fichas', label: 'Ficha de Atendimento', icon: FileText },
    { id: 'calendario', label: 'Agenda de Visitas', icon: Calendar },
    { id: 'relatorios', label: 'Relatórios', icon: FileBarChart },
  ];

  // Adiciona Gestão se for Coordenador ou Admin
  if (userProfile?.role === 'COORDENADOR' || userProfile?.role === 'ADMIN') {
    menuItems.push({ 
      id: 'equipe', 
      label: userProfile.role === 'ADMIN' ? 'Gestão da Rede' : 'Sua Equipe', 
      icon: Users 
    });
    
    if (userProfile.role === 'ADMIN') {
      menuItems.push({
        id: 'bug-reports',
        label: 'Relatórios Técnicos',
        icon: AlertCircle
      });
    }
  }

  menuItems.push({ id: 'sugestoes', label: 'Laboratório', icon: Lightbulb });

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Toggle Bar */}
      <div className="md:hidden sticky top-0 bg-[#007cc0] text-white px-4 py-3 flex items-center justify-between z-40 shadow-lg border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-lg">
            <img src="/logo-semas.png" alt="" className="h-6 w-auto" onError={(e) => e.currentTarget.style.display = 'none'} />
          </div>
          <span className="font-black text-sm uppercase tracking-tighter">PAF Paragominas</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all active:scale-95 flex items-center gap-1"
        >
          <span className="text-[10px] font-black uppercase tracking-widest pl-1">{isMobileMenuOpen ? 'Fechar' : 'Menu'}</span>
          {isMobileMenuOpen ? <Minus size={18} /> : <Plus size={18} />}
        </button>
      </div>

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#007cc0] text-white p-6 flex flex-col transition-transform duration-300 md:relative md:translate-x-0 md:w-[270px] md:z-auto
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex justify-center mb-10 hidden md:flex">
          <img 
            src="/logo-semas.png" 
            alt="SEMAS Paragominas" 
            className="max-h-24 object-contain bg-white p-3 rounded-2xl shadow-sm"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = '<div class="text-3xl font-bold tracking-tight text-white">PAF SUAS</div>';
            }}
          />
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id || (currentView === 'form' && item.id === 'planos');
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'dashboard' || item.id === 'planos' || item.id === 'form' || item.id === 'relatorios' || item.id === 'equipe' || item.id === 'sugestoes' || item.id === 'fichas' || item.id === 'bug-reports' || item.id === 'calendario') {
                    onViewChange(item.id as any);
                    setIsMobileMenuOpen(false);
                  }
                }}
                className={`w-full flex items-center space-x-3 text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-white text-[#007cc0] font-bold shadow-md transform scale-105' 
                    : 'text-blue-100 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-[#007cc0]' : ''} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="px-4 py-3 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Fonte</span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-bold text-white">{fontSize}%</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={decreaseFontSize}
                title="Diminuir fonte"
                className="flex-1 flex justify-center py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all active:scale-95"
              >
                <Minus size={14} />
              </button>
              <button 
                onClick={resetFontSize}
                title="Resetar fonte"
                className="flex-1 flex justify-center py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black transition-all active:scale-95"
              >
                100%
              </button>
              <button 
                onClick={increaseFontSize}
                title="Aumentar fonte"
                className="flex-1 flex justify-center py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all active:scale-95"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <button 
            onClick={() => setIsHelpOpen(true)}
            className="w-full flex items-center space-x-3 text-left px-4 py-3 rounded-xl text-blue-100 hover:text-white hover:bg-white/10 transition-colors font-bold text-sm"
          >
            <HelpCircle size={18} />
            <span>Centro de Ajuda</span>
          </button>

          <div className="p-5 bg-black/20 border-t border-white/10 -mx-6 -mb-6 backdrop-blur-md flex justify-between items-center group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-black text-white text-xs border border-white/10">
                {userProfile?.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-sm leading-tight truncate w-32">{userProfile?.name}</p>
                <p className="text-blue-300 text-[10px] mt-0.5 font-bold uppercase tracking-tighter truncate w-32">CRAS {userProfile?.unidadeCras}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              title="Sair da conta"
              className="p-2.5 text-blue-200 hover:text-white hover:bg-red-500/20 rounded-xl transition-all active:scale-95 border border-transparent hover:border-red-500/30"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
}
