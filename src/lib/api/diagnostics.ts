import { apiGet, apiPost } from '@/lib/api/client';
import {
  demoArpScan,
  demoBandwidthCorrelation,
  demoLatency24h,
  demoLossSlices,
  demoPdfReport,
  demoPortScan,
  demoTraceroute,
  isDemoSession,
} from '@/lib/demo';
import type {
  ArpScanResult,
  LatencyBandwidthCorrelation,
  LatencyPoint,
  LossSlice,
  PdfReportRef,
  PortScanResult,
  TracerouteResult,
} from '@/types/diagnostics';

// Each endpoint is stubbed to demo data while a demo session is active; the
// real calls below kick in once the FastAPI backend implements the contract.
// While the backend endpoints are still missing, a failed real call falls back
// to demo data so the UI stays testable.

async function withFallback<T>(real: () => Promise<T>, demo: () => T): Promise<T> {
  try {
    return await real();
  } catch (err) {
    console.warn(`[diagnostics] backend unavailable, using demo data: ${err}`);
    return demo();
  }
}

export async function getArpScan(): Promise<ArpScanResult> {
  if (isDemoSession()) return demoArpScan();
  return withFallback(
    () => apiGet<ArpScanResult>('/diagnostics/arp'),
    demoArpScan
  );
}

export async function runTraceroute(target: string): Promise<TracerouteResult> {
  if (isDemoSession()) {
    void target;
    return demoTraceroute();
  }
  return withFallback(
    () => apiPost<TracerouteResult>('/diagnostics/traceroute', { target }),
    () => demoTraceroute()
  );
}

/** Same shape as runTraceroute; kept for the summary query key. */
export function getTracerouteLatest(target: string): Promise<TracerouteResult> {
  return runTraceroute(target);
}

export async function runPortScan(host: string): Promise<PortScanResult> {
  if (isDemoSession()) {
    void host;
    return demoPortScan();
  }
  return withFallback(
    () => apiPost<PortScanResult>('/diagnostics/portscan', { host }),
    () => demoPortScan()
  );
}

export async function getBandwidthCorrelation(): Promise<LatencyBandwidthCorrelation> {
  if (isDemoSession()) return demoBandwidthCorrelation();
  return withFallback(
    () => apiGet<LatencyBandwidthCorrelation>('/diagnostics/bandwidth'),
    demoBandwidthCorrelation
  );
}

export async function getLatency24h(): Promise<LatencyPoint[]> {
  if (isDemoSession()) return demoLatency24h();
  return withFallback(
    () => apiGet<LatencyPoint[]>('/diagnostics/latency-24h'),
    demoLatency24h
  );
}

export async function getLossSlices(): Promise<LossSlice[]> {
  if (isDemoSession()) return demoLossSlices();
  return withFallback(
    () => apiGet<LossSlice[]>('/diagnostics/loss-slices'),
    demoLossSlices
  );
}

export async function generatePdfReport(): Promise<PdfReportRef> {
  if (isDemoSession()) return demoPdfReport();
  return withFallback(
    () => apiPost<PdfReportRef>('/diagnostics/pdf-report'),
    demoPdfReport
  );
}