/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import PAFForm from './pages/PAFForm';
import PlanosList from './pages/PlanosList';
import Relatorios from './pages/Relatorios';
import GestaoUsuarios from './pages/GestaoUsuarios';
import Sugestoes from './pages/Sugestoes';
import FichasAtendimento from './pages/FichasAtendimento';
import AdminBugReports from './pages/AdminBugReports';
import CalendarioVisitas from './pages/CalendarioVisitas';
import type { PAFData } from './types';
import ErrorReportButton from './components/ErrorReportButton';
import { useAuth } from './AuthProvider';

export default function App() {
  const { userProfile } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'planos' | 'form' | 'relatorios' | 'equipe' | 'sugestoes' | 'fichas' | 'bug-reports' | 'calendario'>('dashboard');
  const [selectedPaf, setSelectedPaf] = useState<PAFData | null>(null);
  const [fichasDefaultCreate, setFichasDefaultCreate] = useState(false);

  const handleEditPlan = (paf: PAFData) => {
    setSelectedPaf(paf);
    setCurrentView('form');
  };

  const handleNewPlan = () => {
    setSelectedPaf(null);
    setCurrentView('form');
  };

  const handleNewFicha = () => {
    setFichasDefaultCreate(true);
    setCurrentView('fichas');
    // Reset the flag after a short delay so it doesn't stay true forever
    setTimeout(() => setFichasDefaultCreate(false), 500);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-brand-bg font-sans">
      <Sidebar currentView={currentView} onViewChange={setCurrentView as any} />
      
      <main className="flex-1 overflow-x-hidden overflow-y-auto w-full">
        {currentView === 'dashboard' ? (
          <Dashboard onNewPlan={handleNewPlan} onNewFicha={handleNewFicha} />
        ) : currentView === 'planos' ? (
          <PlanosList onNewPlan={handleNewPlan} onEditPlan={handleEditPlan} />
        ) : currentView === 'relatorios' ? (
          <Relatorios />
        ) : currentView === 'equipe' ? (
          <GestaoUsuarios />
        ) : currentView === 'sugestoes' ? (
          <Sugestoes />
        ) : currentView === 'fichas' ? (
          <FichasAtendimento defaultCreate={fichasDefaultCreate} />
        ) : currentView === 'calendario' ? (
          <CalendarioVisitas onEditPlan={handleEditPlan} />
        ) : currentView === 'bug-reports' ? (
          userProfile?.role === 'ADMIN' ? <AdminBugReports /> : <Dashboard onNewPlan={handleNewPlan} onNewFicha={handleNewFicha} />
        ) : (
          <PAFForm onBack={() => setCurrentView('planos')} initialPafData={selectedPaf} />
        )}
      </main>
      <ErrorReportButton />
    </div>
  );
}
