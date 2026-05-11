import { useState, useEffect } from 'react';
import { Loader2, FileBarChart, Calendar as CalendarIcon, Download, TrendingUp } from 'lucide-react';
import { getPAFs } from '../services/pafService';
import { useAuth } from '../AuthProvider';
import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function Relatorios() {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pafs, setPafs] = useState<any[]>([]);
  const [selectedCras, setSelectedCras] = useState('todos');
  const [periodo, setPeriodo] = useState('mes'); // 'mes', 'trimestre', 'ano', 'todos', 'personalizado'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tipoServico, setTipoServico] = useState('todos'); // 'todos', 'basica', 'media', 'alta'
  const [programaRenda, setProgramaRenda] = useState('todos'); // 'todos', 'Bolsa Família', 'BPC', 'Criança Feliz', 'Outros'
  const [prioridade, setPrioridade] = useState('todos'); // 'todos', 'baixo', 'medio', 'alto'
  
  useEffect(() => {
    const fetchDados = async () => {
      if (user && userProfile) {
        try {
          const data = await getPAFs(userProfile, user.uid);
          setPafs(data);
        } catch (error) {
          console.error("Failed to fetch PAFs:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchDados();
  }, [user, userProfile]);

  // Filtrar com base no período, tipo de serviço e programa de renda
  const filteredPafs = pafs.filter(paf => {
    // 0. Filtro de CRAS (Para Admins/Coordenadores que veem mais que uma unidade)
    let matchCras = true;
    if (selectedCras !== 'todos') {
      matchCras = paf.unidadeCras === selectedCras;
    }
    if (!matchCras) return false;

    // 1. Filtro de Período
    let matchPeriodo = true;
    if (periodo !== 'todos' && paf.createdAt) {
      const dataCriacao = new Date(paf.createdAt.toMillis());
      const agora = new Date();
      
      if (periodo === 'mes') {
        const umMesAtras = new Date();
        umMesAtras.setMonth(agora.getMonth() - 1);
        matchPeriodo = dataCriacao >= umMesAtras;
      } else if (periodo === 'trimestre') {
        const tresMesesAtras = new Date();
        tresMesesAtras.setMonth(agora.getMonth() - 3);
        matchPeriodo = dataCriacao >= tresMesesAtras;
      } else if (periodo === 'ano') {
        const umAnoAtras = new Date();
        umAnoAtras.setFullYear(agora.getFullYear() - 1);
        matchPeriodo = dataCriacao >= umAnoAtras;
      } else if (periodo === 'personalizado') {
        const start = startDate ? new Date(startDate + 'T00:00:00') : null;
        const end = endDate ? new Date(endDate + 'T23:59:59') : null;
        
        if (start && end) {
          matchPeriodo = dataCriacao >= start && dataCriacao <= end;
        } else if (start) {
          matchPeriodo = dataCriacao >= start;
        } else if (end) {
          matchPeriodo = dataCriacao <= end;
        }
      }
    }

    if (!matchPeriodo) return false;

    // 2. Filtro de Tipo de Serviço
    let matchTipoServico = true;
    if (tipoServico === 'basica') {
      matchTipoServico = paf.servicosBasica && paf.servicosBasica.length > 0;
    } else if (tipoServico === 'media') {
      matchTipoServico = paf.servicosEspecialMedia && paf.servicosEspecialMedia.length > 0;
    } else if (tipoServico === 'alta') {
      matchTipoServico = paf.servicosEspecialAlta && paf.servicosEspecialAlta.length > 0;
    }

    if (!matchTipoServico) return false;

    // 3. Filtro de Programa de Renda
    let matchProgramaRenda = true;
    if (programaRenda !== 'todos') {
      if (programaRenda === 'Outros') {
        matchProgramaRenda = paf.programasRendaOutros && paf.programasRendaOutros.trim() !== '';
      } else {
        matchProgramaRenda = paf.programasRendaQuais && paf.programasRendaQuais.includes(programaRenda);
      }
    }

    if (!matchProgramaRenda) return false;

    // 4. Filtro de Prioridade (Baseado no número de vulnerabilidades)
    let matchPrioridade = true;
    if (prioridade !== 'todos') {
      const count = paf.vulnerabilidades ? paf.vulnerabilidades.length : 0;
      if (prioridade === 'alto') matchPrioridade = count >= 8;
      else if (prioridade === 'medio') matchPrioridade = count >= 4 && count < 8;
      else if (prioridade === 'baixo') matchPrioridade = count < 4;
    }

    if (!matchPrioridade) return false;
    
    return true;
  });

  const totalCriados = filteredPafs.length;
  const emAndamento = filteredPafs.filter(p => !p.situacao || p.situacao === 'Em andamento' || p.situacao === 'Em acompanhamento').length;
  const encerrados = filteredPafs.filter(p => p.situacao === 'Encerrado').length;
  
  // Por enquanto, não temos base de visitas no banco, então exibiremos 0.
  const totalVisitas = 0; 
  
  // Analytics for Visitas
  const allVisitas = filteredPafs.flatMap(p => p.visitasHistory || []);
  const visitasConcluidas = allVisitas.filter(v => v.status === 'concluida').length;
  const visitasAdiadas = allVisitas.filter(v => v.status === 'adiada').length;
  const visitasCanceladas = allVisitas.filter(v => v.status === 'cancelada').length;
  const visitasAgendadasFuturas = filteredPafs.filter(p => p.proximaVisitaData).length;

  const visitasData = [
    { name: 'Concluídas', value: visitasConcluidas, color: '#10b981' },
    { name: 'Adiadas', value: visitasAdiadas, color: '#f59e0b' },
    { name: 'Canceladas', value: visitasCanceladas, color: '#ef4444' },
    { name: 'Agendadas', value: visitasAgendadasFuturas, color: '#0ea5e9' },
  ];

  // Contato Completeness
  const temTelefone = filteredPafs.filter(p => p.telefone && p.telefone.trim() !== '').length;
  const temEmail = filteredPafs.filter(p => p.emailContato && p.emailContato.trim() !== '').length;
  const temEndereco = filteredPafs.filter(p => p.endereco && p.endereco.trim() !== '').length;

  const statusData = [
    { name: 'Em Andamento', value: emAndamento },
    { name: 'Encerrados', value: encerrados },
  ];
  
  const COLORS = ['#0ea5e9', '#10b981'];

  // Agrupar por mes para o grafico de barras (ultimos 6 meses)
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  const pafsPorMes = filteredPafs.reduce((acc: any, paf) => {
    if (paf.createdAt) {
       const date = new Date(paf.createdAt.toMillis());
       const mesLabel = meses[date.getMonth()] + '/' + date.getFullYear().toString().substring(2);
       if (!acc[mesLabel]) acc[mesLabel] = { name: mesLabel, Criados: 0, Encerrados: 0 };
       acc[mesLabel].Criados += 1;
       if (paf.situacao === 'Encerrado') {
         acc[mesLabel].Encerrados += 1;
       }
    }
    return acc;
  }, {});
  
  const chartData = Object.values(pafsPorMes);

  // Agrupar por tipo de serviço para o novo relatório
  const countBasica = filteredPafs.filter(p => p.servicosBasica && p.servicosBasica.length > 0).length;
  const countMedia = filteredPafs.filter(p => p.servicosEspecialMedia && p.servicosEspecialMedia.length > 0).length;
  const countAlta = filteredPafs.filter(p => p.servicosEspecialAlta && p.servicosEspecialAlta.length > 0).length;

  const servicosData = [
    { name: 'Proteção Básica', value: countBasica, color: '#10b981' },
    { name: 'Especial Média', value: countMedia, color: '#f59e0b' },
    { name: 'Especial Alta', value: countAlta, color: '#ef4444' },
  ];

  // Prioridades
  const countBaixoPrio = filteredPafs.filter(p => (p.vulnerabilidades?.length || 0) < 4).length;
  const countMedioPrio = filteredPafs.filter(p => (p.vulnerabilidades?.length || 0) >= 4 && (p.vulnerabilidades?.length || 0) < 8).length;
  const countAltoPrio = filteredPafs.filter(p => (p.vulnerabilidades?.length || 0) >= 8).length;

  const prioridadeData = [
    { name: 'Baixa', value: countBaixoPrio, color: '#10b981' },
    { name: 'Média', value: countMedioPrio, color: '#f59e0b' },
    { name: 'Alta', value: countAltoPrio, color: '#ef4444' },
  ];

  // Adicionar distribuição por vulnerabilidades mais comuns
  const allVulnerabilities = filteredPafs.flatMap(p => p.vulnerabilidades || []);
  const vulnCounts = allVulnerabilities.reduce((acc: Record<string, number>, v: string) => {
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {});

  const vulnData = Object.entries(vulnCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => (b.value as number) - (a.value as number))
    .slice(0, 5);

  // Helper to export the services table to CSV
  const exportServicosCSV = () => {
    const headers = ['Tipo de Serviço', 'Quantidade de PAFs', 'Percentual (%)'];
    const rows = servicosData.map(item => [
      item.name,
      item.value.toString(),
      totalCriados > 0 ? ((item.value / totalCriados) * 100).toFixed(1) + '%' : '0%'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const fileName = `relatorio_servicos_${selectedCras === 'todos' ? 'GERAL' : selectedCras}_${new Date().toISOString().split('T')[0]}.csv`;
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const crasUnits = [
    "Morada do Sol",
    "Nagibão",
    "Camboatã",
    "Jaderlândia"
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3 leading-tight">
            <div className="bg-brand-light p-2 rounded-xl">
              <FileBarChart className="text-brand-primary" size={24} />
            </div>
            Relatórios e Estatísticas
          </h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">Visão geral consolidada dos acompanhamentos</p>
        </div>
        
        <button className="hidden lg:flex bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium items-center gap-2 shadow-sm transition">
          <Download size={18} />
          Exportar
        </button>
      </div>

      <div className="mb-8 p-4 md:p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {(userProfile?.role === 'ADMIN') && (
          <div className="pb-4 border-b border-slate-100 mb-2">
             <h3 className="text-xs font-black text-brand-primary uppercase tracking-widest mb-3">Filtrar por Unidade (Administrativo)</h3>
             <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setSelectedCras('todos')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedCras === 'todos' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >
                  VISÃO GERAL (TODOS)
                </button>
                {crasUnits.map(unit => (
                  <button 
                    key={unit}
                    onClick={() => setSelectedCras(unit)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedCras === unit ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                  >
                    CRAS {unit}
                  </button>
                ))}
             </div>
          </div>
        )}
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Filtros Inteligentes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-primary/10">
            <CalendarIcon size={16} className="text-slate-400 mr-2" />
            <select 
              value={periodo} 
              onChange={(e) => setPeriodo(e.target.value)}
              className="bg-transparent border-none outline-none text-slate-700 text-xs font-bold cursor-pointer w-full"
            >
              <option value="mes">Último Mês</option>
              <option value="trimestre">Último Trimestre</option>
              <option value="ano">Último Ano</option>
              <option value="personalizado">Personalizado</option>
              <option value="todos">Todo o Período</option>
            </select>
          </div>

          <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
            <select 
              value={tipoServico} 
              onChange={(e) => setTipoServico(e.target.value)}
              className="bg-transparent border-none outline-none text-slate-700 text-xs font-bold cursor-pointer w-full"
            >
              <option value="todos">Todos os Serviços</option>
              <option value="basica">Proteção Básica</option>
              <option value="media">Especial Média</option>
              <option value="alta">Especial Alta</option>
            </select>
          </div>

          <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
            <select 
              value={programaRenda} 
              onChange={(e) => setProgramaRenda(e.target.value)}
              className="bg-transparent border-none outline-none text-slate-700 text-xs font-bold cursor-pointer w-full"
            >
              <option value="todos">Todos os Programas</option>
              <option value="Bolsa Família">Bolsa Família</option>
              <option value="BPC - Benefício de Prestação Continuada">BPC</option>
              <option value="Programa Criança Feliz">Criança Feliz</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
            <select 
              value={prioridade} 
              onChange={(e) => setPrioridade(e.target.value)}
              className="bg-transparent border-none outline-none text-slate-700 text-xs font-bold cursor-pointer w-full"
            >
              <option value="todos">Todas Prioridades</option>
              <option value="alto">Alta (8+ vul.)</option>
              <option value="medio">Média (4-7 vul.)</option>
              <option value="baixo">Baixa (0-3 vul.)</option>
            </select>
          </div>
        </div>

        {periodo === 'personalizado' && (
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 animate-in fade-in slide-in-from-top-1">
            <div className="w-full sm:w-auto flex items-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase mr-2 shrink-0">De:</span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent border-none outline-none text-xs text-slate-700 font-bold w-full" />
            </div>
            <div className="w-full sm:w-auto flex items-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase mr-2 shrink-0">Até:</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent border-none outline-none text-xs text-slate-700 font-bold w-full" />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6 flex flex-col items-center text-center">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3">
            <FileBarChart size={20} />
          </div>
          <h3 className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-widest leading-tight">PAFs Criados</h3>
          <p className="text-2xl md:text-4xl font-black text-slate-800 mt-1">{totalCriados}</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6 flex flex-col items-center text-center">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
            <TrendingUp size={20} />
          </div>
          <h3 className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-widest leading-tight">Em Andamento</h3>
          <p className="text-2xl md:text-4xl font-black text-slate-800 mt-1">{emAndamento}</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6 flex flex-col items-center text-center">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center mb-3">
            <FileBarChart size={20} />
          </div>
          <h3 className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-widest leading-tight">Encerrados</h3>
          <p className="text-2xl md:text-4xl font-black text-slate-800 mt-1">{encerrados}</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6 flex flex-col items-center text-center relative overflow-hidden group">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3 z-10">
            <CalendarIcon size={20} />
          </div>
          <h3 className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-widest leading-tight z-10">Visitas Realizadas</h3>
          <p className="text-2xl md:text-4xl font-black text-slate-800 mt-1 z-10">{visitasConcluidas}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
          <h3 className="text-base md:text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <div className="w-1 h-5 bg-brand-primary rounded-full"></div>
            Volume de PAFs no Período
          </h3>
          <div className="h-[250px] md:h-[300px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 700 }} />
                  <Bar dataKey="Criados" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={window.innerWidth < 768 ? 15 : 30} />
                  <Bar dataKey="Encerrados" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={window.innerWidth < 768 ? 15 : 30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                Nenhum dado no período.
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <h3 className="text-base md:text-lg font-bold text-slate-800 mb-6">Status dos Planos</h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            {totalCriados > 0 ? (
               <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
               <PieChart>
                 <Pie
                   data={statusData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   fill="#8884d8"
                   paddingAngle={8}
                   dataKey="value"
                   label={({name, percent}) => window.innerWidth < 768 ? "" : `${name} ${(percent * 100).toFixed(0)}%`}
                 >
                   {statusData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                   ))}
                 </Pie>
                 <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                 <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
               </PieChart>
             </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-sm italic">Sem dados registrados.</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
        {/* Gráfico de Complexidade */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
          <div className="mb-6">
            <h3 className="text-base md:text-lg font-bold text-slate-800">Serviços por Complexidade</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Nível de Proteção Social</p>
          </div>

          <div className="h-[250px] w-full">
            {filteredPafs.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart 
                  data={servicosData} 
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#475569', fontWeight: 700, fontSize: 11}} 
                    width={100}
                  />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Bar 
                    dataKey="value" 
                    name="PAFs" 
                    radius={[0, 4, 4, 0]} 
                    barSize={24} 
                  >
                    {servicosData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Sem dados.</div>
            )}
          </div>
        </div>

        {/* Gráfico de Prioridade */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
          <div className="mb-6">
            <h3 className="text-base md:text-lg font-bold text-slate-800">Distribuição por Prioridade</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Baseado em Vulnerabilidades</p>
          </div>

          <div className="h-[250px] w-full flex items-center justify-center">
            {totalCriados > 0 ? (
               <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
               <PieChart>
                 <Pie
                   data={prioridadeData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={8}
                   dataKey="value"
                   label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                   labelLine={false}
                 >
                   {prioridadeData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                   ))}
                 </Pie>
                 <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                 <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
               </PieChart>
             </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-sm italic">Sem dados.</div>
            )}
          </div>
        </div>

        {/* Top Vulnerabilidades */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
          <div className="mb-6">
            <h3 className="text-base md:text-lg font-bold text-slate-800">Status de Visitas</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Estatísticas do novo sistema de visitas</p>
          </div>

          <div className="space-y-4">
            {visitasData.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-slate-600">
                  <span className="truncate max-w-[80%]">{item.name}</span>
                  <span>{item.value}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${allVisitas.length > 0 || visitasAgendadasFuturas > 0 ? (item.value / (allVisitas.length + visitasAgendadasFuturas)) * 100 : 0}%` }}
                    style={{ backgroundColor: item.color }}
                    className="h-full"
                  />
                </div>
              </div>
            ))}
            {allVisitas.length === 0 && visitasAgendadasFuturas === 0 && (
              <div className="py-12 text-center text-slate-400 text-sm italic">Nenhuma visita registrada.</div>
            )}
          </div>
        </div>

        {/* Top Vulnerabilidades */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
          <div className="mb-6">
            <h3 className="text-base md:text-lg font-bold text-slate-800">Principais Demandas</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Vulnerabilidades Mais Recorrentes</p>
          </div>

          <div className="space-y-4">
            {vulnData.length > 0 ? (
              vulnData.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold text-slate-600">
                    <span className="truncate max-w-[80%]">{item.name}</span>
                    <span>{item.value} {item.value === 1 ? 'Família' : 'Famílias'}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${((item.value as number) / totalCriados) * 100}%` }}
                      className="h-full bg-brand-primary"
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-sm italic">Nenhuma vulnerabilidade registrada.</div>
            )}
          </div>
        </div>
      </div>

      {/* Tabela de Detalhamento de Serviços e Contato */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base md:text-lg font-bold text-slate-800">Uso de Serviços</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Complexidade do atendimento</p>
            </div>
          </div>
          <div className="p-4">
             <div className="space-y-4">
                {servicosData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100/50">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-xs font-bold text-slate-700">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-black text-slate-800">{item.value}</span>
                      <span className="text-[10px] font-bold text-slate-400">{totalCriados > 0 ? ((item.value / totalCriados) * 100).toFixed(1) + '%' : '0%'}</span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 border-b border-slate-100">
            <h3 className="text-base md:text-lg font-bold text-slate-800">Abrangência de Contatos</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Percentual de cadastros com contatos ativos</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Famílias com Telefone</span>
                <span>{totalCriados > 0 ? ((temTelefone / totalCriados) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${totalCriados > 0 ? (temTelefone / totalCriados) * 100 : 0}%` }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Famílias com E-mail</span>
                <span>{totalCriados > 0 ? ((temEmail / totalCriados) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${totalCriados > 0 ? (temEmail / totalCriados) * 100 : 0}%` }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Cadastro com Endereço</span>
                <span>{totalCriados > 0 ? ((temEndereco / totalCriados) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: `${totalCriados > 0 ? (temEndereco / totalCriados) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
