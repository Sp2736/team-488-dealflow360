// src/demo/clientExport.ts
/**
 * Client-side PDF and XLS export generators for static demo.
 * Uses dynamic imports for jspdf and exceljs so they are never in the initial bundle.
 */

export interface ExportReportData {
  period: string;
  summary: {
    quotesCreated: number;
    avgApprovalHours: number;
    topUpsoldProduct: string;
    bottlenecks: Array<{ role: string; pendingNow: number; avgWaitHours: number }>;
  } | null;
  filters?: {
    repName?: string;
    statusName?: string;
    productName?: string;
  };
}

export async function exportReportPdf(data: ExportReportData): Promise<void> {
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  const doc = new jsPDF();
  const summary = data.summary;

  // Header branding
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, 210, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('DEALFLOW360 · EXECUTIVE REPORT', 14, 16);

  // Metadata
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);
  doc.text(`Period: ${data.period.replace('_', ' ').toUpperCase()}`, 14, 38);

  // Summary Metrics
  const summaryRows = [
    ['Total Quotations Created', String(summary?.quotesCreated ?? 0)],
    ['Average Approval Time', `${summary?.avgApprovalHours ?? 0} hrs`],
    ['Top Performing Upsell Product', summary?.topUpsoldProduct || 'N/A'],
  ];

  (doc as any).autoTable({
    startY: 46,
    head: [['KPI Metric', 'Value']],
    body: summaryRows,
    theme: 'grid',
    headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
  });

  // Bottlenecks Table
  const finalY = (doc as any).lastAutoTable?.finalY || 80;
  doc.setFontSize(12);
  doc.text('Approval Workflow Bottlenecks', 14, finalY + 12);

  const bottleneckRows = (summary?.bottlenecks || []).map(b => [
    b.role,
    String(b.pendingNow),
    `${b.avgWaitHours} hrs`,
  ]);

  (doc as any).autoTable({
    startY: finalY + 16,
    head: [['Role / Department', 'Pending Queue Count', 'Avg Turnaround Wait']],
    body: bottleneckRows.length > 0 ? bottleneckRows : [['No active bottlenecks', '0', '0 hrs']],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
  });

  doc.save(`dealflow360-report-${data.period}.pdf`);
}

export async function exportReportXls(data: ExportReportData): Promise<void> {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const summary = data.summary;

  const sheet = workbook.addWorksheet('Summary Metrics');
  sheet.columns = [
    { header: 'Metric', key: 'metric', width: 35 },
    { header: 'Value', key: 'value', width: 25 },
  ];

  sheet.addRow({ metric: 'Reporting Period', value: data.period.replace('_', ' ').toUpperCase() });
  sheet.addRow({ metric: 'Total Quotations Created', value: summary?.quotesCreated ?? 0 });
  sheet.addRow({ metric: 'Average Approval Time (hrs)', value: summary?.avgApprovalHours ?? 0 });
  sheet.addRow({ metric: 'Top Upsold Product', value: summary?.topUpsoldProduct || 'N/A' });

  sheet.addRow({});
  sheet.addRow({ metric: 'Approval Role', value: 'Pending / Avg Wait' });

  for (const b of summary?.bottlenecks || []) {
    sheet.addRow({
      metric: b.role,
      value: `${b.pendingNow} pending (${b.avgWaitHours}h avg wait)`,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dealflow360-report-${data.period}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}

