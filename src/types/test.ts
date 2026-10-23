export interface TestRangeValues {
  interval_s: number;
  timeout_s: number;
}

export interface PingSample {
  seq: number;
  target: string;
  rtt_ms: number | null;
  timestamp: number;
}

export interface TestResult {
  id: string;
  target: string;
  started_at: string;
  duration_ms?: number;
  avg_latency_ms: number;
  packet_count: number;
  loss_percent: number;
  rtts: PingSample[];
}