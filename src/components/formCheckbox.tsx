import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Propiedades del checkbox reutilizable con estilo de la hoja.
 */
interface FormCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
  label?: ReactNode;
  description?: ReactNode;
  className?: string;
  boxClassName?: string;
  labelClassName?: string;
  descriptionClassName?: string;
}

/**
 * Checkbox visual reutilizable para mantener un estilo coherente en la app.
 */
export function FormCheckbox({
  checked,
  onChange,
  disabled = false,
  ariaLabel,
  label,
  description,
  className,
  boxClassName,
  labelClassName,
  descriptionClassName,
}: FormCheckboxProps) {
  const hasText = Boolean(label) || Boolean(description);

  return (
    <label
      className={cn(
        "group relative inline-flex",
        hasText ? "w-full items-start gap-3" : "items-center justify-center",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        className,
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />

      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border/80 bg-input/90 text-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-200 group-hover:border-gold/30 peer-checked:border-gold/60 peer-checked:bg-gold/15 peer-checked:text-gold peer-checked:shadow-[0_0_12px_rgba(212,175,55,0.18)] peer-focus-visible:ring-2 peer-focus-visible:ring-gold/60 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-disabled:border-border/45 peer-disabled:bg-input/45",
          disabled && checked ? "text-gold/40" : "text-transparent",
          boxClassName,
        )}
      >
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <path
            d="M3.5 8.5 6.5 11.5 12.5 4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      {hasText ? (
        <span className="min-w-0 flex-1 pt-0.5">
          {label ? (
            <span
              className={cn(
                "block text-sm font-medium text-foreground",
                labelClassName,
              )}
            >
              {label}
            </span>
          ) : null}

          {description ? (
            <span
              className={cn(
                "mt-1 block text-sm leading-6 text-muted-foreground",
                descriptionClassName,
              )}
            >
              {description}
            </span>
          ) : null}
        </span>
      ) : null}
    </label>
  );
}
