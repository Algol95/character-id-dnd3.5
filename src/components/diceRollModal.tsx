import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { DiceRollResult } from "@/hooks/use-dice-roller";

const CLOSE_DELAY_MS = 300;
const DICE_GLOW_STYLE = { filter: "drop-shadow(0 0 20px currentColor)" };
const DICE_TEXT_STYLE = { fontFamily: "Cinzel, serif" };

interface DiceShapeProps {
  diceType: number;
  roll?: number;
  isRolling: boolean;
  colorClass: string;
}

interface DiceValueProps {
  roll?: number;
  isRolling: boolean;
  x: string;
  y: string;
  className: string;
  dominantBaseline?: "middle" | "auto";
}

interface ResultAppearance {
  diceColorClass: string;
  backdropClass: string;
  resultMessage: string;
}

interface RollChipProps {
  value: number;
  isSelected: boolean;
}

function getResultAppearance(result: DiceRollResult | null): ResultAppearance {
  if (!result) {
    return {
      diceColorClass: "text-gold",
      backdropClass: "bg-black/80",
      resultMessage: "",
    };
  }

  if (result.isCritical) {
    return {
      diceColorClass: "text-critical animate-critical-glow",
      backdropClass: "bg-critical/20",
      resultMessage: result.diceType === 20 ? "GOLPE CRITICO" : "TIRADA MAXIMA",
    };
  }

  if (result.isFumble) {
    return {
      diceColorClass: "text-fumble animate-fumble-shake",
      backdropClass: "bg-fumble/20",
      resultMessage: "PIFIA",
    };
  }

  return {
    diceColorClass: "text-gold",
    backdropClass: "bg-black/80",
    resultMessage: "",
  };
}

function DiceValue({
  roll,
  isRolling,
  x,
  y,
  className,
  dominantBaseline,
}: DiceValueProps) {
  if (isRolling || !roll) {
    return null;
  }

  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline={dominantBaseline}
      className={className}
      style={DICE_TEXT_STYLE}
    >
      {roll}
    </text>
  );
}

