import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PAFData, FichaAtendimento } from '../types';

export const generatePAFPdf = async (data: PAFData) => {
  const doc = new jsPDF('p', 'pt', 'a4');

  let logoDataUrl: string | null = null;
  let logoWidth = 0;
  let logoHeight = 0;
  
  try {
    const imgResult = await new Promise<{ dataUrl: string, width: number, height: number }>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve({ dataUrl: canvas.toDataURL('image/png'), width: img.width, height: img.height });
        } else {
          reject(new Error('No canvas context'));
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = '/logo-semas.png';
    });
    
    logoDataUrl = imgResult.dataUrl;
    logoWidth = imgResult.width;
    logoHeight = imgResult.height;
  } catch (e) {
    console.warn('Could not load SEMAS logo:', e);
  }

  // Colors
  const primaryColor: [number, number, number] = [46, 125, 50]; // Dark green
  const secondaryColor: [number, number, number] = [232, 245, 233]; // Light green
  const textColor: [number, number, number] = [51, 51, 51];

  // Helper values
  const margin = 40;
  let y = margin;
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 70, 'F');
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("PLANO DE ACOMPANHAMENTO FAMILIAR - PAF", pageWidth / 2, 35, { align: "center" });
  doc.setFontSize(10);
  doc.text(`PLAN Nº: ${data.numeroPlano || "SEM NÚMERO"}`, pageWidth / 2, 55, { align: "center" });
  
  y = 90;
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  // Common Table Styles
  const tableStyles = {
    cellPadding: 6,
    fontSize: 10,
    textColor: textColor,
    lineColor: [220, 220, 220] as [number, number, number],
    lineWidth: 0.5,
  };

  const headStyles = {
    fillColor: primaryColor,
    textColor: [255, 255, 255] as [number, number, number],
    fontStyle: 'bold' as const,
    halign: 'left' as const,
  };

  const sectionHeadStyles = {
    fillColor: secondaryColor,
    textColor: primaryColor,
    fontStyle: 'bold' as const,
    halign: 'left' as const,
  };

  // Identificação
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: tableStyles,
    headStyles: headStyles,
    head: [['I - IDENTIFICAÇÃO E DADOS GERAIS']],
  });
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY,
    theme: 'grid',
    styles: { ...tableStyles, cellPadding: 5 },
    body: [
      [{ content: `Nº DO PLANO: ${data.numeroPlano || 'Não informado'}`, colSpan: 4, styles: { fontStyle: 'bold', fontSize: 11, fillColor: [240, 240, 240] } }],
      [{ content: `UNIDADE CRAS:\n${data.unidadeCras || 'Não informado'}`, colSpan: 2 }, { content: `DATA INICIAL DO PAF:\n${data.dataInicial || 'Não informado'}`, colSpan: 2 }],
      [{ content: `RESPONSÁVEL FAMILIAR:\n${data.responsavel || 'Não informado'}`, colSpan: 2 }, { content: `CPF:\n${data.cpf || 'Não informado'}`, colSpan: 1 }, { content: `TEL 1:\n${data.telefone || 'Não informado'}`, colSpan: 1 }],
      [{ content: `ENDEREÇO:\n${data.endereco || 'Não informado'}`, colSpan: 2 }, { content: `TEL 2 / RECADO:\n${data.telefone2 || 'Não informado'}`, colSpan: 1 }, { content: `E-MAIL:\n${data.emailContato || 'Não informado'}`, colSpan: 1 }],
      [`SITUAÇÃO DO PAF:\n${data.situacao || 'Não informado'}`, `DATA SITUAÇÃO:\n${data.dataSituacao || 'Não informado'}`, { content: `PERIODICIDADE:\n${data.periodicidade || 'Não informado'}`, colSpan: 2 }],
      [{ content: `DEMANDA INICIAL (MOTIVO):\n${data.demandaInicial || 'Não informado'}`, colSpan: 4 }],
      [{ content: `FORMA DE ACESSO:\n${data.formaAcesso || 'Não informado'}${data.formaAcessoOutros ? ` (${data.formaAcessoOutros})` : ''}`, colSpan: 4 }],
    ]
  });
  y = (doc as any).lastAutoTable.finalY + 15;

  // Membros
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: tableStyles,
    headStyles: sectionHeadStyles,
    head: [['INFORMAÇÕES DA FAMÍLIA - MEMBROS']],
  });
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY,
    theme: 'grid',
    styles: tableStyles,
    headStyles: { ...headStyles, fillColor: [100, 100, 100], halign: 'center' },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    head: [['NOME', 'DATA DE NASCIMENTO', 'PARENTESCO']],
    body: data.membros && data.membros.length > 0 
      ? data.membros.map(m => [m.nome || '-', m.nascimento || '-', m.parentesco || '-'])
      : [['Nenhum membro cadastrado', '', '']]
  });
  y = (doc as any).lastAutoTable.finalY + 20;

  // Diagnóstico / Vulnerabilidades
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: tableStyles,
    headStyles: headStyles,
    head: [['II - DIAGNÓSTICO E VULNERABILIDADES']],
    body: [
      [{ content: 'Principais Vulnerabilidades e Riscos Sociais:', styles: { fontStyle: 'bold' } }],
      [data.vulnerabilidades?.join(', ') || 'Nenhuma identificada'],
      [{ content: 'Múltiplas Expressões (Descrição):', styles: { fontStyle: 'bold' } }],
      [data.vulnerabilidadesMutiplasDescricao || 'Nenhuma descrição adicional'],
      [{ content: 'Potencialidades do Grupo Familiar:', styles: { fontStyle: 'bold' } }],
      [data.potencialidadesGrupoFamiliar || 'Nenhuma potencialidade informada']
    ]
  });
  y = (doc as any).lastAutoTable.finalY + 15;

  if (data.situacoes && data.situacoes.length > 0) {
    if (y > 700) { doc.addPage(); y = margin; }
    autoTable(doc, {
      startY: y,
      theme: 'grid',
      styles: tableStyles,
      headStyles: sectionHeadStyles,
      head: [['SITUAÇÕES ESPECÍFICAS']],
    });
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY,
      theme: 'grid',
      styles: { ...tableStyles, fontSize: 9 },
      headStyles: { ...headStyles, fillColor: [100, 100, 100] },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      head: [['SITUAÇÃO', 'MEMBRO(S)', 'OBSERVAÇÕES', 'IMPRESSÃO', 'CONFIRMADO', 'SUPERADA']],
      body: data.situacoes.map(sit => [
        sit.situacao || '-',
        sit.membros || '-',
        sit.observacoes || '-',
        sit.impressaoDiagnostica || '-',
        sit.confirmado ? 'Sim' : 'Não',
        sit.vulnerabilidadeSuperada ? `Sim (${sit.dataSuperacao || ''})` : 'Não'
      ])
    });
    y = (doc as any).lastAutoTable.finalY + 20;
  }

  if (y > 650) { doc.addPage(); y = margin; }

  // III - SERVICOS
  const servicosBasica = data.servicosBasica?.join(", ") || "Nenhum";
  const servicosMedia = data.servicosEspecialMedia?.join(", ") || "Nenhum";
  const servicosAlta = data.servicosEspecialAlta?.join(", ") || "Nenhum";
  
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: tableStyles,
    headStyles: headStyles,
    head: [['III - SERVIÇOS E RECURSOS UTILIZADOS']],
    body: [
      [{ content: 'Proteção Social Básica:', styles: { fontStyle: 'bold' } }],
      [servicosBasica],
      [{ content: 'Proteção Social Especial de Média Complexidade:', styles: { fontStyle: 'bold' } }],
      [servicosMedia],
      [{ content: 'Proteção Social Especial de Alta Complexidade:', styles: { fontStyle: 'bold' } }],
      [servicosAlta]
    ]
  });
  y = (doc as any).lastAutoTable.finalY + 15;

  // IV - PROGRAMAS E BENEFÍCIOS
  if (y > 650) { doc.addPage(); y = margin; }
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: tableStyles,
    headStyles: sectionHeadStyles,
    head: [['PROGRAMAS, PROJETOS E BENEFÍCIOS SOCIOASSISTENCIAIS']],
    body: [
      [`Participa de Programas de Relacionamento/Renda? ${data.programasRendaParticipa || 'Não informado'}`],
      [`Quais: ${data.programasRendaQuais?.join(', ') || 'Nenhum'} ${data.programasRendaOutros ? `(${data.programasRendaOutros})` : ''}`],
      [`Recebe Benefício Eventual? ${data.beneficiosEventuaisRecebe || 'Não informado'}`],
      [`Quais: ${data.beneficiosEventuaisQuais?.join(', ') || 'Nenhum'} ${data.beneficiosEventuaisOutros ? `(${data.beneficiosEventuaisOutros})` : ''}`]
    ]
  });
  y = (doc as any).lastAutoTable.finalY + 15;

  // V - RECURSOS
  if (y > 700) { doc.addPage(); y = margin; }
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: tableStyles,
    headStyles: sectionHeadStyles,
    head: [['RECURSOS QUE O TERRITÓRIO ONDE A FAMÍLIA RESIDE POSSUI']],
    body: [
      [`Recursos: ${data.recursosTerritorio?.join(', ') || 'Nenhum'} ${data.recursosTerritorioOutros ? `(${data.recursosTerritorioOutros})` : ''}`]
    ]
  });
  y = (doc as any).lastAutoTable.finalY + 20;

  if (y > 650) { doc.addPage(); y = margin; }

  // VI - METAS FAMILIA
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: tableStyles,
    headStyles: headStyles,
    head: [['VI - METAS, EVOLUÇÃO E ACOMPANHAMENTO (FAMÍLIA)']],
  });
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY,
    theme: 'grid',
    styles: { ...tableStyles, fontSize: 9 },
    headStyles: { ...headStyles, fillColor: [100, 100, 100] },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    head: [['META', 'COMPROMISSOS', 'OBSERVAÇÕES', 'PRAZO', 'RESULTADOS ALCANÇADOS']],
    body: data.metasFamilia && data.metasFamilia.length > 0 
      ? data.metasFamilia.map(m => [m.meta || '-', m.compromisso || '-', m.observacoes || '-', m.prazo || '-', m.resultado || '-'])
      : [['Nenhuma meta registrada', '', '', '', '']]
  });
  y = (doc as any).lastAutoTable.finalY + 15;

  // METAS EQUIPE
  if (y > 650) { doc.addPage(); y = margin; }
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: tableStyles,
    headStyles: sectionHeadStyles,
    head: [['METAS, EVOLUÇÃO E ACOMPANHAMENTO (EQUIPE TÉCNICA)']],
  });
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY,
    theme: 'grid',
    styles: { ...tableStyles, fontSize: 9 },
    headStyles: { ...headStyles, fillColor: [100, 100, 100] },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    head: [['META', 'COMPROMISSOS', 'OBSERVAÇÕES', 'PRAZO', 'RESULTADOS ALCANÇADOS']],
    body: data.metasEquipe && data.metasEquipe.length > 0 
      ? data.metasEquipe.map(m => [m.meta || '-', m.compromisso || '-', m.observacoes || '-', m.prazo || '-', m.resultado || '-'])
      : [['Nenhuma meta registrada', '', '', '', '']]
  });
  y = (doc as any).lastAutoTable.finalY + 20;

  // Estrategias e Eixos
  if (y > 650) { doc.addPage(); y = margin; }
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: tableStyles,
    headStyles: headStyles,
    head: [['ESTRATÉGIAS E EIXOS DE INTERVENÇÃO']],
    body: [
      [`Estratégias a serem adotadas / Ações realizadas: ${data.estrategias?.join(', ') || 'Nenhuma'} ${data.estrategiasOutras ? `(${data.estrategiasOutras})` : ''}\nPrazo: ${data.estrategiasPrazo || '-'}`],
      [`Eixos de intervenção / Ações de intervenção: ${data.eixosIntervencao?.join(', ') || 'Nenhum'} ${data.eixosOutros ? `(${data.eixosOutros})` : ''}`],
      [{ content: 'Acordos e Participação:', styles: { fontStyle: 'bold' } }],
      [`Houve participação da família na construção? ${data.participacaoFamilia || '-'}`],
      [`Houve concordância da família no cumprimento? ${data.concordanciaFamilia || '-'}`],
      [`Pontos discordantes: ${data.concordanciaPontosNao || 'Nenhum'}`]
    ]
  });
  y = (doc as any).lastAutoTable.finalY + 20;

  // Observações
  if (y > 700) { doc.addPage(); y = margin; }
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: tableStyles,
    headStyles: headStyles,
    head: [['VI - OBSERVAÇÕES E ENCERRAMENTO']],
    body: [
      [{ content: 'Informações não solicitadas e fornecidas espontaneamente:', styles: { fontStyle: 'bold' } }],
      [data.informacoesNaoSolicitadas || 'Nenhuma informação adicional.'],
      [{ content: 'Elaboração do Plano:', styles: { fontStyle: 'bold' } }],
      [`Data: ${data.dataElaboracao || '-'}`],
      [`Observações: ${data.observacoesElaboracao || 'Nenhuma'}`]
    ]
  });
  y = (doc as any).lastAutoTable.finalY + 15;

  if (y > 700) { doc.addPage(); y = margin; }
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: { ...tableStyles, fillColor: [250, 240, 240] },
    headStyles: { ...sectionHeadStyles, textColor: [180, 50, 50] },
    head: [['ENCERRAMENTO DO ACOMPANHAMENTO FAMILIAR']],
    body: [
      [`Data do Encerramento: ${data.dataEncerramento || 'Em aberto'}`],
      [`Motivo do Encerramento: ${data.motivoEncerramento || '-'}`],
      [`Outros motivos/Observações: ${data.motivoOutros || '-'}`]
    ]
  });
  y = (doc as any).lastAutoTable.finalY + 60;

  if (y > 750) { doc.addPage(); y = 80; }

  // Assinaturas
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  
  if (data.tecnicoId2 && data.tecnicoNome2) {
    // Two technicians
    doc.line(margin + 20, y, margin + 200, y);
    doc.line(pageWidth - margin - 200, y, pageWidth - margin - 20, y);
    
    doc.text(data.tecnicoNome1 || "Técnico 1", margin + 110, y + 15, { align: "center" });
    doc.text("EQUIPE TÉCNICA", margin + 110, y + 30, { align: "center" });
    
    doc.text(data.tecnicoNome2, pageWidth - margin - 110, y + 15, { align: "center" });
    doc.text("EQUIPE TÉCNICA", pageWidth - margin - 110, y + 30, { align: "center" });
    
    y += 100;
    if (y > 780) { doc.addPage(); y = 80; }
    
    doc.line(pageWidth / 2 - 100, y, pageWidth / 2 + 100, y);
    doc.text(data.responsavel || "Responsável Familiar", pageWidth / 2, y + 15, { align: "center" });
    doc.text("RESPONSÁVEL(S)/FAMÍLIA", pageWidth / 2, y + 30, { align: "center" });
  } else {
    // Single technician
    doc.line(pageWidth / 4 - 80, y, pageWidth / 4 + 80, y);
    doc.line((pageWidth / 4) * 3 - 80, y, (pageWidth / 4) * 3 + 80, y);
    
    y += 15;
    doc.text(data.tecnicoNome1 || "TÉCNICO DE REFERÊNCIA", pageWidth / 4, y, { align: "center" });
    doc.text("RESPONSÁVEL(S)/FAMÍLIA", (pageWidth / 4) * 3, y, { align: "center" });
  }

  // Add page numbers and watermark
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Watermark
    if (logoDataUrl && logoWidth > 0 && logoHeight > 0) {
      try {
        doc.setGState(new (doc as any).GState({opacity: 0.15}));
        const targetWidth = 350;
        const targetHeight = targetWidth * (logoHeight / logoWidth);
        const xPos = (pageWidth - targetWidth) / 2;
        const yPos = (doc.internal.pageSize.getHeight() - targetHeight) / 2;
        doc.addImage(logoDataUrl, 'PNG', xPos, yPos, targetWidth, targetHeight);
        doc.setGState(new (doc as any).GState({opacity: 1.0}));
      } catch (e) {
        console.warn('Watermark issue:', e);
      }
    }

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 20, { align: 'right' });
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, margin, doc.internal.pageSize.getHeight() - 20, { align: 'left' });
  }

  doc.save(`PAF_${data.cpf || 'Familia'}.pdf`);
}

