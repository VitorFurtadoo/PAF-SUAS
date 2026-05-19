export interface UserProfile {
  id?: string;
  email: string;
  name: string;
  role: 'TECNICO' | 'COORDENADOR' | 'ADMIN';
  unidadeCras: 'Morada do Sol' | 'Nagibão' | 'Camboatã' | 'Jaderlândia';
  createdAt?: any;
}

export interface FamilyMember {
  id: string;
  nome: string;
  nascimento: string;
  parentesco: string;
}

export interface Goal {
  id: string;
  meta: string;
  compromisso: string;
  observacoes: string;
  prazo: string;
  resultado: string;
}

export interface SituacaoFamiliar {
  id: string;
  situacao: string;
  membros: string;
  observacoes: string;
  impressaoDiagnostica: string;
  confirmado: boolean;
  vulnerabilidadeSuperada: boolean;
  dataSuperacao: string;
}

export interface FollowUpTask {
  id: string;
  title: string;
  description?: string;
  assignedTo: string; // User ID
  assignedToName: string;
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface HistoryEntry {
  id: string;
  date: any;
  userId: string;
  userName: string;
  action: string;
  summary?: string;
}

export interface PAFData {
  id?: string;
  numeroPlano: string;
  isDraft?: boolean;
  deletedAt?: string;
  unidadeCras: string;
  tecnicoId1?: string;
  tecnicoNome1?: string;
  tecnicoId2?: string;
  tecnicoNome2?: string;
  responsavel: string;
  telefone: string;
  telefone2?: string;
  emailContato?: string;
  cpf: string;
  endereco: string;
  dataInicial: string;
  situacao: string; // Em andamento, Concluído
  dataSituacao: string;
  periodicidade: string; // Semanal, Quinzenal, Mensal
  demandaInicial: string;
  formaAcesso: string;
  formaAcessoOutros: string;
  membros: FamilyMember[];
  history?: HistoryEntry[];
  tasks?: FollowUpTask[];
  
  // I - DIAGNÓSTICO
  vulnerabilidades: string[];
  vulnerabilidadesOutros?: string;
  
  // II - SOBRE O GRUPO FAMILIAR
  vulnerabilidadesMutiplasDescricao: string;
  potencialidadesGrupoFamiliar: string;
  situacoes: SituacaoFamiliar[];
  
  // III - SERVIÇOS
  servicosBasica: string[];
  servicosEspecialMedia: string[];
  servicosEspecialAlta: string[];
  
  // IV - PROGRAMAS E BENEFÍCIOS
  programasRendaParticipa: string; // "Sim" / "Não" / ""
  programasRendaQuais: string[];
  programasRendaOutros: string;
  beneficiosEventuaisRecebe: string; // "Sim" / "Não" / ""
  beneficiosEventuaisQuais: string[];
  beneficiosEventuaisOutros: string;
  
  // V - RECURSOS DO TERRITÓRIO
  recursosTerritorio: string[];
  recursosTerritorioOutros: string;
  
  // VI - METAS E EVOLUÇÃO
  metasFamilia: Goal[];
  metasEquipe: Goal[];
  
  // Estratégias e Eixos (Page 9)
  estrategias: string[];
  estrategiasOutras: string;
  estrategiasPrazo: string;
  eixosIntervencao: string[];
  eixosOutros: string;

  // Detalhes de Encaminhamento
  encaminhamentoSituacao?: string;
  encaminhamentoDestino?: string;
  encaminhamentoParaQuem?: string;
  
  // Participação
  participacaoFamilia: string;
  participacaoSimNao: string;
  participacaoExplicacao?: string;
  concordanciaFamilia: string;
  concordanciaPontosNao: string;
  concordanciaExplicacao?: string;
  
  // VII - INFORMAÇÕES EXTRAS
  informacoesNaoSolicitadas: string;
  
  // VIII - ELABORAÇÃO DO PLANO
  dataElaboracao: string;
  observacoesElaboracao: string;
  
  // ENCERRAMENTO
  dataEncerramento: string;
  motivoEncerramento: string;
  motivoOutros: string;
  createdAt?: any;
  updatedAt?: any;

