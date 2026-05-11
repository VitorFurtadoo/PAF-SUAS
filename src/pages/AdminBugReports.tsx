import React, { useState, useEffect } from 'react';
import { 
  Bug, 
  Clock, 
  CheckCircle2, 
  X, 
  AlertCircle, 
  Loader2, 
  Search, 
  Filter,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { getBugReports, updateBugReportStatus, BugReport } from '../services/bugReportService';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminBugReports() {
  const [reports, setReports] = useState<(BugReport & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await getBugReports();
      setReports(data);
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: BugReport['status']) => {
    try {
      await updateBugReportStatus(id, status);
      setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const getTypeIcon = (type: BugReport['type']) => {
    switch (type) {
      case 'bug': return { icon: Bug, color: 'text-red-600', bg: 'bg-red-50', label: 'Erro' };
      case 'suggestion': return { icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Sugestão' };
      case 'question': return { icon: HelpCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Dúvida' };
    }
  };

  const getStatusBadge = (status: BugReport['status']) => {
    switch (status) {
      case 'new': return { label: 'Novo', color: 'bg-blue-100 text-blue-700' };
      case 'investigating': return { label: 'Em Análise', color: 'bg-amber-100 text-amber-700' };
      case 'fixed': return { label: 'Corrigido', color: 'bg-emerald-100 text-emerald-700' };
      case 'closed': return { label: 'Fechado', color: 'bg-slate-100 text-slate-700' };
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesType = filterType === 'all' || r.type === filterType;
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchesType && matchesStatus;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
            <div className="bg-red-50 p-2.5 rounded-2xl">
              <Bug className="text-red-600" size={24} />
            </div>
            Relatórios Técnicos
          </h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base font-medium">Controle de erros, bugs e dúvidas técnicas reportadas pelos usuários.</p>
        </div>
        
        <button 
          onClick={fetchReports}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
        >
          <Clock size={16} />
          Atualizar Lista
        </button>
      </header>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Filtros:</span>
          </div>
          
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-red-600/10 focus:border-red-600"
          >
            <option value="all">Todos os Tipos</option>
            <option value="bug">Somente Erros</option>
            <option value="suggestion">Somente Sugestões</option>
            <option value="question">Somente Dúvidas</option>
          </select>

          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-red-600/10 focus:border-red-600"
          >
            <option value="all">Todos os Status</option>
            <option value="new">Novos</option>
            <option value="investigating">Em Análise</option>
            <option value="fixed">Corrigidos</option>
            <option value="closed">Fechados</option>
          </select>

          <div className="ml-auto text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {filteredReports.length} Relatórios Encontrados
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-red-600" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando reports...</p>
            </div>
          ) : filteredReports.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-40">Tipo / Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Relato do Usuário</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-48">Origem / Autor</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32 border-l border-slate-100">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report) => {
                  const typeInfo = getTypeIcon(report.type);
                  const statusBadge = getStatusBadge(report.status);
                  const Icon = typeInfo.icon;
                  
                  return (
                    <tr key={report.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 align-top">
                        <div className="space-y-2">
                          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${typeInfo.bg} ${typeInfo.color} w-fit`}>
                            <Icon size={12} />
                            <span className="text-[10px] font-black uppercase tracking-tighter">{typeInfo.label}</span>
                          </div>
                          <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter w-fit ${statusBadge.color}`}>
                            {statusBadge.label}
                          </div>
                          <div className="text-[9px] text-slate-400 font-bold px-1 uppercase italic">
                            {report.createdAt ? new Date(report.createdAt.toMillis()).toLocaleDateString('pt-BR') : 'Sem data'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="max-w-xl">
                          <p className="text-sm font-bold text-slate-700 leading-relaxed mb-3">
                            {report.description}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium bg-slate-100/50 p-2 rounded-xl border border-slate-200/50 w-fit">
                            <ExternalLink size={12} />
                            <span className="truncate max-w-[300px]" title={report.pageUrl}>{report.pageUrl}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="space-y-1">
                          <p className="text-xs font-black text-slate-800">{report.userName}</p>
                          <p className="text-xs text-brand-secondary font-bold">{report.userEmail}</p>
                          <p className="text-[9px] text-slate-400 truncate max-w-[150px]" title={report.userAgent}>
                            {report.userAgent}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top border-l border-slate-100">
                        <div className="flex flex-col gap-1.5">
                          <button 
                            onClick={() => handleStatusChange(report.id, 'investigating')}
                            className="text-left px-2 py-1 hover:bg-amber-100 text-amber-700 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all"
                          >
                            Analisar
                          </button>
                          <button 
                            onClick={() => handleStatusChange(report.id, 'fixed')}
                            className="text-left px-2 py-1 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all"
                          >
                            Corrigir
                          </button>
                          <button 
                            onClick={() => handleStatusChange(report.id, 'closed')}
                            className="text-left px-2 py-1 hover:bg-slate-200 text-slate-700 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all"
                          >
                            Fechar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-24 text-center">
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="text-slate-300" size={40} />
              </div>
              <h3 className="text-lg font-black text-slate-800">Tudo limpo por aqui!</h3>
              <p className="text-slate-500 font-medium">Nenhum relatório {filterStatus !== 'all' ? 'com este status' : ''} foi encontrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