export const generateAcoesCrasPdf = async (data: any) => {
  const doc = new jsPDF('p', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 60;

  // Header Box
  doc.setFillColor(235, 235, 235);
  doc.rect(margin, y, pageWidth - (margin * 2), 25, 'F');
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(`MÊS DE REFERÊNCIA: ${data.mesReferencia.toUpperCase()}/${data.anoReferencia}`, pageWidth / 2, y + 17, { align: 'center' });
  
  y += 35;

  // Info
  doc.setFontSize(10);
  doc.text(`EQUIPE: ${data.userName.toUpperCase()}`, margin, y);
  doc.text(`CRAS: ${data.unidadeCras.toUpperCase()}`, pageWidth - margin, y, { align: 'right' });

  y += 20;

  const tableData1 = [
    ['Acolhidas Coletivas', data.acolhidasColetivas || '0'],
    ['Atendimentos Particularizados', data.atendimentosParticularizados || '0'],
    ['Ação particularizada no domicílio', data.acaoParticularizadaDomicilio || '0'],
    ['Visitas Institucionais', data.visitasInstitucionais || '0'],
    ['Grupos de Famílias (Oficinas/ Paif)', data.gruposFamilias || '0'],
    ['Encaminhamentos para Rede Socioassistencial', data.encaminhamentosRedeSocio || '0'],
    ['Encaminhamentos para Rede de Politicas Publicas', data.encaminhamentosRedePoliticas || '0'],
    ['Reuniões', data.reunioes || '0'],
    ['Ações Comunitarias', data.acoesComunitarias || '0'],
    ['Solicitação de Benefícios Eventuais', data.solicitacaoBeneficios || '0'],
    ['BPC/IDOSO', data.bpcIdoso || '0'],
    ['BPC/PCD', data.bpcPcd || '0'],
    ['Orientações técnicas realizadas', data.orientacoesTecnicas || '0'],
    ['Quantitativo de demanda reprimida no mês de referência', data.demandaReprimida || '0']
  ];

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { cellPadding: 4, fontSize: 9 },
    head: [['TIPO DE ATIVIDADE', 'Nº de Atendimentos']],
    body: tableData1,
    columnStyles: {
      0: { cellWidth: 350 },
      1: { cellWidth: 100, halign: 'center' }
    }
  });

  y = (doc as any).lastAutoTable.finalY;

  const tableData2 = [
    ['Famílias desligadas', data.familiasDesligadas || '0'],
    ['Famílias com até ½ salário no Cad. Único', data.familiasAteMeioSalario || '0'],
    ['Famílias com membros com BPC', data.familiasMembrosBpc || '0'],
    ['Famílias beneficiárias do PBF', data.familiasBeneficiariasPbf || '0'],
    ['Beneficiário BPC encaminhado ao Cad. Único', data.beneficiarioBpcCadUnico || '0'],
    ['Ações realizadas', data.acoesRealizadas || '-']
  ];

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: [225, 225, 225], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { cellPadding: 4, fontSize: 9 },
    head: [['Famílias em Acompanhamento pelo PAIF', 'Nº de Atendimentos']],
    body: tableData2,
    columnStyles: {
      0: { cellWidth: 350 },
      1: { cellWidth: 100, halign: 'center' }
    }
  });

  y = (doc as any).lastAutoTable.finalY + 15;

  const tableData3 = [
    ['Saúde', data.atendimentosSaude || '0'],
    ['Educação', data.atendimentosEducacao || '0'],
    ['Trabalho', data.atendimentosTrabalho || '0'],
    ['Habitação', data.atendimentosHabitacao || '0'],
    ['Outros Eixos', data.atendimentosOutros || '0']
  ];

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: [255, 248, 230], textColor: [120, 90, 0], fontStyle: 'bold' },
    styles: { cellPadding: 4, fontSize: 9 },
    head: [['ATENDIMENTOS POR EIXO DE INTERVENÇÃO', 'Nº de Atendimentos']],
    body: tableData3,
    columnStyles: {
      0: { cellWidth: 350 },
      1: { cellWidth: 100, halign: 'center' }
    }
  });

  y = (doc as any).lastAutoTable.finalY + 20;

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: [225, 225, 225], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { cellPadding: 10, fontSize: 9 },
    head: [['Nº de Famílias Envolvidas', 'Observações']],
    body: [[data.numFamiliasEnvolvidas || '0', data.observacoes || '-']],
    columnStyles: {
      0: { cellWidth: 150, halign: 'center' },
      1: { cellWidth: 300 }
    }
  });

  doc.save(`Acoes_CRAS_${data.mesReferencia}_${data.anoReferencia}.pdf`);
};

