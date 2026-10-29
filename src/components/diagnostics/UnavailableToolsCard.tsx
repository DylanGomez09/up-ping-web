import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';

const TOOLS = [
  {
    name: 'ARP scan',
    reason:
      'Browsers cannot read the local ARP table or enumerate devices on your LAN.',
  },
  {
    name: 'Traceroute',
    reason:
      'Needs ICMP/UDP packets with custom TTLs; a web page can only make HTTP requests.',
  },
  {
    name: 'Port scan',
    reason:
      'Requires raw TCP/UDP sockets, which the browser sandbox does not expose.',
  },
] as const;

/**
 * Replaces the three diagnostics that a web app genuinely cannot perform.
 * No demo data is shown — the card explains the limitation instead.
 */
export function UnavailableToolsCard() {
  return (
    <Card
      title="Not available in the browser"
      subtitle="These checks need raw sockets or local network access"
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
        Run them from the native app or a local agent. UpPing Web only shows
        measurements it can actually make.
      </AppText>
    </Card>
  );
}
