import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ErrorState } from '@/components/ErrorState';
import { Field } from '@/components/Field';
import { runPortScan } from '@/lib/api/diagnostics';
import { Status, Td, Th } from '@/components/diagnostics/tableParts';
import type { PortScanEntry, PortScanResult } from '@/types/diagnostics';

const STATE_TONE: Record<PortScanEntry['state'], 'ok' | 'bad' | 'warn'> = {
  open: 'ok',
  closed: 'bad',
  blocked: 'warn',
};

/**
 * TCP port scan of a single host. Defaults to the workshop NAS address so the
 * card is useful immediately.
 */
export function PortScanCard() {
  const [host, setHost] = useState('192.168.1.31');
  const [result, setResult] = useState<PortScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: runPortScan,
    onSuccess: (data) => {
      setResult(data);
      setError(null);
    },
    onError: (err: unknown) => {
      setResult(null);
      setError(err instanceof Error ? err.message : 'Could not scan this host.');
    },
  });

  const handleRun = () => {
    const clean = host.trim();
    if (!clean) {
      setError('Enter a host or IP to scan.');
      return;
    }
    mutation.mutate(clean);
  };

  return (
    <Card
      title="Port scan"
      subtitle="Which services answer on the selected host"
      action={
        <Button size="sm" loading={mutation.isPending} onClick={handleRun}>
          Scan
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <Field
          label="Host"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          placeholder="192.168.1.31"
          autoComplete="off"
          spellCheck={false}
        />

        {error ? (
          <ErrorState message={error} onRetry={handleRun} />
        ) : mutation.isPending ? (
          <span className="sr-only">Scanning ports</span>
        ) : result ? (
          <div className="-mx-2 overflow-x-auto px-2">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <Th>Port</Th>
                  <Th>Service</Th>
                  <Th>State</Th>
                </tr>
              </thead>
              <tbody>
                {result.ports.map((entry) => (
                  <tr
                    key={entry.port}
                    className="border-b border-border/60 last:border-0"
                  >
                    <Td mono>{entry.port}</Td>
                    <Td className="text-secondary">{entry.service}</Td>
                    <Td>
                      <Status tone={STATE_TONE[entry.state]}>{entry.state}</Status>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AppText variant="caption" className="block text-muted">
            Scan a host to list its open, closed and blocked ports.
          </AppText>
        )}
      </div>
    </Card>
  );
}