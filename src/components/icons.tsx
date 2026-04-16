type IconProps = {
  className?: string;
};

export function SparkIcon({ className = "size-4" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9 12 2Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="M18 16 19 19 22 20 19 21 18 24 17 21 14 20 17 19 18 16Z" fill="currentColor" />
    </svg>
  );
}

export function ShieldIcon({ className = "size-4" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M12 3 19 6v5.7c0 4.3-2.6 7.6-7 9.3-4.4-1.7-7-5-7-9.3V6l7-3Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="M8.5 12l2.2 2.2 4.8-5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

export function TruckIcon({ className = "size-4" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M3 7h11v9H3V7Z" stroke="currentColor" strokeLinejoin="miter" strokeWidth="1.8" />
      <path d="M14 10h3.5L21 13.5V16h-7v-6Z" stroke="currentColor" strokeLinejoin="miter" strokeWidth="1.8" />
      <path d="M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function BoltIcon({ className = "size-4" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M13 2 5 13h6l-1 9 9-12h-6l1-8Z" stroke="currentColor" strokeLinejoin="miter" strokeWidth="1.8" />
    </svg>
  );
}

export function SearchIcon({ className = "size-4" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="m20 20-4.2-4.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function CartIcon({ className = "size-4" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M4 5h2l2 10h9l2-7H7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M10 19.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM19 19.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" fill="currentColor" />
    </svg>
  );
}

export function GiftIcon({ className = "size-4" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M4 9h16v11H4z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 9v11" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 9h18V6H3z" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M10.3 6c-1.8 0-3.3-1.2-3.3-2.7 0-1.1.8-1.8 1.9-1.8 1.4 0 2.4 1.1 3.1 3.4L12 6h-1.7ZM13.7 6c1.8 0 3.3-1.2 3.3-2.7 0-1.1-.8-1.8-1.9-1.8-1.4 0-2.4 1.1-3.1 3.4L12 6h1.7Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function InstagramIcon({ className = "size-4" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.3" cy="6.7" r="1" fill="currentColor" />
    </svg>
  );
}

export function TikTokIcon({ className = "size-4" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M14 3c.3 2.2 1.9 3.9 4 4.2v3a7.6 7.6 0 0 1-4-1.2v5.8a4.8 4.8 0 1 1-4.8-4.8c.4 0 .9.1 1.3.2v3.1a1.9 1.9 0 1 0 1.6 1.9V3H14Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function WhatsAppIcon({ className = "size-4" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M12 20a8 8 0 1 0-4.4-1.3L4 20l1.5-3.3A8 8 0 0 0 12 20Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M9.1 8.9c.2-.5.4-.5.8-.5h.6c.2 0 .4 0 .5.4l.6 1.6c.1.2 0 .4-.1.5l-.5.7c.4.9 1.1 1.6 2 2l.7-.5c.1-.1.3-.1.5-.1l1.6.6c.3.1.4.3.4.5v.6c0 .4 0 .6-.5.8-.4.2-.8.3-1.2.3A6.7 6.7 0 0 1 8.8 10c0-.4.1-.8.3-1.1Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function FacebookIcon({ className = "size-4" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M13 21v-7h2.5l.4-3H13V9.1c0-.9.3-1.6 1.7-1.6H16V4.8c-.3 0-.9-.1-1.8-.1-2.9 0-4.4 1.7-4.4 4.6V11H7v3h2.8v7H13Z"
        fill="currentColor"
      />
    </svg>
  );
}
