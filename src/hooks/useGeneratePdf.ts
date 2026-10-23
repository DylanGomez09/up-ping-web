import { useCallback, useState } from 'react';
import type { PdfReportData } from '@/lib/pdf/diagnosticsPdf';
import { useTheme } from '@/hooks/useTheme';

/**
 * Wraps the client-side PDF generation with a busy flag, resolving the active
 * theme palette into the hex values jsPDF needs.
 *
 * jsPDF (and the html2canvas copy it bundles) weighs ~350 kB, so the module is
 * imported dynamically — it is only fetched when the user actually exports.
 */
export function useGeneratePdf() {
  const { tokens, isDark } = useTheme();
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (data: PdfReportData) => {
      setExporting(true);
      setError(null);
      try {
        const { downloadDiagnosticsPdf } = await import('@/lib/pdf/diagnosticsPdf');
        downloadDiagnosticsPdf(
          data,
          {
            primary: tokens['text-primary'],
            secondary: tokens['text-secondary'],
            teal: tokens.teal,
            border: tokens.border,
          },
          isDark
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Could not build the PDF report.'
        );
      } finally {
        setExporting(false);
      }
    },
    [tokens, isDark]
  );

  return { generate, exporting, error };
}