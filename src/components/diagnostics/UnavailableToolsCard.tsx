import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';

const TOOLS = [
  {
    name: 'Escaneo ARP',
    reason:
      'El navegador no puede leer la tabla ARP local ni enumerar dispositivos de tu LAN.',
  },
  {
    name: 'Traceroute',
    reason:
      'Necesita paquetes ICMP/UDP con TTL personalizado; una página web solo puede hacer peticiones HTTP.',
  },
  {
    name: 'Escaneo de puertos',
    reason:
      'Requiere sockets TCP/UDP sin procesar, que el sandbox del navegador no expone.',
  },
] as const;

/**
 * Replaces the three diagnostics that a web app genuinely cannot perform.
 * No demo data is shown — the card explains the limitation instead.
 */
export function UnavailableToolsCard() {
  return (
    <Card
      title="No disponible en el navegador"
      subtitle="Estas comprobaciones necesitan sockets sin procesar o acceso a la red local"
    >
      <ul className="flex flex-col gap-3">
        {TOOLS.map((tool) => (
          <li key={tool.name} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-mark bg-tint text-muted"
            >
              <Icon name="wifi" size={16} />
            </span>
            <div className="min-w-0">
              <AppText variant="label" className="block text-primary">
                {tool.name}
              </AppText>
              <AppText variant="caption" className="mt-0.5 block text-muted">
                {tool.reason}
              </AppText>
            </div>
          </li>
        ))}
      </ul>

      <AppText variant="caption" className="mt-4 block text-muted">
        Ejecútalos desde la app nativa o un agente local. UpPing Web solo muestra
        mediciones que puede hacer de verdad.
      </AppText>
    </Card>
  );
}