  // AGENDAMENTO DE VISITA
  proximaVisitaData?: string;
  proximaVisitaHora?: string;
  proximaVisitaObservacoes?: string;
  visitasHistory?: VisitaHistory[];
}

export interface VisitaHistory {
  id: string;
  dataAgendada: string;
  horaAgendada?: string;
  observacoesOriginais?: string;
  status: 'concluida' | 'adiada' | 'cancelada' | 'agendada';
  dataRealizacao?: string;
  motivo?: string;
  novaData?: string;
  novaHora?: string;
  createdAt: string;
}

export interface AcaoCras {
  id?: string;
  unidadeCras: string;
  mesReferencia: string; // "Janeiro", "Fevereiro", etc.
  anoReferencia: number;
  userId: string;
  userName: string;
  createdAt: any;
  
  // Atividades
  acolhidasColetivas: number;
  atendimentosParticularizados: number;
  acaoParticularizadaDomicilio: number;
  visitasInstitucionais: number;
  gruposFamilias: number;
  encaminhamentosRedeSocio: number;
  encaminhamentosRedePoliticas: number;
  reunioes: number;
  acoesComunitarias: number;
  solicitacaoBeneficios: number;
  bpcIdoso: number;
  bpcPcd: number;
  orientacoesTecnicas: number;
  demandaReprimida?: number;

  // Famílias em Acompanhamento pelo PAIF
  familiasDesligadas: number;
  familiasAteMeioSalario: number;
  familiasMembrosBpc: number;
  familiasBeneficiariasPbf: number;
  beneficiarioBpcCadUnico: number;
  acoesRealizadas: string;
  
  // Columns from table
  numFamiliasEnvolvidas?: number;
  observacoes?: string;

  // Atendimentos por Eixo de Intervenção
  atendimentosSaude?: number;
  atendimentosEducacao?: number;
  atendimentosTrabalho?: number;
  atendimentosHabitacao?: number;
  atendimentosOutros?: number;
}

export interface Suggestion {
  id?: string;
  userId: string;
  userName: string;
  userUnit: string;
  area: 'Identificação' | 'Diagnóstico' | 'Metas' | 'Serviços' | 'Relatórios' | 'Ações CRAS' | 'Outros';
  description: string;
  status: 'PENDENTE' | 'ANALISE' | 'APROVADO' | 'REJEITADO' | 'IMPLEMENTADO';
  createdAt: any;
}

export interface EvolucaoAtendimento {
  id: string;
  data: string;
  tecnicoId: string;
  tecnicoNome: string;
  descricao: string;
  encaminhamentos?: string;
}

export interface FichaAtendimento {
  id?: string;
  unidadeCras: string;
  dataAtendimento: string;
  responsavelFamiliar: string;
  telefone?: string;
  contatoAlternativo?: string;
  cpf?: string;
  tecnicoId: string;
  tecnicoNome: string;
  coAutorId?: string;
  coAutorNome?: string;
  tipoAtendimento: string[];
  tipoAtendimentoOutro?: string;
  descricao: string;
  demandaInicial?: string;
  formaAcesso?: string;
  encaminhamentos?: string;
  descricaoEncaminhamento?: string;
  evolucoes?: EvolucaoAtendimento[];
  createdAt: any;
  updatedAt?: any;
}

export interface PlanejamentoInstrumental {
  id?: string;
  unidadeCras: 'Morada do Sol' | 'Nagibão' | 'Camboatã' | 'Jaderlândia' | 'Todos os CRAS' | 'Cras Camboatã' | 'Cras Morada do Sol' | 'Cras Jaderlândia' | 'Cras Nagibão';
  data: string; // ISO date string
  tematica: string;
  atividadeAcao: string;
  servico: 'PAIF' | 'SCFV' | 'SPSBDGC' | 'Outros';
  local: string;
  materiaisNecessarios: string;
  quantidadeMateriais: number;
  quantidadeFamilias: number;
  quantidadeParticipantes: number;
  quantidadeLanches: number;
  tecnicoId: string;
  tecnicoNome: string;
  observacoes?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface Notice {
  id?: string;
  title: string;
  content: string;
  type: 'INFO' | 'WARNING' | 'IMPORTANT' | 'ACHIEVEMENT';
  active: boolean;
  authorId: string;
  authorName: string;
  createdAt: any;
  updatedAt?: any;
}