export const generateFichaAtendimentoPdf = async (data: FichaAtendimento) => {
  const doc = new jsPDF('p', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  let logoDataUrl: string | null = null;
  let logoWidth = 0;
  let logoHeight = 0;

  try {
    const imgResult = await new Promise<{ dataUrl: string, width: number, height: number }>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve({ dataUrl: canvas.toDataURL('image/png'), width: img.width, height: img.height });
        } else {
          reject(new Error('No canvas context'));
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = '/logo-semas.png';
    });
    logoDataUrl = imgResult.dataUrl;
    logoWidth = imgResult.width;
    logoHeight = imgResult.height;
  } catch (e) {
    console.warn('Could not load logo:', e);
  }

  // Colors
  const primaryColor: [number, number, number] = [0, 124, 192]; // Brand primary blue
  const brandSecondary: [number, number, number] = [0, 56, 101]; // Brand secondary blue
  const textColor: [number, number, number] = [30, 41, 59]; // Slate 800
  const lightBg: [number, number, number] = [248, 250, 252]; // Slate 50

  // --- HEADER SECTION (CLEAN WHITE) ---
  // Accent Top Line
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Logo (Top Left)
  if (logoDataUrl && logoWidth > 0 && logoHeight > 0) {
    try {
      const hHeight = 50;
      const hWidth = hHeight * (logoWidth / logoHeight);
      doc.addImage(logoDataUrl, 'PNG', margin, 20, hWidth, hHeight);
    } catch (e) {
      console.warn('Could not add logo to PDF header');
    }
  }

  // Header Text (Top Right)
  doc.setTextColor(brandSecondary[0], brandSecondary[1], brandSecondary[2]);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("FICHA DE ATENDIMENTO", pageWidth - margin, 40, { align: "right" });
  
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("SOCIOASSISTENCIAL", pageWidth - margin, 52, { align: "right" });
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(110, 110, 110);
  doc.text("PREFEITURA MUNICIPAL", pageWidth - margin, 65, { align: "right" });
  doc.text("SECRETARIA DE ASSISTÊNCIA SOCIAL", pageWidth - margin, 74, { align: "right" });

  // Divider Line
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(1);
  doc.line(margin, 85, pageWidth - margin, 85);
  
  y = 105;
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  // --- CONTENT SECTION ---
  
  // Section: Identification
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 6, font: 'helvetica', lineColor: [226, 232, 240], lineWidth: 0.5 },
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
    head: [['I. IDENTIFICAÇÃO DO ATENDIMENTO']],
    body: [
      [`UNIDADE CRAS: ${data.unidadeCras || '-'}`],
      [`DATA DO ATENDIMENTO: ${data.dataAtendimento.split('-').reverse().join('/')}`],
      [`TÉCNICO RESPONSÁVEL: ${data.tecnicoNome || '-'}`],
    ]
  });

  // Section: Citizen Data
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 15,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 6, lineColor: [226, 232, 240], lineWidth: 0.5 },
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
    head: [['II. DADOS DO CIDADÃO']],
    body: [
      [{ content: `NOME COMPLETO: ${data.responsavelFamiliar.toUpperCase() || '-'}`, styles: { fillColor: [241, 245, 249], fontStyle: 'bold' } }],
      [`CPF: ${data.cpf || '-'}`],
      [`TELEFONE DE CONTATO: ${data.telefone || '-'}${data.contatoAlternativo ? ` / ${data.contatoAlternativo}` : ''}`],
      [`DEMANDA INICIAL: ${data.demandaInicial || '-'}`],
      [`FORMA DE ACESSO: ${data.formaAcesso || '-'}`],
    ]
  });

  // Section: Type of Service
  const tiposArray = Array.isArray(data.tipoAtendimento) ? data.tipoAtendimento : [data.tipoAtendimento];
  const tiposStr = tiposArray.map(t => (t === 'Outro' && data.tipoAtendimentoOutro) ? `Outro: ${data.tipoAtendimentoOutro}` : t).join(', ');
  
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 15,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 6, lineColor: [226, 232, 240], lineWidth: 0.5 },
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
    head: [['III. TIPO DE ATENDIMENTO']],
    body: [[{ content: tiposStr || '-', styles: { fontStyle: 'bold', textColor: brandSecondary } }]]
  });

  // Section: Evolution
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 15,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 10, lineColor: [226, 232, 240], lineWidth: 0.5 },
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
    head: [['IV. DESCRIÇÃO / EVOLUÇÃO']],
    body: [[{ content: data.descricao || '-', styles: { minCellHeight: 120, halign: 'justify' } }]]
  });

  // Section: Referrals
  if (data.descricaoEncaminhamento || data.encaminhamentos) {
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 15,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 8, lineColor: [226, 232, 240], lineWidth: 0.5 },
      headStyles: { fillColor: brandSecondary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
      head: [['V. ENCAMINHAMENTOS E ORIENTAÇÕES']],
      body: [
        [{ content: `Especifique o Encaminhamento: ${data.descricaoEncaminhamento || 'N/A'}`, styles: { fillColor: lightBg } }],
        [{ content: `Encaminhamentos / Orientações Efetuadas: ${data.encaminhamentos || 'N/A'}`, styles: { fillColor: lightBg } }]
      ]
    });
  }

  y = (doc as any).lastAutoTable.finalY + 80;
  if (y > 750) { doc.addPage(); y = 80; }

  // --- SIGNATURE SECTION ---
  doc.setLineWidth(0.5);
  doc.setDrawColor(148, 163, 184); // Slate 400
  
  doc.line(margin, y, pageWidth / 2 - 20, y);
  doc.line(pageWidth / 2 + 20, y, pageWidth - margin, y);
  
  doc.setFontSize(9);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text(data.tecnicoNome || "Técnico de Referência", pageWidth / 4 + margin / 2, y + 15, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Assinatura do Técnico", pageWidth / 4 + margin / 2, y + 25, { align: "center" });
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(data.responsavelFamiliar || "Responsável Familiar", (pageWidth / 4) * 3 - margin / 2, y + 15, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Assinatura do Cidadão", (pageWidth / 4) * 3 - margin / 2, y + 25, { align: "center" });

  // Watermark and numbering
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    if (logoDataUrl && logoWidth > 0 && logoHeight > 0) {
      doc.setGState(new (doc as any).GState({opacity: 0.1}));
      const wWidth = 300;
      const wHeight = wWidth * (logoHeight / logoWidth);
      doc.addImage(logoDataUrl, 'PNG', pageWidth/2 - (wWidth/2), doc.internal.pageSize.getHeight()/2 - (wHeight/2), wWidth, wHeight);
      doc.setGState(new (doc as any).GState({opacity: 1.0}));
    }
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 20, { align: 'right' });
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, margin, doc.internal.pageSize.getHeight() - 20, { align: 'left' });
  }

  doc.save(`Ficha_${data.responsavelFamiliar.replace(/\s+/g, '_')}.pdf`);
};

