import { cn } from "@/lib/utils";

/**
 * Propiedades del campo numerico reutilizable con controles personalizados.
 */
interface FormNumberInputProps {
  value: number | string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  title?: string;
  ariaLabel?: string;
  className?: string;
  inputClassName?: string;
  controlsClassName?: string;
  compact?: boolean;
}

function clampValue(value: number, min?: number, max?: number) {
  if (typeof min === "number") {
    value = Math.max(min, value);
  }

  if (typeof max === "number") {
    value = Math.min(max, value);
  }

  return value;
}

/**
 * Campo numerico con botones de incremento y decremento integrados.
 */
export function FormNumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder,
  disabled = false,
  title,
  ariaLabel,
  className,
  inputClassName,
  controlsClassName,
  compact = false,
}: FormNumberInputProps) {
  const controlsWidthClass = compact ? "w-4.5" : "w-5.5";
  const controlsOffsetClass = compact
    ? "right-0.5 inset-y-0.5"
    : "right-1 inset-y-1";
  const inputPaddingClass = compact ? "pr-6" : "pr-7.5";

  const handleTextChange = (nextValue: string) => {
    if (/^-?\d*$/.test(nextValue)) {
      onChange(nextValue);
    }
  };

  const adjustValue = (delta: number) => {
    const currentValue = Number.parseInt(String(value), 10);
    const safeCurrentValue = Number.isNaN(currentValue) ? 0 : currentValue;
    const nextValue = clampValue(safeCurrentValue + delta, min, max);
    onChange(String(nextValue));
  };

  return (
    <div className={cn("group relative", className)}>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(event) => handleTextChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        title={title}
        aria-label={ariaLabel}
        className={cn(
          "w-full rounded-xl px-3 py-2 text-sm appearance-none",
          inputPaddingClass,
          disabled ? "cursor-not-allowed opacity-60" : "",
          inputClassName,
        )}
      />

      <div
        className={cn(
          "absolute flex flex-col overflow-hidden rounded-md border border-border/60 bg-background/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
          controlsWidthClass,
          controlsOffsetClass,
          controlsClassName,
        )}
      >
        <button
          type="button"
          disabled={disabled}
          tabIndex={-1}
          aria-label={
            ariaLabel ? `Incrementar ${ariaLabel}` : "Incrementar valor"
          }
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => adjustValue(step)}
          className="flex flex-1 items-center justify-center border-b border-border/60 text-gold/80 transition-colors hover:bg-gold/12 hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg
            viewBox="0 0 12 12"
            aria-hidden="true"
            className="h-2.5 w-2.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              d="M2.25 7.5 6 3.75 9.75 7.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <button
          type="button"
          disabled={disabled}
          tabIndex={-1}
          aria-label={ariaLabel ? `Reducir ${ariaLabel}` : "Reducir valor"}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => adjustValue(-step)}
          className="flex flex-1 items-center justify-center text-gold/80 transition-colors hover:bg-gold/12 hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg
            viewBox="0 0 12 12"
            aria-hidden="true"
            className="h-2.5 w-2.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              d="M2.25 4.5 6 8.25 9.75 4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
