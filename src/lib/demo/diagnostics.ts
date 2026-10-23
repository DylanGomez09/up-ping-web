import type {
  ArpScanResult,
  LatencyBandwidthCorrelation,
  LatencyPoint,
  LossSlice,
  PdfReportRef,
  PortScanResult,
  TracerouteResult,
} from '@/types/diagnostics';

const iso = (offsetMs = 0) => new Date(Date.now() - offsetMs).toISOString();

export function demoArpScan(): ArpScanResult {
  return {
    scanned_subnet: '192.168.1.0/24',
    entries: [
      { ip: '192.168.1.1', mac: 'AC:9B:0A:2F:11:01', hostname: 'router.lan', vendor: 'Ubiquiti', known: true },
      { ip: '192.168.1.12', mac: 'AC:9B:0A:2F:11:0C', hostname: 'workstation-01', vendor: 'Custom Build', known: true },
      { ip: '192.168.1.31', mac: 'AC:9B:0A:2F:11:1F', hostname: 'nas.local', vendor: 'Synology', known: true },
      { ip: '192.168.1.44', mac: 'AC:9B:0A:2F:11:2C', hostname: 'printer.lan', vendor: 'Brother', known: true },
      { ip: '192.168.1.77', mac: 'AC:9B:0A:2F:11:4D', hostname: 'unknown-77', vendor: null, known: false },
    ],
    duplicated_ips: [],
    unauthorized: [{ ip: '192.168.1.77', mac: 'AC:9B:0A:2F:11:4D', hostname: 'unknown-77' }],
    scanned_at: iso(),
  };
}

export function demoTraceroute(): TracerouteResult {
  return {
    target: '8.8.8.8',
    hops: [
      { ttl: 1, ip: '192.168.1.1', hostname: 'router.lan', rtt_ms: 0.9, timed_out: false, gateway_break: true },
      { ttl: 2, ip: '10.0.0.1', hostname: 'isp-edge.isp.net', rtt_ms: 11.4, timed_out: false },
      { ttl: 3, ip: '172.16.24.7', rtt_ms: 18.9, timed_out: false },
      { ttl: 4, ip: null, rtt_ms: null, timed_out: true },
      { ttl: 5, ip: '74.125.24.99', hostname: 'google-gw', rtt_ms: 24.2, timed_out: false },
    ],
    broke_at_hop: 4,
    cause: 'provider',
    finished_at: iso(),
  };
}

export function demoPortScan(): PortScanResult {
  return {
    host: '192.168.1.31',
    ports: [
      { port: 22, service: 'ssh', state: 'open' },
      { port: 80, service: 'http', state: 'open' },
      { port: 443, service: 'https', state: 'open' },
      { port: 445, service: 'smb', state: 'closed' },
      { port: 3389, service: 'rdp', state: 'blocked' },
    ],
    scanned_at: iso(),
  };
}

export function demoBandwidthCorrelation(): LatencyBandwidthCorrelation {
  return {
    avg_latency_ms: 22,
    bandwidth: {
      downlink_mbps: 312,
      uplink_mbps: 28,
      activity: 'download',
      measured_at: iso(),
    },
    verdict: 'ok',
    message: 'Latency stays flat while bandwidth is being consumed.',
  };
}

export function demoLatency24h(): LatencyPoint[] {
  return Array.from({ length: 24 }, (_, hour) => ({
    label: `${String(hour).padStart(2, '0')}:00`,
    ms: Math.round(18 + Math.sin(hour / 3.1) * 6 + (hour > 8 && hour < 18 ? 5 : 0)),
  }));
}

export function demoLossSlices(): LossSlice[] {
  return [
    { label: 'Delivered', value: 98.6, color: 'var(--c-teal)' },
    { label: 'Lost', value: 1.4, color: 'var(--c-danger)' },
  ];
}

export function demoPdfReport(): PdfReportRef {
  return {
    report_id: `demo-report-${Date.now()}`,
    title: 'UpPing diagnostic report',
    generated_at: iso(),
  };
}