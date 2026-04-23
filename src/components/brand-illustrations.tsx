import { useId } from "react";

type IllustrationProps = {
  className?: string;
};

function BaseFrame({
  className,
  children
}: IllustrationProps & {
  children: React.ReactNode;
}) {
  const id = useId();
  const strokeId = `${id}-stroke`;
  const glowId = `${id}-glow`;

  return (
    <svg
      aria-hidden="true"
      className={className ?? "size-24"}
      fill="none"
      viewBox="0 0 120 120"
    >
      <defs>
        <linearGradient id={strokeId} x1="14" x2="104" y1="12" y2="108">
          <stop offset="0" stopColor="#3df5a5" />
          <stop offset="0.5" stopColor="#55c8ff" />
          <stop offset="1" stopColor="#7e8bff" />
        </linearGradient>
        <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur result="blur" stdDeviation="2.2" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect
        fill="rgba(8,11,16,0.9)"
        height="88"
        rx="26"
        stroke={`url(#${strokeId})`}
        strokeOpacity="0.5"
        strokeWidth="2"
        width="88"
        x="16"
        y="16"
      />
      <rect
        fill="rgba(255,255,255,0.03)"
        height="68"
        rx="18"
        width="68"
        x="26"
        y="26"
      />
      <circle
        cx="89"
        cy="31"
        fill="#55c8ff"
        filter={`url(#${glowId})`}
        opacity="0.85"
        r="3.5"
      />
      {children}
    </svg>
  );
}

export function SearchShelfIllustration({ className }: IllustrationProps) {
  return (
    <BaseFrame className={className}>
      <path
        d="M38 43h44M38 58h31M38 73h24"
        stroke="rgba(247,251,255,0.28)"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <circle cx="75" cy="71" r="10" stroke="#55c8ff" strokeWidth="3" />
      <path d="m82 78 7 7" stroke="#55c8ff" strokeLinecap="round" strokeWidth="3" />
      <path d="M70 30h16" stroke="#3df5a5" strokeLinecap="round" strokeWidth="3" />
    </BaseFrame>
  );
}

export function CartOrbitIllustration({ className }: IllustrationProps) {
  return (
    <BaseFrame className={className}>
      <path
        d="M36 46h8l5 24h28l6-20H47"
        stroke="#f7fbff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <circle cx="56" cy="79" fill="#3df5a5" r="4.5" />
      <circle cx="78" cy="79" fill="#55c8ff" r="4.5" />
      <path
        d="M31 35c10-9 20-13 30-13 12 0 23 4 33 14"
        stroke="rgba(85,200,255,0.34)"
        strokeLinecap="round"
        strokeWidth="2.4"
      />
    </BaseFrame>
  );
}

export function AdminConsoleIllustration({ className }: IllustrationProps) {
  return (
    <BaseFrame className={className}>
      <rect
        x="34"
        y="34"
        width="52"
        height="34"
        rx="10"
        stroke="#f7fbff"
        strokeOpacity="0.7"
        strokeWidth="2.5"
      />
      <path
        d="M41 46h18M41 56h10M66 46h13M66 56h13"
        stroke="rgba(247,251,255,0.28)"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <path
        d="M43 79h34"
        stroke="#3df5a5"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <path
        d="m81 79 5-6"
        stroke="#55c8ff"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </BaseFrame>
  );
}

export function ProductPulseIllustration({ className }: IllustrationProps) {
  return (
    <BaseFrame className={className}>
      <rect
        x="37"
        y="34"
        width="46"
        height="30"
        rx="10"
        stroke="#f7fbff"
        strokeOpacity="0.72"
        strokeWidth="2.5"
      />
      <path
        d="M45 74c8 5 15 7 23 7 6 0 11-1 16-3"
        stroke="#3df5a5"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <path
        d="m68 40 4 8 9 1-7 5 2 9-8-5-8 5 2-9-7-5 9-1 4-8Z"
        fill="#55c8ff"
        fillOpacity="0.9"
      />
    </BaseFrame>
  );
}

export function LoadingDropIllustration({ className }: IllustrationProps) {
  return (
    <BaseFrame className={className}>
      <path
        d="M32 44h56"
        stroke="rgba(247,251,255,0.22)"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <rect
        x="36"
        y="50"
        width="48"
        height="24"
        rx="8"
        stroke="#F7FBFF"
        strokeOpacity="0.68"
        strokeWidth="2.6"
      />
      <path
        d="M40 84c8-5 15-7 23-7 7 0 14 2 21 6"
        stroke="#3df5a5"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <path
        d="M63 31h8l-6 15h9L56 62l6-13h-9l10-18Z"
        fill="#55c8ff"
        fillOpacity="0.92"
      />
      <circle cx="87" cy="31" r="4" fill="#3df5a5" opacity="0.9" />
    </BaseFrame>
  );
}

