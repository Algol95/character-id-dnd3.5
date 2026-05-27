import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * Opcion seleccionable del componente de lista desplegable.
 */
export interface FormSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
}

/**
 * Propiedades del select reutilizable con estilo de fantasia oscura.
 */
interface FormSelectProps {
  value: string;
  options: FormSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  uppercase?: boolean;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
}

interface MenuPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

const MIN_MENU_WIDTH = 220;
const MENU_VIEWPORT_MARGIN = 12;
const MENU_OFFSET = 8;
const MAX_MENU_HEIGHT = 288;

/**
 * Select personalizado reutilizable para evitar los desplegables nativos sin estilo.
 */
export function FormSelect({
  value,
  options,
  onChange,
  placeholder = "Selecciona...",
  disabled = false,
  ariaLabel,
  uppercase = false,
  className,
  triggerClassName,
  menuClassName,
}: FormSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const desiredWidth = Math.max(rect.width, MIN_MENU_WIDTH);
      const left = Math.min(
        Math.max(MENU_VIEWPORT_MARGIN, rect.left),
        viewportWidth - desiredWidth - MENU_VIEWPORT_MARGIN,
      );
      const availableBelow =
        viewportHeight - rect.bottom - MENU_VIEWPORT_MARGIN;
      const availableAbove = rect.top - MENU_VIEWPORT_MARGIN;
      const shouldOpenUpward =
        availableBelow < 200 && availableAbove > availableBelow;
      const maxHeight = Math.max(
        140,
        Math.min(
          MAX_MENU_HEIGHT,
          shouldOpenUpward
            ? availableAbove - MENU_OFFSET
            : availableBelow - MENU_OFFSET,
        ),
      );

      setMenuPosition({
        top: shouldOpenUpward
          ? Math.max(MENU_VIEWPORT_MARGIN, rect.top - maxHeight - MENU_OFFSET)
          : rect.bottom + MENU_OFFSET,
        left,
        width: desiredWidth,
        maxHeight,
      });
    };

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const textToneClass = selectedOption
    ? "text-foreground"
    : "text-muted-foreground";
  const triggerCaseClass = uppercase ? "uppercase tracking-[0.08em]" : "";
  const optionCaseClass = uppercase ? "uppercase tracking-[0.08em]" : "";

  return (
    <>
      <div className={cn("relative", className)}>
        <button
          ref={triggerRef}
          type="button"
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          disabled={disabled}
          onClick={() => setIsOpen((currentValue) => !currentValue)}
          className={cn(
            "group flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl border border-border/80 bg-[linear-gradient(180deg,rgba(32,27,22,0.94)_0%,rgba(23,19,15,0.98)_100%)] px-4 py-2.5 text-left text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-200 hover:border-gold/45 hover:bg-gold/8 hover:shadow-[0_0_18px_rgba(212,175,55,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 disabled:cursor-not-allowed disabled:opacity-50",
            triggerClassName,
          )}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2 pr-1">
            {selectedOption?.icon ? (
              <span className="shrink-0">{selectedOption.icon}</span>
            ) : null}

            <span
              className={cn(
                "min-w-0 flex-1 text-[13px] leading-tight whitespace-normal wrap-break-word",
                textToneClass,
                triggerCaseClass,
              )}
              title={selectedOption?.label ?? placeholder}
            >
              {selectedOption?.label ?? placeholder}
            </span>
          </span>

          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className={cn(
              "h-4 w-4 shrink-0 text-gold/80 transition-transform duration-200",
              isOpen ? "rotate-180" : "",
            )}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              d="M5 7.5 10 12.5 15 7.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {isOpen && menuPosition && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              className={cn(
                "gold-border fixed z-80 overflow-hidden rounded-2xl bg-[linear-gradient(145deg,rgba(41,32,23,0.98)_0%,rgba(30,24,18,0.97)_52%,rgba(24,18,14,0.99)_100%)] p-1 shadow-[0_22px_48px_rgba(0,0,0,0.48)] backdrop-blur-md",
                menuClassName,
              )}
              style={{
                top: menuPosition.top,
                left: menuPosition.left,
                width: menuPosition.width,
                minWidth: MIN_MENU_WIDTH,
              }}
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.18)_45%,transparent_100%),radial-gradient(circle_at_20%_10%,rgba(212,175,55,0.22),transparent_25%)] opacity-10" />

              <div
                className="relative z-10 overflow-y-auto pr-1"
                style={{ maxHeight: menuPosition.maxHeight }}
              >
                {options.map((option) => {
                  const isSelected = option.value === value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={option.disabled}
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm transition-colors duration-150",
                        optionCaseClass,
                        isSelected
                          ? "bg-gold/18 text-gold shadow-[inset_0_0_0_1px_rgba(212,175,55,0.22)]"
                          : "text-foreground/90 hover:bg-secondary/65 hover:text-foreground",
                        option.disabled
                          ? "cursor-not-allowed opacity-45"
                          : "cursor-pointer",
                      )}
                    >
                      {option.icon ? (
                        <span className="shrink-0">{option.icon}</span>
                      ) : null}

                      <span className="min-w-0 flex-1 leading-tight whitespace-normal wrap-break-word">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
