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
