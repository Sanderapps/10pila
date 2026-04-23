import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  variant?: "horizontal" | "compact" | "symbol";
  animated?: boolean;
};

const LOGO_ASSETS = {
  horizontal: {
    src: "/brand/10pila-wordmark-horizontal-v2.webp",
    width: 1599,
    height: 429,
    alt: "10PILA"
  },
  compact: {
    src: "/brand/10pila-wordmark-horizontal-v2.webp",
    width: 1599,
    height: 429,
    alt: "10PILA"
  },
  symbol: {
    src: "/brand/10pila-mark-compact-v2.webp",
    width: 1024,
    height: 1024,
    alt: "10PILA"
  }
} as const;

export function BrandLogo({
  className = "",
  variant = "horizontal",
  animated = false
}: BrandLogoProps) {
  const asset = LOGO_ASSETS[variant];

  return (
    <span
      className={[
        "brand-logo",
        variant === "compact" ? "brand-logo-compact" : "",
        variant === "symbol" ? "brand-logo-symbol" : "",
        animated ? "brand-logo-raster-animated" : "",
        className
      ].filter(Boolean).join(" ")}
    >
      <Image
        alt={asset.alt}
        className="brand-logo-image"
        height={asset.height}
        priority={variant !== "symbol"}
        src={asset.src}
        width={asset.width}
      />
    </span>
  );
}
