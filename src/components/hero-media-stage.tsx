import Image from "next/image";

type HeroMediaStageProps = {
  alt: string;
  posterSrc: string;
  videoSrc?: string;
  priority?: boolean;
};

export function HeroMediaStage({
  alt,
  posterSrc,
  videoSrc,
  priority = false
}: HeroMediaStageProps) {
  return (
    <div className="hero-media-stage relative aspect-[4/3] overflow-hidden rounded-lg bg-black">
      {videoSrc ? (
        <video
          autoPlay
          className="absolute inset-0 h-full w-full object-cover"
          loop
          muted
          playsInline
          poster={posterSrc}
          preload="none"
        >
          <source src={videoSrc} />
        </video>
      ) : null}
      <Image
        alt={alt}
        className={`object-cover transition duration-500 hover:scale-[1.03] ${videoSrc ? "opacity-0" : ""}`}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, 520px"
        src={posterSrc}
      />
      <div className="hero-media-vignette absolute inset-0" />
      <div className="hero-media-tag absolute bottom-3 left-3 rounded-[8px] border border-[var(--line)] bg-[rgba(7,10,14,0.82)] px-3 py-2 text-[11px] font-black uppercase text-[var(--accent-2)]">
        poster pronto pra video
      </div>
    </div>
  );
}