export function OrderSignalIllustration({ className }: IllustrationProps) {
  return (
    <BaseFrame className={className}>
      <path
        d="M36 42h24l8 8v26H36V42Z"
        stroke="#F7FBFF"
        strokeOpacity="0.74"
        strokeWidth="2.6"
      />
      <path d="M60 42v10h10" stroke="#F7FBFF" strokeOpacity="0.74" strokeWidth="2.6" />
      <path
        d="M42 61h20M42 69h14"
        stroke="rgba(247,251,255,0.28)"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <path
        d="M75 33c5 3 8 8 8 14 0 7-4 12-10 15"
        stroke="#55c8ff"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <path
        d="M30 84c7-5 14-7 23-7 9 0 16 2 23 7"
        stroke="#3df5a5"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </BaseFrame>
  );
}

export function BotSignalIllustration({ className }: IllustrationProps) {
  return (
    <BaseFrame className={className}>
      <rect
        x="36"
        y="36"
        width="48"
        height="34"
        rx="12"
        stroke="#F7FBFF"
        strokeOpacity="0.78"
        strokeWidth="2.6"
      />
      <path d="M54 49h4M66 49h4" stroke="#55c8ff" strokeLinecap="round" strokeWidth="4" />
      <path d="M53 61c4 2 10 2 14 0" stroke="#3df5a5" strokeLinecap="round" strokeWidth="3" />
      <path d="M60 28v8" stroke="#F7FBFF" strokeLinecap="round" strokeWidth="2.6" />
      <circle cx="60" cy="24" r="4" fill="#3df5a5" opacity="0.92" />
      <path
        d="M28 78c8-6 18-9 30-9 12 0 22 3 31 9"
        stroke="rgba(85,200,255,0.34)"
        strokeLinecap="round"
        strokeWidth="2.6"
      />
    </BaseFrame>
  );
}

export function CommerceSignalIllustration({ className }: IllustrationProps) {
  const id = useId();
  const strokeId = `${id}-commerce-stroke`;
  const glowId = `${id}-commerce-glow`;

  return (
    <svg
      aria-hidden="true"
      className={className ?? "commerce-signal-illustration"}
      fill="none"
      viewBox="0 0 220 120"
    >
      <defs>
        <linearGradient id={strokeId} x1="18" x2="202" y1="16" y2="104">
          <stop offset="0" stopColor="#3df5a5" />
          <stop offset="0.5" stopColor="#55c8ff" />
          <stop offset="1" stopColor="#ff4f9a" />
        </linearGradient>
        <filter id={glowId} x="-30%" y="-50%" width="160%" height="200%">
          <feGaussianBlur result="blur" stdDeviation="3" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        className="commerce-signal-path commerce-signal-path-a"
        d="M14 36h42l18 18h44l16-16h72"
        stroke={`url(#${strokeId})`}
        strokeLinecap="round"
        strokeWidth="3"
      />
      <path
        className="commerce-signal-path commerce-signal-path-b"
        d="M22 82h34l14-16h34l20 20h74"
        stroke={`url(#${strokeId})`}
        strokeLinecap="round"
        strokeWidth="3"
      />
      <g filter={`url(#${glowId})`}>
        <circle className="commerce-signal-dot commerce-signal-dot-a" cx="56" cy="36" fill="#3df5a5" r="4" />
        <circle className="commerce-signal-dot commerce-signal-dot-b" cx="118" cy="54" fill="#55c8ff" r="4" />
        <circle className="commerce-signal-dot commerce-signal-dot-c" cx="198" cy="38" fill="#ff4f9a" r="4" />
        <circle className="commerce-signal-dot commerce-signal-dot-d" cx="124" cy="86" fill="#3df5a5" r="4" />
      </g>
      <rect
        className="commerce-signal-core"
        fill="rgba(7,10,14,0.82)"
        height="34"
        rx="10"
        stroke={`url(#${strokeId})`}
        strokeOpacity="0.58"
        width="54"
        x="82"
        y="43"
      />
      <path
        className="commerce-signal-zap"
        d="M109 50l-9 16h11l-6 14 18-21h-11l8-9h-11Z"
        fill="#3df5a5"
        filter={`url(#${glowId})`}
      />
    </svg>
  );
}
