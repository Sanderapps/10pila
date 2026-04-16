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