function RollChip({ value, isSelected }: RollChipProps) {
  return (
    <div
      className={`min-w-16 rounded-xl border px-3 py-2 text-center transition-colors ${
        isSelected
          ? "border-gold bg-gold/15 text-gold shadow-[0_0_18px_rgba(212,175,55,0.18)]"
          : "border-border/80 bg-background/55 text-muted-foreground"
      }`}
    >
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

/**
 * Propiedades del modal que presenta el resultado de una tirada.
 */
interface DiceRollModalProps {
  isRolling: boolean;
  result: DiceRollResult | null;
  showResult: boolean;
  onClose: () => void;
  rollLabel: string;
}

/**
 * Muestra la animacion de tirada y el desglose final del resultado en una
 * ventana modal montada sobre el documento.
 */
export function DiceRollModal({
  isRolling,
  result,
  showResult,
  onClose,
  rollLabel,
}: DiceRollModalProps) {
  const canCloseRef = useRef(false);

  useEffect(() => {
    if (showResult) {
      canCloseRef.current = false;
      const timeout = window.setTimeout(() => {
        canCloseRef.current = true;
      }, CLOSE_DELAY_MS);
      return () => clearTimeout(timeout);
    }

    canCloseRef.current = false;
  }, [showResult]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isRolling && canCloseRef.current) {
        onClose();
      }
    };

    if (showResult) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [showResult, isRolling, onClose]);

  if (typeof document === "undefined" || !showResult) return null;

  const appearance = getResultAppearance(result);
  const hasMultipleRolls = (result?.rolls.length ?? 0) > 1;

  const handleBackdropClick = () => {
    if (canCloseRef.current && !isRolling) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 ${appearance.backdropClass} backdrop-blur-sm transition-colors duration-500`}
      />

      {/* Modal Content */}
      <div
        className="relative z-10 flex flex-col items-center gap-6 p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Roll Label */}
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gold tracking-wider uppercase">
            {rollLabel}
          </h2>
        </div>

        {/* Dice Container */}
        <div className="relative w-40 h-40 md:w-52 md:h-52 flex items-center justify-center">
          {/* Animated Dice */}
          <div className={`relative ${isRolling ? "animate-dice-roll" : ""}`}>
            <DiceShape
              diceType={result?.diceType || 20}
              roll={result?.roll}
              isRolling={isRolling}
              colorClass={appearance.diceColorClass}
            />
          </div>

          {/* Rolling text */}
          {isRolling && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-gold text-lg animate-pulse">
                Tirando...
              </span>
            </div>
          )}
        </div>

        {result && hasMultipleRolls && !isRolling && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {result.rolls.map((rollValue, index) => (
              <RollChip
                key={`${rollValue}-${index}`}
                value={rollValue}
                isSelected={index === result.selectedRollIndex}
              />
            ))}
          </div>
        )}

        {/* Critical/Fumble Message */}
        {result && (result.isCritical || result.isFumble) && (
          <div
            className={`text-2xl md:text-4xl font-bold tracking-widest ${appearance.diceColorClass}`}
          >
            {appearance.resultMessage}
          </div>
        )}

        {/* Result Breakdown */}
        {result && !isRolling && (
          <div className="flex flex-col items-center gap-4 animate-result-slam">
            {/* Modifier Breakdown */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-lg md:text-xl">
              <span className={`font-bold ${appearance.diceColorClass}`}>
                {result.roll}
              </span>
              {result.modifierBreakdown.map((mod, index) => (
                <span
                  key={index}
                  className="text-muted-foreground animate-modifier-appear"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <span
                    className={
                      mod.value >= 0 ? "text-success" : "text-blood-red"
                    }
                  >
                    {mod.value >= 0 ? "+" : ""}
                    {mod.value}
                  </span>
                  <span className="text-sm ml-1 text-gold-dim">
                    ({mod.label})
                  </span>
                </span>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground text-xl">=</span>
              <span
                className={`text-5xl md:text-7xl font-bold ${appearance.diceColorClass}`}
              >
                {result.total}
              </span>
            </div>
          </div>
        )}

        {/* Close instruction */}
        {result && !isRolling && (
          <p className="text-muted-foreground text-sm mt-4">
            Haz clic en cualquier parte o pulsa ESC para cerrar
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}

/**
 * Genera la silueta del dado correspondiente al tipo de tirada mostrado en
 * el modal.
 */
function DiceShape({ diceType, roll, isRolling, colorClass }: DiceShapeProps) {
  const baseClass = `w-32 h-32 md:w-44 md:h-44 ${isRolling ? "animate-glow-pulse" : ""} ${colorClass}`;

  if (diceType === 4) {
    return (
      <svg viewBox="0 0 100 100" className={baseClass} style={DICE_GLOW_STYLE}>
        <polygon
          points="50,5 95,90 5,90"
          fill="currentColor"
          fillOpacity="0.2"
          stroke="currentColor"
          strokeWidth="2"
        />
        <line
          x1="50"
          y1="5"
          x2="50"
          y2="60"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="50"
          y1="60"
          x2="95"
          y2="90"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="50"
          y1="60"
          x2="5"
          y2="90"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
        <DiceValue
          roll={roll}
          isRolling={isRolling}
          x="50"
          y="65"
          className="text-3xl font-bold fill-current"
        />
      </svg>
    );
  }

  if (diceType === 6) {
    return (
      <svg viewBox="0 0 100 100" className={baseClass} style={DICE_GLOW_STYLE}>
        <rect
          x="15"
          y="15"
          width="70"
          height="70"
          rx="8"
          fill="currentColor"
          fillOpacity="0.2"
          stroke="currentColor"
          strokeWidth="2"
        />
        <rect
          x="20"
          y="20"
          width="60"
          height="60"
          rx="4"
          fill="currentColor"
          fillOpacity="0.1"
          stroke="currentColor"
          strokeWidth="1"
        />
        <DiceValue
          roll={roll}
          isRolling={isRolling}
          x="50"
          y="55"
          className="text-3xl font-bold fill-current"
        />
      </svg>
    );
  }

  if (diceType === 8) {
    return (
      <svg viewBox="0 0 100 100" className={baseClass} style={DICE_GLOW_STYLE}>
        <polygon
          points="50,5 95,50 50,95 5,50"
          fill="currentColor"
          fillOpacity="0.2"
          stroke="currentColor"
          strokeWidth="2"
        />
        <line
          x1="50"
          y1="5"
          x2="50"
          y2="95"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="5"
          y1="50"
          x2="95"
          y2="50"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
        <DiceValue
          roll={roll}
          isRolling={isRolling}
          x="50"
          y="55"
          className="text-3xl font-bold fill-current"
        />
      </svg>
    );
  }

  if (diceType === 10) {
    return (
      <svg viewBox="0 0 100 100" className={baseClass} style={DICE_GLOW_STYLE}>
        <polygon
          points="50,5 90,30 90,70 50,95 10,70 10,30"
          fill="currentColor"
          fillOpacity="0.2"
          stroke="currentColor"
          strokeWidth="2"
        />
        <line
          x1="50"
          y1="5"
          x2="50"
          y2="50"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="50"
          y1="50"
          x2="90"
          y2="30"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="50"
          y1="50"
          x2="10"
          y2="30"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="95"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
        <DiceValue
          roll={roll}
          isRolling={isRolling}
          x="50"
          y="55"
          className="text-3xl font-bold fill-current"
        />
      </svg>
    );
  }

  if (diceType === 12) {
    return (
      <svg viewBox="0 0 100 100" className={baseClass} style={DICE_GLOW_STYLE}>
        <polygon
          points="50,5 85,20 95,55 75,90 25,90 5,55 15,20"
          fill="currentColor"
          fillOpacity="0.2"
          stroke="currentColor"
          strokeWidth="2"
        />
        <polygon
          points="50,25 70,35 70,65 50,75 30,65 30,35"
          fill="currentColor"
          fillOpacity="0.1"
          stroke="currentColor"
          strokeWidth="1"
        />
        <DiceValue
          roll={roll}
          isRolling={isRolling}
          x="50"
          y="58"
          className="text-3xl font-bold fill-current"
        />
      </svg>
    );
  }

  if (diceType === 100) {
    return (
      <svg viewBox="0 0 100 100" className={baseClass} style={DICE_GLOW_STYLE}>
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="currentColor"
          fillOpacity="0.2"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle
          cx="50"
          cy="50"
          r="30"
          fill="currentColor"
          fillOpacity="0.1"
          stroke="currentColor"
          strokeWidth="1"
        />
        <DiceValue
          roll={roll}
          isRolling={isRolling}
          x="50"
          y="55"
          className="text-2xl font-bold fill-current"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 100 100" className={baseClass} style={DICE_GLOW_STYLE}>
      <polygon
        points="50,5 95,35 82,90 18,90 5,35"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <polygon
        points="50,5 95,35 50,50"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="1"
      />
      <polygon
        points="95,35 82,90 50,50"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="currentColor"
        strokeWidth="1"
      />
      <polygon
        points="82,90 18,90 50,50"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="1"
      />
      <polygon
        points="18,90 5,35 50,50"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="currentColor"
        strokeWidth="1"
      />
      <polygon
        points="5,35 50,5 50,50"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="1"
      />
      <DiceValue
        roll={roll}
        isRolling={isRolling}
        x="50"
        y="55"
        dominantBaseline="middle"
        className="text-3xl font-bold fill-current"
      />
    </svg>
  );
}
