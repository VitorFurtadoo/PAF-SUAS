import React, { useState, useEffect, createContext, useContext } from 'react';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from './firebase';
import { FileText, LogOut, Mail, Lock, User as UserIcon } from 'lucide-react';
import { getUserProfile, createUserProfile } from './services/authService';
import type { UserProfile } from './types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({ user: null, userProfile: null, loading: true, logout: async () => {} });

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Profile creation state
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [cras, setCras] = useState<'Morada do Sol' | 'Nagibão' | 'Camboatã' | 'Jaderlândia' | 'Administração' | ''>('');

  // Email/Password auth state
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const profile = await getUserProfile(u.uid);
          if (profile) {
            setUserProfile(profile);
            setIsCreatingProfile(false);
          } else {
            setProfileName(u.displayName || '');
            setIsCreatingProfile(true);
          }
        } catch (e) {
          console.error("Error fetching user profile:", e);
        }
      } else {
        setUserProfile(null);
        setIsCreatingProfile(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setAuthError('');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Error logging in with Google:', error);
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        // Ignorar se o usuário fechar o popup ou cancelar a requisição
        return;
      }
      setAuthError(error.message || 'Erro ao fazer login com Google.');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthenticating(true);
    
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (registerName) {
          await updateProfile(userCredential.user, { displayName: registerName });
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setAuthError('Email ou senha inválidos.');
      } else if (error.code === 'auth/email-already-in-use') {
        setAuthError('Este email já está em uso.');
      } else if (error.code === 'auth/operation-not-allowed') {
        setAuthError('A autenticação com email e senha está desabilitada nas configurações do Firebase. Por favor, habilite este método no Firebase Console > Authentication > Sign-in method.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        // Ignorar o erro se o usuário apenas fechou o painel de login do Google
        return;
      } else {
        setAuthError(error.message || 'Erro de autenticação.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !cras) return;
    
    setLoading(true);
    try {
      const newProfile = {
        email: user.email || '',
        name: profileName || user.displayName || 'Sem nome',
        role: 'TECNICO' as const,
        unidadeCras: cras as any,
      };
      
      await createUserProfile(user.uid, newProfile);
      setUserProfile(newProfile);
      setIsCreatingProfile(false);
    } catch (error) {
      console.error('Error creating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin text-brand-primary"><FileText size={48} /></div></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 md:p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-10">
          <div className="w-20 h-20 bg-brand-light/50 text-brand-primary rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 animate-in zoom-in-50 transition-all">
            <FileText size={40} className="drop-shadow-sm" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 text-center mb-2 tracking-tight">Sistema PAF</h1>
          <p className="text-slate-500 text-center mb-10 text-sm md:text-base leading-relaxed">
            {isLoginMode ? 'Acesse sua conta para gerenciar os Planos de Acompanhamento Familiar' : 'Crie sua conta para começar a gerenciar os acompanhamentos'}
          </p>
          
          {authError && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0"></div>
              {authError}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4 mb-8">
            {!isLoginMode && (
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-1">Nome Completo</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-brand-primary">
                    <UserIcon size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required
                    placeholder="Seu nome"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none text-sm font-medium"
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-1">Email Profissional</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-brand-primary">
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="exemplo@email.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none text-sm font-medium"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-1">Senha de Acesso</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-brand-primary">
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none text-sm font-medium"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isAuthenticating}
              className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-black py-4 px-4 rounded-2xl transition-all flex justify-center items-center gap-2 disabled:opacity-70 shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95"
            >
              {isAuthenticating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : isLoginMode ? 'Acessar Sistema' : 'Finalizar Cadastro'}
            </button>
          </form>

          <div className="relative flex items-center justify-center mb-8">
            <span className="absolute inset-x-0 h-px bg-slate-100"></span>
            <span className="relative bg-white px-6 text-xs font-black text-slate-300 uppercase tracking-widest">ou entrar com</span>
          </div>

          <button 
            onClick={handleGoogleLogin}
            type="button"
            className="w-full bg-white border border-slate-200 antialiased hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-4 rounded-2xl transition-all flex justify-center items-center gap-3 shadow-sm active:scale-95 border-b-2"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google Workspaces
          </button>

          <p className="text-center text-sm text-slate-400 mt-8 font-medium">
            {isLoginMode ? "Novo por aqui?" : "Já possui conta?"}{' '}
            <button 
              type="button"
              onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(''); }}
              className="text-brand-primary hover:text-brand-secondary font-black transition-colors"
            >
              {isLoginMode ? 'Cadastre-se' : 'Faça login'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  if (isCreatingProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 md:p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-10">
          <div className="w-16 h-16 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center mb-6">
            <UserIcon size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Completar Cadastro</h2>
          <p className="text-slate-500 mb-10 text-sm font-medium">Para sua segurança, informe sua unidade de atuação no CRAS.</p>
          
          <form onSubmit={handleCreateProfile} className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-1">Seu Nome</label>
              <input 
                type="text" 
                value={profileName} 
                onChange={(e) => setProfileName(e.target.value)}
                required
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none text-sm font-medium"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-1">Unidade CRAS de Lotação</label>
              <select 
                required
                value={cras}
                onChange={(e) => setCras(e.target.value as any)}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-brand-primary/10 transition-all outline-none text-sm font-bold text-slate-700"
              >
                <option value="">Selecione sua unidade...</option>
                <option value="Morada do Sol">CRAS Morada do Sol</option>
                <option value="Nagibão">CRAS Nagibão</option>
                <option value="Camboatã">CRAS Camboatã</option>
                <option value="Jaderlândia">CRAS Jaderlândia</option>
                <option value="Administração">Administração (Acesso Global)</option>
              </select>
            </div>
            
            <button 
              type="submit"
              disabled={!cras || !profileName}
              className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-black py-4 px-4 rounded-2xl transition-all disabled:opacity-50 shadow-xl shadow-brand-primary/20"
            >
              Concluir e Começar
            </button>
          </form>
          
          <button 
            onClick={handleLogout}
            className="mt-8 w-full text-slate-400 hover:text-slate-600 text-xs font-black uppercase tracking-widest transition-all flex justify-center items-center gap-2"
          >
            <LogOut size={16} /> Cancelar Acesso
          </button>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={{ user, userProfile, loading, logout: handleLogout }}>{children}</AuthContext.Provider>;
}
