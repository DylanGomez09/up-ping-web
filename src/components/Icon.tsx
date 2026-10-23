import type { ReactNode } from 'react';

export type IconName =
  | 'chart-bars'
  | 'clock'
  | 'gear'
  | 'user'
  | 'play'
  | 'stop'
  | 'trash'
  | 'download'
  | 'logout'
  | 'wifi'
  | 'moon'
  | 'sun'
  | 'check'
  | 'chevron-right'
  | 'radar'
  | 'activity'
  | 'server'
  | 'shield'
  | 'file';

export interface IconProps {
  name: IconName;
  /**
   * Defaults to `currentColor`, so icons inherit their colour from a Tailwind
   * text-* class on the surrounding element. Only the PDF/screenshot paths pass
   * an explicit value.
   */
  color?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

/**
 * Nineteen hand-drawn 24x24 stroke icons. Path data is fixed — do not swap in
 * an icon library, these are part of the product's visual identity.
 */
export function Icon({
  name,
  color = 'currentColor',
  size = 24,
  strokeWidth = 1.8,
  className,
}: IconProps) {
  const stroke = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    fill: 'none',
  } as const;

  let content: ReactNode = null;

  switch (name) {
    case 'chart-bars':
      content = (
        <>
          <path d="M5 20V10" {...stroke} />
          <path d="M12 20V4" {...stroke} />
          <path d="M19 20V14" {...stroke} />
        </>
      );
      break;
    case 'clock':
      content = (
        <>
          <circle cx="12" cy="12" r="9" {...stroke} />
          <path d="M12 7v5l3 2" {...stroke} />
        </>
      );
      break;
    case 'gear':
      content = (
        <>
          <circle cx="12" cy="12" r="3" {...stroke} />
          <path
            d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"
            {...stroke}
          />
        </>
      );
      break;
    case 'user':
      content = (
        <>
          <circle cx="12" cy="8" r="4" {...stroke} />
          <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" {...stroke} />
        </>
      );
      break;
    case 'play':
      content = <path d="M8 5.5v13l11-6.5z" fill={color} stroke="none" />;
      break;
    case 'stop':
      content = <path d="M6 6h12v12H6z" fill={color} stroke="none" />;
      break;
    case 'trash':
      content = (
        <>
          <path d="M4 7h16M9 7V5h6v2M6 7l1 14h10l1-14" {...stroke} />
          <path d="M10 11v6M14 11v6" {...stroke} />
        </>
      );
      break;
    case 'download':
      content = (
        <>
          <path d="M12 4v11M7 10l5 5 5-5" {...stroke} />
          <path d="M5 20h14" {...stroke} />
        </>
      );
      break;
    case 'logout':
      content = (
        <>
          <path d="M14 4H6v16h8" {...stroke} />
          <path d="M10 12h10M17 8l4 4-4 4" {...stroke} />
        </>
      );
      break;
    case 'wifi':
      content = (
        <>
          <path
            d="M2 9.5a14 14 0 0 1 20 0M5.5 13a9 9 0 0 1 13 0M9 16.5a4.5 4.5 0 0 1 6 0"
            {...stroke}
          />
          <circle cx="12" cy="20" r="1" fill={color} stroke="none" />
        </>
      );
      break;
    case 'moon':
      content = <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" {...stroke} />;
      break;
    case 'sun':
      content = (
        <>
          <circle cx="12" cy="12" r="4" {...stroke} />
          <path
            d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"
            {...stroke}
          />
        </>
      );
      break;
    case 'check':
      content = <path d="M5 13l4 4L19 7" {...stroke} />;
      break;
    case 'chevron-right':
      content = <path d="M9 6l6 6-6 6" {...stroke} />;
      break;
    case 'radar':
      content = (
        <>
          <circle cx="12" cy="12" r="9" {...stroke} />
          <circle cx="12" cy="12" r="5" {...stroke} />
          <path d="M12 12l5-5" {...stroke} />
        </>
      );
      break;
    case 'activity':
      content = <path d="M3 12h4l3-8 4 16 3-8h4" {...stroke} />;
      break;
    case 'server':
      content = (
        <>
          <path d="M4 4h16v7H4zM4 13h16v7H4z" {...stroke} />
          <path d="M8 7.5h.01M8 16.5h.01" stroke={color} strokeWidth={2.2} strokeLinecap="round" fill="none" />
        </>
      );
      break;
    case 'shield':
      content = <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" {...stroke} />;
      break;
    case 'file':
      content = (
        <>
          <path d="M6 3h8l4 4v14H6z" {...stroke} />
          <path d="M14 3v4h4" {...stroke} />
        </>
      );
      break;
    default:
      content = null;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={color === 'currentColor' ? undefined : { color }}
    >
      {content}
    </svg>
  );
}