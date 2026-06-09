import { CriterionStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: CriterionStatus;
  size?: "sm" | "md";
}

const STATUS_CONFIG: Record<CriterionStatus, { label: string; classes: string }> = {
  supported: {
    label: "Supported",
    classes: "bg-black text-white",
  },
  partially_supported: {
    label: "Partial",
    classes: "bg-zinc-200 text-zinc-800",
  },
  not_supported: {
    label: "Not supported",
    classes: "bg-red-600 text-white",
  },
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const sizeClasses = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-[10px] px-2 py-0.5";

  return (
    <span className={`inline-flex items-center font-semibold uppercase tracking-wide rounded-sm ${sizeClasses} ${config.classes}`}>
      {config.label}
    </span>
  );
}
