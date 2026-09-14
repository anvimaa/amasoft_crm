import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CommercialProposal, CompanyProfile } from '../types/crm';
import { formatKz } from './format';

export function generateProposalPDF(
	proposal: CommercialProposal,
	company: CompanyProfile,
	autoDownload = true
): jsPDF {
	const doc = new jsPDF({
		orientation: 'portrait',
		unit: 'mm',
		format: 'a4'
	});

	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();
	const margin = 15;
	const contentWidth = pageWidth - margin * 2;

	// Brand Colors (RGB)
	const colorDark: [number, number, number] = [24, 24, 27]; // Zinc 900
	const colorMuted: [number, number, number] = [113, 113, 122]; // Zinc 500
	const colorSubtle: [number, number, number] = [228, 228, 231]; // Zinc 200
	const colorEmerald: [number, number, number] = [5, 150, 105]; // Emerald 600
	const colorCardBg: [number, number, number] = [250, 250, 250];

	let currentY = margin;

	// 1. HEADER SECTION
	// Left: Company Info
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(16);
	doc.setTextColor(...colorDark);
	doc.text(company.name || 'Amasoft Technologies', margin, currentY + 5);

	doc.setFont('helvetica', 'italic');
	doc.setFontSize(8.5);
	doc.setTextColor(...colorMuted);
	doc.text(company.slogan || 'Soluções Tecnológicas e Consultoria B2B', margin, currentY + 10);

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(8);
	doc.setTextColor(80, 80, 80);
	const companyContactLines = [
		`NIF: ${company.nif || 'Não informado'}`,
		`Tel: ${company.phone || '-'} | Email: ${company.email || '-'}`,
		company.website ? `Website: ${company.website}` : '',
		company.address ? `${company.address}${company.city ? ', ' + company.city : ''}` : ''
	].filter(Boolean);

	let compLineY = currentY + 15;
	for (const line of companyContactLines) {
		doc.text(line, margin, compLineY);
		compLineY += 4;
	}

	// Right: Proposal Meta Badge
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(14);
	doc.setTextColor(...colorDark);
	doc.text('PROPOSTA COMERCIAL', pageWidth - margin, currentY + 5, { align: 'right' });

	// Proposal Code Badge
	doc.setFillColor(...colorDark);
	doc.roundedRect(pageWidth - margin - 46, currentY + 8, 46, 7, 1.5, 1.5, 'F');
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(9);
	doc.setTextColor(255, 255, 255);
	doc.text(proposal.code, pageWidth - margin - 23, currentY + 12.8, { align: 'center' });

	// Meta info
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(8);
	doc.setTextColor(...colorMuted);
	doc.text(`Data de Emissão: ${proposal.issueDate}`, pageWidth - margin, currentY + 20, { align: 'right' });
	doc.text(`Válida até: ${proposal.validUntil}`, pageWidth - margin, currentY + 24.5, { align: 'right' });
	
	const statusLabels: Record<string, string> = {
		draft: 'RASCUNHO',
		sent: 'ENVIADA',
		accepted: 'ACEITE',
		rejected: 'RECUSADA'
	};
	doc.setFont('helvetica', 'bold');
	doc.setTextColor(...colorEmerald);
	doc.text(`Estado: ${statusLabels[proposal.status] || 'EMITIDA'}`, pageWidth - margin, currentY + 29, { align: 'right' });

	currentY = Math.max(compLineY + 2, currentY + 34);

	// Divider
	doc.setDrawColor(...colorSubtle);
	doc.setLineWidth(0.4);
	doc.line(margin, currentY, pageWidth - margin, currentY);
	currentY += 6;

	// 2. CLIENT RECIPIENT BOX
	doc.setFillColor(...colorCardBg);
	doc.setDrawColor(...colorSubtle);
	doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'FD');

	// Left Box Header
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(7.5);
	doc.setTextColor(...colorMuted);
	doc.text('DESTINATÁRIO / DADOS DO CLIENTE', margin + 4, currentY + 5.5);

	// Client Name
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(11);
	doc.setTextColor(...colorDark);
	doc.text(proposal.leadTitle, margin + 4, currentY + 11.5);

	// Client details
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(8);
	doc.setTextColor(70, 70, 70);
	const leadInfo1 = `Decisor / Contacto: ${proposal.leadContact || 'Direção Comercial'}${proposal.leadPhone ? ' (' + proposal.leadPhone + ')' : ''}`;
	const leadInfo2 = `Sector: ${proposal.leadCategory || 'Prestação de Serviços'}${proposal.leadCity ? ' | Local: ' + proposal.leadCity : ''}`;
	doc.text(leadInfo1, margin + 4, currentY + 16.5);
	doc.text(leadInfo2, margin + 4, currentY + 20.5);

	if (proposal.leadNif) {
		doc.text(`NIF Cliente: ${proposal.leadNif}`, pageWidth - margin - 4, currentY + 11.5, { align: 'right' });
	}

	currentY += 30;

	// 3. PROPOSAL ITEMS TABLE
	const tableHeaders = [
		[
			{ content: '#', styles: { halign: 'center' as const } },
			{ content: 'DESCRIÇÃO DOS SERVIÇOS / PRODUTOS', styles: { halign: 'left' as const } },
			{ content: 'QTD', styles: { halign: 'center' as const } },
			{ content: 'PREÇO UNIT. (KZ)', styles: { halign: 'right' as const } },
			{ content: 'SUBTOTAL (KZ)', styles: { halign: 'right' as const } }
		]
	];

	const tableData = proposal.items.map((item, idx) => [
		{ content: String(idx + 1), styles: { halign: 'center' as const } },
		{ content: item.description, styles: { halign: 'left' as const } },
		{ content: String(item.quantity), styles: { halign: 'center' as const } },
		{ content: formatKz(item.unitPrice), styles: { halign: 'right' as const } },
		{ content: formatKz(item.total), styles: { halign: 'right' as const, fontStyle: 'bold' as const } }
	]);

	autoTable(doc, {
		startY: currentY,
		margin: { left: margin, right: margin },
		head: tableHeaders,
		body: tableData,
		theme: 'grid',
		styles: {
			font: 'helvetica',
			fontSize: 8.5,
			cellPadding: 3.2,
			lineColor: colorSubtle,
			lineWidth: 0.2
		},
		headStyles: {
			fillColor: colorDark,
			textColor: [255, 255, 255],
			fontStyle: 'bold',
			fontSize: 8
		},
		alternateRowStyles: {
			fillColor: [252, 252, 252]
		},
		columnStyles: {
			0: { cellWidth: 10 },
			1: { cellWidth: 'auto' },
			2: { cellWidth: 16 },
			3: { cellWidth: 38 },
			4: { cellWidth: 40 }
		}
	});

	// Get final Y from table
	const lastAutoTable = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable;
	currentY = lastAutoTable ? lastAutoTable.finalY + 6 : currentY + 40;

	// Check if we need a new page for totals & terms
	if (currentY + 80 > pageHeight - margin) {
		doc.addPage();
		currentY = margin;
	}

	// 4. FINANCIAL SUMMARY (Right-aligned)
	const summaryWidth = 85;
	const summaryX = pageWidth - margin - summaryWidth;

	doc.setFillColor(...colorCardBg);
	doc.setDrawColor(...colorSubtle);
	doc.roundedRect(summaryX, currentY, summaryWidth, 26, 1.5, 1.5, 'FD');

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(8.5);
	doc.setTextColor(80, 80, 80);
	doc.text('Subtotal:', summaryX + 4, currentY + 6);
	doc.text(formatKz(proposal.subtotal), pageWidth - margin - 4, currentY + 6, { align: 'right' });

	const taxLabel = proposal.taxPercent > 0 ? `IVA (${proposal.taxPercent}%):` : 'IVA (Isento Art. 12.º):';
	doc.text(taxLabel, summaryX + 4, currentY + 12);
	doc.text(formatKz(proposal.taxAmount), pageWidth - margin - 4, currentY + 12, { align: 'right' });

	// Total Row with Highlight
	doc.setFillColor(...colorDark);
	doc.roundedRect(summaryX + 2, currentY + 16, summaryWidth - 4, 8, 1, 1, 'F');
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(9.5);
	doc.setTextColor(255, 255, 255);
	doc.text('TOTAL GERAL:', summaryX + 5, currentY + 21.5);
	doc.text(formatKz(proposal.total), pageWidth - margin - 5, currentY + 21.5, { align: 'right' });

	// 5. COMMERCIAL TERMS & BANK DETAILS (Left side of Summary or Below)
	const termsWidth = contentWidth - summaryWidth - 6;
	doc.setFillColor(...colorCardBg);
	doc.setDrawColor(...colorSubtle);
	doc.roundedRect(margin, currentY, termsWidth, 26, 1.5, 1.5, 'FD');

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(7.5);
	doc.setTextColor(...colorMuted);
	doc.text('CONDIÇÕES COMERCIAIS & PAGAMENTO', margin + 4, currentY + 5.5);

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(7.5);
	doc.setTextColor(60, 60, 60);
	doc.text(`Condições: ${proposal.paymentTerms || '50% na adjudicação / 50% na entrega'}`, margin + 4, currentY + 10.5);
	doc.text(`Prazo de Entrega: ${proposal.deliveryTerms || 'Imediato / A combinar'}`, margin + 4, currentY + 15);
	
	const ibanText = company.bankIban || proposal.bankDetails || 'Solicitar coordenadas na aceitação';
	const bankText = company.bankName ? `${company.bankName} · ` : '';
	doc.setFont('helvetica', 'bold');
	doc.text(`IBAN: ${bankText}${ibanText}`, margin + 4, currentY + 20);

	currentY += 34;

	// 6. NOTES (if any)
	if (proposal.notes && proposal.notes.trim()) {
		doc.setFont('helvetica', 'italic');
		doc.setFontSize(7.5);
		doc.setTextColor(...colorMuted);
		const splitNotes = doc.splitTextToSize(`Observações: ${proposal.notes}`, contentWidth);
		doc.text(splitNotes, margin, currentY);
		currentY += splitNotes.length * 3.5 + 4;
	}

	// 7. SIGNATURES AREA
	if (currentY + 38 > pageHeight - margin) {
		doc.addPage();
		currentY = margin + 10;
	} else {
		currentY += 6;
	}

	const sigBoxWidth = (contentWidth - 10) / 2;
	
	// Left Signature (Company)
	doc.setDrawColor(...colorSubtle);
	doc.setLineWidth(0.3);
	doc.line(margin, currentY + 18, margin + sigBoxWidth, currentY + 18);
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(8);
	doc.setTextColor(...colorDark);
	doc.text(`Por ${company.name || 'A Direção'}`, margin + sigBoxWidth / 2, currentY + 22, { align: 'center' });
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(7);
	doc.setTextColor(...colorMuted);
	doc.text('Departamento Comercial / Emitente', margin + sigBoxWidth / 2, currentY + 26, { align: 'center' });

	// Right Signature (Client Acceptance)
	doc.line(margin + sigBoxWidth + 10, currentY + 18, pageWidth - margin, currentY + 18);
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(8);
	doc.setTextColor(...colorDark);
	doc.text(`Por ${proposal.leadTitle}`, margin + sigBoxWidth + 10 + sigBoxWidth / 2, currentY + 22, { align: 'center' });
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(7);
	doc.setTextColor(...colorMuted);
	doc.text('Aceitação / Carimbo e Assinatura', margin + sigBoxWidth + 10 + sigBoxWidth / 2, currentY + 26, { align: 'center' });

	// 8. MULTI-PAGE NUMBERING & FOOTER
	const totalPages = doc.getNumberOfPages();
	for (let i = 1; i <= totalPages; i++) {
		doc.setPage(i);
		doc.setDrawColor(...colorSubtle);
		doc.setLineWidth(0.2);
		doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

		doc.setFont('helvetica', 'normal');
		doc.setFontSize(7);
		doc.setTextColor(...colorMuted);
		doc.text(
			`${company.name || 'Amasoft CRM'} · Proposta Comercial ${proposal.code} · Emitido em Kwanzas (Kz)`,
			margin,
			pageHeight - 6
		);
		doc.text(
			`Página ${i} de ${totalPages}`,
			pageWidth - margin,
			pageHeight - 6,
			{ align: 'right' }
		);
	}

	// Trigger download if requested
	if (autoDownload && typeof window !== 'undefined') {
		const safeTitle = proposal.leadTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
		const filename = `Proposta_${proposal.code}_${safeTitle}.pdf`;
		doc.save(filename);
	}

	return doc;
}
