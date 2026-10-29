export type HealthTone = 'ok' | 'warn' | 'bad';

export interface LatencyAssessment {
  tone: HealthTone;
  label: string;
  message: string;
}

/**
 * Plain-language verdict for a real probe run.
 *
 * Thresholds are looser than `ping` because every probe is a full HTTP round
 * trip (DNS + TCP + TLS + response). Loss is weighted heavily: a link that
 * drops probes is unhealthy even when the average RTT looks fine.
 */
export function assessLatency(
  avgMs: number,
  lossPercent: number
): LatencyAssessment {
  if (!Number.isFinite(avgMs) || avgMs <= 0) {
    return {
      tone: 'warn',
      label: 'Sin datos',
      message:
        'Todavía no hay sondas con respuesta para evaluar la conexión.',
    };
  }

  if (avgMs <= 150 && lossPercent < 1) {
    return {
      tone: 'ok',
      label: 'Saludable',
      message:
        'Latencia baja y sin pérdida apreciable. La conexión responde con soltura.',
    };
  }

  if (avgMs <= 300 && lossPercent < 5) {
    return {
      tone: 'warn',
      label: 'Disputada',
      message:
        'Latencia moderada o alguna sonda perdida. Puede notarse en videollamadas y juegos.',
    };
  }

  return {
    tone: 'bad',
    label: 'Congestionada',
    message:
      'Latencia alta o pérdida frecuente. Revisa la red local o consulta con tu proveedor.',
  };
}
