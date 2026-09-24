import { cn } from "@/lib/utils";

/**
 * Scrap logo: three notebook punch-holes stacked to the left of an "S".
 * Uses currentColor so it picks up the active accent anywhere it's placed.
 */
export function ScrapMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("h-6 w-6", className)}
    >
      <circle cx="6.5" cy="8.5" r="2.1" fill="currentColor" />
      <circle cx="6.5" cy="16" r="2.1" fill="currentColor" />
      <circle cx="6.5" cy="23.5" r="2.1" fill="currentColor" />
      <path
        d="M24.2 10.4c-.9-1.9-3.4-2.9-5.6-2.2-2.5.8-3.3 3.7-1.1 5.2l4 2.7c2.4 1.6 1.7 4.9-1 5.7-2.4.7-5-.3-6-2.3"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ScrapLogo({
  className,
  markClassName,
  wordClassName,
}: {
  className?: string;
  markClassName?: string;
  wordClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <ScrapMark className={cn("h-7 w-7 text-brand", markClassName)} />
      <span className={cn("text-[26px] leading-none font-semibold tracking-[-0.035em]", wordClassName)}>
        Scrap
      </span>
    </span>
  );
}
