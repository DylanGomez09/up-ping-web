import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { downloadBlob } from '@/lib/utils/download';
import { APP_VERSION } from '@/lib/config';
import type {
  ArpScanResult,
  LatencyBandwidthCorrelation,
  LossSlice,
  PortScanResult,
  TracerouteResult,
} from '@/types/diagnostics';

export interface PdfReportData {
  arp: ArpScanResult | null;
  traceroute: TracerouteResult | null;
  portScan: PortScanResult | null;
  bandwidth: LatencyBandwidthCorrelation | null;
  loss: LossSlice[];
}

/** Hex values resolved from the active theme; jsPDF cannot read CSS vars. */
export interface PdfPalette {
  primary: string;
  secondary: string;
  teal: string;
  border: string;
}

const PAGE_MARGIN = 14;

/** Hex -> [r, g, b] for jsPDF, which has no CSS variable support. */
function rgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

/** jsPDF-autotable records the last table's bottom edge on the doc instance. */
function lastTableY(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY;
}

/**
 * Builds the diagnostics report entirely client-side.
 *
 * The active theme palette is passed in because jsPDF cannot read CSS custom
 * properties — colours have to be resolved to hex before drawing.
 */
export function buildDiagnosticsPdf(
  data: PdfReportData,
  palette: PdfPalette,
  isDark: boolean
): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const [deepR, deepG, deepB] = rgb(palette.primary);
  const [tealR, tealG, tealB] = rgb(palette.teal);
  const [borderR, borderG, borderB] = rgb(palette.border);

  /* ---------- Header ---------- */
  doc.setFillColor(tealR, tealG, tealB);
  doc.rect(0, 0, pageWidth, 26, 'F');

  doc.setTextColor(deepR, deepG, deepB);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('UpPing diagnostics report', PAGE_MARGIN, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `Generated ${new Date().toLocaleString()} · UpPing v${APP_VERSION}${isDark ? ' · dark theme' : ''}`,
    PAGE_MARGIN,
    19
  );

  let y = 34;

  /* ---------- Section helper ---------- */
  const section = (title: string) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setTextColor(...rgb(palette.secondary));
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(title.toUpperCase(), PAGE_MARGIN, y);
    doc.setDrawColor(borderR, borderG, borderB);
    doc.setLineWidth(0.3);
    doc.line(PAGE_MARGIN, y + 2, pageWidth - PAGE_MARGIN, y + 2);
    y += 8;
  };

  /* ---------- Summary ---------- */
  section('Summary');

  const summaryRows: [string, string][] = [];
  if (data.bandwidth) {
    summaryRows.push(['Average latency', `${data.bandwidth.avg_latency_ms} ms`]);
    summaryRows.push([
      'Bandwidth',
      `↓ ${data.bandwidth.bandwidth.downlink_mbps ?? '—'} Mbps · ↑ ${data.bandwidth.bandwidth.uplink_mbps ?? '—'} Mbps`,
    ]);
    summaryRows.push(['Verdict', data.bandwidth.verdict]);
  }
  if (data.loss.length > 0) {
    summaryRows.push([
      'Packet loss',
      data.loss.map((s) => `${s.label}: ${s.value.toFixed(1)}%`).join(' · '),
    ]);
  }
  if (data.arp) {
    summaryRows.push([
      'ARP devices',
      `${data.arp.entries.length} found · ${data.arp.unauthorized.length} unauthorized`,
    ]);
  }
  if (data.traceroute) {
    summaryRows.push([
      'Traceroute',
      `${data.traceroute.hops.length} hops · cause: ${data.traceroute.cause}`,
    ]);
  }

  autoTable(doc, {
    startY: y,
    theme: isDark ? 'plain' : 'striped',
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [tealR, tealG, tealB], textColor: [deepR, deepG, deepB] },
    body: summaryRows,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
  });

  y = lastTableY(doc) + 8;

  /* ---------- ARP ---------- */
  if (data.arp) {
    section(`ARP scan — ${data.arp.scanned_subnet}`);
    autoTable(doc, {
      startY: y,
      theme: isDark ? 'plain' : 'striped',
      styles: { fontSize: 8.5, cellPadding: 2 },
      headStyles: { fillColor: [tealR, tealG, tealB], textColor: [deepR, deepG, deepB] },
      head: [['IP address', 'MAC', 'Hostname', 'Vendor', 'Status']],
      body: data.arp.entries.map((e) => [
        e.ip,
        e.mac,
        e.hostname ?? '—',
        e.vendor ?? '—',
        e.known ? 'Known' : 'Unauthorized',
      ]),
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    });
    y = lastTableY(doc) + 8;
  }

  /* ---------- Traceroute ---------- */
  if (data.traceroute) {
    section(`Traceroute — ${data.traceroute.target}`);
    autoTable(doc, {
      startY: y,
      theme: isDark ? 'plain' : 'striped',
      styles: { fontSize: 8.5, cellPadding: 2 },
      headStyles: { fillColor: [tealR, tealG, tealB], textColor: [deepR, deepG, deepB] },
      head: [['TTL', 'Address', 'Hostname', 'RTT']],
      body: data.traceroute.hops.map((hop) => [
        String(hop.ttl),
        hop.ip ?? '—',
        hop.hostname ?? (hop.gateway_break ? 'gateway' : '—'),
        hop.timed_out ? 'timeout' : `${hop.rtt_ms} ms`,
      ]),
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    });
    y = lastTableY(doc) + 8;
  }

  /* ---------- Port scan ---------- */
  if (data.portScan) {
    section(`Port scan — ${data.portScan.host}`);
    autoTable(doc, {
      startY: y,
      theme: isDark ? 'plain' : 'striped',
      styles: { fontSize: 8.5, cellPadding: 2 },
      headStyles: { fillColor: [tealR, tealG, tealB], textColor: [deepR, deepG, deepB] },
      head: [['Port', 'Service', 'State']],
      body: data.portScan.ports.map((p) => [String(p.port), p.service, p.state]),
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    });
    y = lastTableY(doc) + 8;
  }

  /* ---------- Footer on every page ---------- */
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setTextColor(...rgb(palette.secondary));
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(
      `UpPing · network diagnostics workshop · page ${page} of ${pages}`,
      PAGE_MARGIN,
      doc.internal.pageSize.getHeight() - 8
    );
  }

  return doc;
}

/** Builds the PDF and hands it to the browser as a download. */
export function downloadDiagnosticsPdf(
  data: PdfReportData,
  palette: PdfPalette,
  isDark: boolean
): void {
  const doc = buildDiagnosticsPdf(data, palette, isDark);
  const filename = `uppping-diagnostics-${new Date().toISOString().slice(0, 10)}.pdf`;
  downloadBlob(doc.output('blob'), filename);
}