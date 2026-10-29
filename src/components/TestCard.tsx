import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { InfoChip } from '@/components/InfoChip';
import { AppText } from '@/components/AppText';
import { formatDateTime } from '@/lib/utils/format';
import type { TestResult } from '@/types/test';

export interface TestCardProps {
  test: TestResult;
  onDelete: (id: string) => void;
  deleting?: boolean;
}

function lossLabel(loss: number): { text: string; tone: 'ok' | 'warn' | 'bad' } {
  if (loss <= 0) {
    return { text: 'Sin pérdida', tone: 'ok' };
  }
  if (loss < 5) {
    return { text: `${loss.toFixed(1)}% de pérdida`, tone: 'warn' };
  }
  return { text: `${loss.toFixed(1)}% de pérdida`, tone: 'bad' };
}

const TONE_CLASS: Record<'ok' | 'warn' | 'bad', string> = {
  ok: 'text-teal',
  warn: 'text-warning',
  bad: 'text-danger',
};

/**
 * One saved ping run in the History list. The delete button is always visible
 * and asks for confirmation first.
 */
export function TestCard({ test, onDelete, deleting = false }: TestCardProps) {
  const loss = lossLabel(test.loss_percent);

  return (
    <div className="rounded-card border border-border bg-surface p-4 shadow-raised transition-shadow hover:shadow-card sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <AppText variant="subtitle" mono className="truncate text-primary">
              {test.target}
            </AppText>
            <AppText variant="caption" className="shrink-0 text-muted">
              {formatDateTime(test.started_at)}
            </AppText>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="inline-flex items-baseline gap-1">
              <AppText variant="label" mono className="text-primary">
                {test.avg_latency_ms} ms
              </AppText>
              <AppText variant="caption" className="text-muted">
                media
              </AppText>
            </span>

            <AppText variant="label" mono className={TONE_CLASS[loss.tone]}>
              {loss.text}
            </AppText>

            <AppText variant="caption" mono className="text-muted">
              {test.packet_count} sondas
            </AppText>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <InfoChip>{test.id}</InfoChip>

          <Button
            variant="danger-soft"
            size="sm"
            aria-label={`Borrar la prueba de ${test.target}`}
            disabled={deleting}
            onClick={() => {
              if (
                window.confirm(
                  `¿Borrar la prueba de ${test.target}? Esta acción no se puede deshacer.`
                )
              ) {
                onDelete(test.id);
              }
            }}
          >
            <Icon name="trash" size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
