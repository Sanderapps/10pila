import type { ReactNode } from "react";

type EmptyStateProps = {
  eyebrow?: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
  art?: ReactNode;
};

export function EmptyState({
  eyebrow,
  title,
  description,
  actions,
  art
}: EmptyStateProps) {
  return (
    <section className="empty-state">
      <div className="empty-state-art" aria-hidden="true">
        {art ?? (
          <svg className="size-20" fill="none" viewBox="0 0 80 80">
            <rect
              fill="rgba(255,255,255,0.03)"
              height="48"
              rx="14"
              stroke="rgba(85,200,255,0.34)"
              strokeWidth="2"
              width="56"
              x="12"
              y="16"
            />
            <path
              d="M25 40h30"
              stroke="url(#empty-line)"
              strokeLinecap="round"
              strokeWidth="3"
            />
            <path
              d="M31 29h18"
              stroke="url(#empty-line)"
              strokeLinecap="round"
              strokeWidth="3"
            />
            <defs>
              <linearGradient id="empty-line" x1="25" x2="55" y1="29" y2="40">
                <stop offset="0" stopColor="#3df5a5" />
                <stop offset="1" stopColor="#55c8ff" />
              </linearGradient>
            </defs>
          </svg>
        )}
      </div>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="text-2xl font-black">{title}</h2>
      <p className="max-w-lg text-[var(--muted)]">{description}</p>
      {actions ? <div className="flex flex-wrap justify-center gap-3">{actions}</div> : null}
    </section>
  );
}
