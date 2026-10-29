export type HealthTone = 'ok' | 'warn' | 'bad';

export interface LatencyAssessment {
  tone: HealthTone;
  label: string;
  message: string;
}

export interface ConnectionMetrics {
  avgMs: number;
  lossPercent: number;
  /** Measured downlink in Mbps. Omit when speed was not tested. */
  downlinkMbps?: number | null;
}

/**
 * Plain-language verdict for a real probe run, optionally combined with a
 * bandwidth measurement.
 *
 * Thresholds are looser than `ping` because every probe is a full HTTP round
 * trip (DNS + TCP + TLS + response). Loss is weighted heavily: a link that
 * drops probes is unhealthy even when the average RTT looks fine. The speed
 * thresholds only apply once a downlink figure exists, so the same function
 * serves the latency-only and the combined cases.
 */
export function assessConnection({
  avgMs,
  lossPercent,
  downlinkMbps,
}: ConnectionMetrics): LatencyAssessment {
  const speed =
    typeof downlinkMbps === 'number' &&
    Number.isFinite(downlinkMbps) &&
    downlinkMbps > 0
      ? downlinkMbps
      : null;
  const hasSpeed = speed !== null;

  if (!Number.isFinite(avgMs) || avgMs <= 0) {
    if (lossPercent >= 5) {
      return {
        tone: 'bad',
        label: 'Congestionada',
        message:
          'No hay respuestas a las sondas. Revisa la red local o consulta con tu proveedor.',
      };
    }

    return {
      tone: 'warn',
      label: 'Sin datos',
      message:
        'Todavía no hay sondas con respuesta para evaluar la conexión.',
    };
  }

  const critical =
    lossPercent >= 5 || avgMs > 300 || (hasSpeed && speed < 5);
  const warning =
    lossPercent >= 1 || avgMs > 150 || (hasSpeed && speed < 25);

  if (critical) {
    return {
      tone: 'bad',
      label: 'Congestionada',
      message: hasSpeed
        ? 'Latencia alta, pérdida o muy poco ancho de banda. Revisa la red local o consulta con tu proveedor.'
        : 'Latencia alta o pérdida frecuente. Revisa la red local o consulta con tu proveedor.',
    };
  }

  if (warning) {
    return {
      tone: 'warn',
      label: 'Disputada',
      message: hasSpeed
        ? 'Latencia moderada, pérdida o poco ancho de banda. Puede notarse en videollamadas y juegos.'
        : 'Latencia moderada o alguna sonda perdida. Puede notarse en videollamadas y juegos.',
    };
  }

  return {
    tone: 'ok',
    label: 'Saludable',
    message: hasSpeed
      ? 'Latencia baja, sin pérdida apreciable y buen ancho de banda. El enlace responde con soltura.'
      : 'Latencia baja y sin pérdida apreciable. La conexión responde con soltura.',
  };
}