export const generateAcoesCrasListPdf = async (acoes: any[], year: number, unidadedCras: string) => {
  const doc = new jsPDF('l', 'pt', 'a4'); // Landscape
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 50;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`RELATÓRIO MENSAL DE AÇÕES - CRAS ${unidadedCras.toUpperCase()}`, pageWidth / 2, y, { align: 'center' });
  
  y += 20;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Ano de Referência: ${year}`, pageWidth / 2, y, { align: 'center' });

  y += 30;

  const tableData = acoes.map(acao => [
    acao.mesReferencia,
    acao.acolhidasColetivas || 0,
    acao.atendimentosParticularizados || 0,
    acao.numFamiliasEnvolvidas || 0,
    (acao.atendimentosSaude || 0) + (acao.atendimentosEducacao || 0) + (acao.atendimentosTrabalho || 0) + (acao.atendimentosHabitacao || 0) + (acao.atendimentosOutros || 0),
    acao.userName
  ]);

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: [46, 125, 50], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { cellPadding: 5, fontSize: 8 },
    head: [['Mês', 'Acolhidas', 'Atend. Part.', 'Fams. PAIF', 'Total Eixos', 'Técnico']],
    body: tableData,
  });

  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, margin, doc.internal.pageSize.getHeight() - 20);
  doc.save(`Relatorio_Mensal_CRAS_${year}.pdf`);
};

