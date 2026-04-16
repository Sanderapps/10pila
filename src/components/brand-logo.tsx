import { useId } from "react";

type BrandLogoProps = {
  className?: string;
  variant?: "horizontal" | "compact" | "symbol";
  animated?: boolean;
};

function BrandSymbol({ animated = false }: { animated?: boolean }) {
  const id = useId();
  const shellId = `${id}-shell`;
  const strokeId = `${id}-stroke`;
  const glowId = `${id}-glow`;

  return (
    <svg
      aria-hidden="true"
      className={animated ? "brand-logo-svg brand-logo-svg-animated" : "brand-logo-svg"}
      viewBox="0 0 96 96"
    >
      <defs>
        <linearGradient id={shellId} x1="16" x2="82" y1="14" y2="82">
          <stop offset="0" stopColor="#7cf8d0" stopOpacity="0.34" />
          <stop offset="0.5" stopColor="#55c8ff" stopOpacity="0.2" />
          <stop offset="1" stopColor="#ff4f9a" stopOpacity="0.16" />
        </linearGradient>
        <linearGradient id={strokeId} x1="20" x2="75" y1="20" y2="78">
          <stop offset="0" stopColor="#3df5a5" />
          <stop offset="0.52" stopColor="#55c8ff" />
          <stop offset="1" stopColor="#7e8bff" />
        </linearGradient>
        <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur result="blur" stdDeviation="3.4" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect
        fill="rgba(6,8,11,0.92)"
        height="64"
        rx="18"
        stroke={`url(#${strokeId})`}
        strokeWidth="3"
        width="64"
        x="16"
        y="16"
      />
      <rect fill={`url(#${shellId})`} height="52" rx="15" width="52" x="22" y="22" />
      <path
        d="M30 28h30l-3 9H44v6h11l-3 9H41v16h-9V28Z"
        fill="#f7fbff"
        opacity="0.95"
      />
      <path
        d="M57 31h8l-8 21h10l-20 17 8-18H44l13-20Z"
        fill={`url(#${strokeId})`}
        filter={`url(#${glowId})`}
      />
      <path
        className={animated ? "brand-scan-line" : undefined}
        d="M25 62c8 5 15 7 23 7 9 0 17-2 24-7"
        fill="none"
        opacity="0.7"
        stroke={`url(#${strokeId})`}
        strokeLinecap="round"
        strokeWidth="2"
      />
      <circle
        className={animated ? "brand-core-dot" : undefined}
        cx="69"
        cy="27"
        fill="#55c8ff"
        r="2.2"
      />
    </svg>
  );
}

export function BrandLogo({
  className = "",
  variant = "horizontal",
  animated = false
}: BrandLogoProps) {
  if (variant === "symbol") {
    return (
      <span className={`brand-logo-symbol ${className}`.trim()}>
        <BrandSymbol animated={animated} />
      </span>
    );
  }

  if (variant === "compact") {
    return (
      <span className={`brand-logo brand-logo-compact ${className}`.trim()}>
        <BrandSymbol animated={animated} />
        <span className="brand-wordmark brand-wordmark-compact">
          <span>10</span>
          <span>PILA</span>
        </span>
      </span>
    );
  }

  return (
    <span className={`brand-logo ${className}`.trim()}>
      <BrandSymbol animated={animated} />
      <span className="brand-lockup">
        <span className="brand-wordmark">
          <span>10</span>
          <span>PILA</span>
        </span>
        <span className="brand-tag">import tech club</span>
      </span>
    </span>
  );
}
