import Link from "next/link";

type InboxOSLogoProps = {
  size?: "sm" | "md";
};

export function InboxOSLogo({ size = "md" }: InboxOSLogoProps) {
  const iconSize = size === "sm" ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm";
  const textSize = size === "sm" ? "text-lg" : "text-xl";

  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <span
        className={`flex ${iconSize} items-center justify-center rounded-md bg-terracotta font-bold text-paper shadow-[2px_2px_0_#9b3d24] transition-transform group-hover:-translate-y-0.5`}
        aria-hidden="true"
      >
        I
      </span>
      <span className={`font-display ${textSize} font-medium tracking-tight text-espresso`}>
        InboxOS
      </span>
    </Link>
  );
}
