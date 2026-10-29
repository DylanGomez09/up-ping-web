export interface ArpEntry {
  ip: string;
  mac: string;
  hostname?: string;
  vendor?: string | null;
  /** Device recognized in the workshop inventory. */
  known?: boolean;
}

export interface ArpScanResult {
  scanned_subnet: string;
  entries: ArpEntry[];
  /** IPs that appear on more than one MAC (duplicate IP scenario). */
  duplicated_ips: string[];
  /** Devices detected but not authorized in the workshop. */
  unauthorized: ArpEntry[];
  scanned_at: string;
}

export interface TracerouteHop {
  ttl: number;
  ip: string | null;
  hostname?: string;
  /** null = no reply at this hop. */
  rtt_ms: number | null;
  timed_out: boolean;
  /** Communication cut at this hop (gateway/router). */
  gateway_break?: boolean;
}

export interface TracerouteResult {
  target: string;
  hops: TracerouteHop[];
  broke_at_hop?: number;
  /** Where the path broke: local network vs ISP/provider. */
  cause: 'local' | 'provider' | 'unknown';
  finished_at: string;
}

export interface PortScanEntry {
  port: number;
  service: string;
  state: 'open' | 'closed' | 'blocked';
}

export interface PortScanResult {
  host: string;
  ports: PortScanEntry[];
  scanned_at: string;
}

export interface BandwidthSnapshot {
  downlink_mbps?: number;
  uplink_mbps?: number;
  activity: 'idle' | 'download' | 'upload' | 'saturated';
  measured_at: string;
}

export interface LatencyBandwidthCorrelation {
  avg_latency_ms: number;
  bandwidth: BandwidthSnapshot;
  verdict: 'ok' | 'warning' | 'critical';
  message: string;
}

/** The two transfer phases the speed test can draw. */
export type SpeedPhase = 'download' | 'upload';

/**
 * One throughput reading taken while a transfer is in flight. Only used for
 * the live chart: the reported speed always comes from total bytes / total
 * time, never from these samples.
 */
export interface SpeedSample {
  phase: SpeedPhase;
  /** Seconds since the start of that phase. */
  t: number;
  /** Throughput of this interval, not a running average. */
  mbps: number;
}

export interface PdfReportRef {
  report_id: string;
  title: string;
  generated_at: string;
  /** Download URL served by the backend once available. */
  url?: string;
}

/** Data points rendered client-side for the live 24h latency preview. */
export interface LatencyPoint {
  label: string;
  ms: number;
}

export interface LossSlice {
  label: string;
  value: number;
  color: string;
}