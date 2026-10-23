import { useQuery } from '@tanstack/react-query';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { ErrorState } from '@/components/ErrorState';
import { InfoChip } from '@/components/InfoChip';
import { Skeleton } from '@/components/Skeleton';
import { getArpScan } from '@/lib/api/diagnostics';
import { Status, Td, Th } from '@/components/diagnostics/tableParts';

export interface ArpScanCardProps {
  onRescan: () => void;
}

/**
 * ARP table scan: lists devices on the local subnet and flags anything not
 * present in the workshop inventory.
 */
export function ArpScanCard({ onRescan }: ArpScanCardProps) {
  const query = useQuery({
    queryKey: ['diagnostics', 'arp'],
    queryFn: getArpScan,
  });

  return (
    <Card
      title="ARP scan"
      subtitle="Devices visible on the local subnet"
      action={
        <button
          type="button"
          onClick={onRescan}
          className="text-[13px] font-semibold text-teal transition-opacity hover:opacity-80"
        >
          Rescan
        </button>
      }
    >
      {query.isError ? (
        <ErrorState
          message="Could not read the ARP table."
          onRetry={() => void query.refetch()}
        />
      ) : query.data ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <InfoChip variant="highlight">{query.data.scanned_subnet}</InfoChip>
            <InfoChip>{query.data.entries.length} devices</InfoChip>
            {query.data.duplicated_ips.length > 0 && (
              <InfoChip>{query.data.duplicated_ips.length} duplicated IPs</InfoChip>
            )}
          </div>

          <div className="-mx-2 overflow-x-auto px-2">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <Th>IP address</Th>
                  <Th>MAC</Th>
                  <Th>Hostname</Th>
                  <Th>Vendor</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {query.data.entries.map((entry) => (
                  <tr
                    key={entry.ip}
                    className="border-b border-border/60 last:border-0"
                  >
                    <Td mono>{entry.ip}</Td>
                    <Td mono>{entry.mac}</Td>
                    <Td>{entry.hostname ?? '—'}</Td>
                    <Td className="text-secondary">{entry.vendor ?? '—'}</Td>
                    <Td>
                      {entry.known ? (
                        <Status tone="ok">Known</Status>
                      ) : (
                        <Status tone="bad">Unauthorized</Status>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {query.data.unauthorized.length > 0 && (
            <AppText variant="caption" className="block text-danger">
              {query.data.unauthorized.length}{' '}
              {query.data.unauthorized.length > 1 ? 'devices are' : 'device is'} not
              in the workshop inventory.
            </AppText>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      )}
    </Card>
  );
}