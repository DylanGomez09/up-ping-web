export {
  isDemoEnabled,
  isDemoSession,
  DEMO_EMAIL,
  DEMO_PASSWORD,
} from '@/lib/demo/env';

export { demoUser } from '@/lib/demo/user';

export {
  demoTestsPage,
  demoSaveTest,
  demoDeleteTest,
  demoExportCsv,
} from '@/lib/demo/tests';

export {
  demoArpScan,
  demoTraceroute,
  demoPortScan,
  demoBandwidthCorrelation,
  demoLatency24h,
  demoLossSlices,
  demoPdfReport,
} from '@/lib/demo/diagnostics';