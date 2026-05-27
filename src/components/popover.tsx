import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type PopoverSide = "top" | "bottom";
type PopoverAlign = "start" | "center" | "end";

interface PopoverProps {
  content: ReactNode;
  children: ReactNode;
  disabled?: boolean;
  side?: PopoverSide;
  align?: PopoverAlign;
  offset?: number;
  className?: string;
  anchorClassName?: string;
  inline?: boolean;
}

interface PopoverPosition {
  top: number;
  left: number;
  transform: string;
}

function getTransform(side: PopoverSide, align: PopoverAlign) {
  const translateX =
    align === "center" ? "-50%" : align === "end" ? "-100%" : "0";
  const translateY = side === "top" ? "-100%" : "0";

  return `translate(${translateX}, ${translateY})`;
}

export function Popover({
  content,
  children,
  disabled = false,
  side = "top",
  align = "center",
  offset = 10,
  className,
  anchorClassName,
  inline = false,
}: PopoverProps) {
  const anchorRef = useRef<HTMLDivElement | HTMLSpanElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<PopoverPosition | null>(null);

  const isEnabled = useMemo(
    () => Boolean(content) && !disabled,
    [content, disabled],
  );

  useEffect(() => {
    if (!isOpen || !isEnabled) {
      return;
    }

    const updatePosition = () => {
      const rect = anchorRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      const left =
        align === "start"
          ? rect.left
          : align === "end"
            ? rect.right
            : rect.left + rect.width / 2;
      const top = side === "top" ? rect.top - offset : rect.bottom + offset;

      setPosition({
        top,
        left,
        transform: getTransform(side, align),
      });
    };

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [align, isEnabled, isOpen, offset, side]);

  const sharedProps = {
    onMouseEnter: () => {
      if (isEnabled) {
        setIsOpen(true);
      }
    },
    onMouseLeave: () => setIsOpen(false),
    onFocus: () => {
      if (isEnabled) {
        setIsOpen(true);
      }
    },
    onBlur: () => setIsOpen(false),
  };

  const anchorContent = inline ? (
    <span
      ref={anchorRef as React.RefObject<HTMLSpanElement>}
      className={cn("inline-flex", anchorClassName)}
      {...sharedProps}
    >
      {children}
    </span>
  ) : (
    <div
      ref={anchorRef as React.RefObject<HTMLDivElement>}
      className={cn("block", anchorClassName)}
      {...sharedProps}
    >
      {children}
    </div>
  );

  return (
    <>
      {anchorContent}

      {isOpen && position && typeof document !== "undefined"
        ? createPortal(
            <div
              className={cn(
                "pointer-events-none fixed z-90 max-w-64 rounded-xl border border-gold/25 bg-[linear-gradient(145deg,rgba(41,32,23,0.98)_0%,rgba(30,24,18,0.97)_52%,rgba(24,18,14,0.99)_100%)] px-3 py-2 text-left text-xs text-foreground shadow-[0_18px_36px_rgba(0,0,0,0.45)]",
                className,
              )}
              style={{
                top: position.top,
                left: position.left,
                transform: position.transform,
              }}
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
