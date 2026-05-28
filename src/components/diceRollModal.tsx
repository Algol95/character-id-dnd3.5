import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { DiceRollResult } from "@/hooks/use-dice-roller";

const CLOSE_DELAY_MS = 300;
const DICE_GLOW_STYLE = { filter: "drop-shadow(0 0 20px currentColor)" };
const DICE_TEXT_STYLE = {
  fontFamily: "Cinzel, serif",
  fontWeight: 700,
  letterSpacing: "0.02em",
  paintOrder: "stroke fill",
  stroke: "rgba(12, 8, 4, 0.92)",
  strokeWidth: "2.75px",
  strokeLinejoin: "round",
  filter: "drop-shadow(0 2px 10px rgba(0, 0, 0, 0.45))",
} as const;

interface DiceShapeProps {
  diceType: number;
  roll?: number;
  isRolling: boolean;
  colorClass: string;
  sizeClassName?: string;
}

interface DiceValueProps {
  roll?: number;
  isRolling: boolean;
  x: string;
  y: string;
  className: string;
  fontSize: number;
  dominantBaseline?: "middle" | "auto";
}

interface ResultAppearance {
  diceColorClass: string;
  backdropClass: string;
  resultMessage: string;
}

interface RollChipProps {
  value: number;
  originalValue?: number;
  isSelected: boolean;
  tone?: "default" | "critical" | "fumble";
}

interface CriticalConfirmationState {
  isRolling: boolean;
  previewRoll: number;
  result?: {
    roll: number;
    total: number;
  };
}

const EMPTY_CONFIRMATION_DECISIONS: Record<
  number,
  "confirmed" | "rejected" | null
> = {};

function rollDie(sides: number) {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return (values[0] % sides) + 1;
  }

  return Math.floor(Math.random() * sides) + 1;
}

function hasCriticalOutcome(result: DiceRollResult | null) {
  return Boolean(
    result &&
    result.diceType > 1 &&
    (result.isCritical || result.roll === result.diceType),
  );
}

function hasFumbleOutcome(result: DiceRollResult | null) {
  return Boolean(
    result && result.diceType > 1 && (result.isFumble || result.roll === 1),
  );
}

function hasCriticalThreat(result: DiceRollResult | null) {
  return Boolean(
    result &&
    result.diceType === 20 &&
    result.criticalThreatRangeStart !== undefined &&
    result.criticalThreatRangeStart < 20 &&
    result.roll >= result.criticalThreatRangeStart &&
    result.roll < 20,
  );
}

function getResultAppearance(result: DiceRollResult | null): ResultAppearance {
  if (!result) {
    return {
      diceColorClass: "text-gold",
      backdropClass: "bg-black/80",
      resultMessage: "",
    };
  }

  if (hasCriticalOutcome(result)) {
    return {
      diceColorClass: "text-critical animate-critical-glow",
      backdropClass: "bg-critical/20",
      resultMessage: result.diceType === 20 ? "GOLPE CRITICO" : "TIRADA MAXIMA",
    };
  }

  if (hasFumbleOutcome(result)) {
    return {
      diceColorClass: "text-fumble animate-fumble-shake",
      backdropClass: "bg-fumble/20",
      resultMessage: "PIFIA",
    };
  }

  if (hasCriticalThreat(result)) {
    return {
      diceColorClass: "text-critical animate-critical-glow",
      backdropClass: "bg-black/80",
      resultMessage: "",
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
  fontSize,
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
      style={{ ...DICE_TEXT_STYLE, fontSize: `${fontSize}px` }}
    >
      {roll}
    </text>
  );
}

function RollChip({
  value,
  originalValue,
  isSelected,
  tone = "default",
}: RollChipProps) {
  const toneClasses =
    tone === "critical"
      ? "border-critical/55 bg-critical/12 text-critical shadow-[0_0_18px_color-mix(in_oklab,var(--critical)_32%,transparent)]"
      : tone === "fumble"
        ? "border-fumble/55 bg-fumble/12 text-fumble shadow-[0_0_18px_color-mix(in_oklab,var(--fumble)_26%,transparent)]"
        : isSelected
          ? "border-gold bg-gold/15 text-gold shadow-[0_0_18px_rgba(212,175,55,0.18)]"
          : "border-border/80 bg-background/55 text-muted-foreground";

  const originalValueClass =
    tone === "critical"
      ? "text-critical/80"
      : tone === "fumble"
        ? "text-fumble/80"
        : "text-gold-dim/80";

  return (
    <div
      className={`min-w-16 rounded-xl border px-3 py-2 text-center transition-colors ${toneClasses}`}
    >
      {originalValue !== undefined ? (
        <div
          className={`text-[10px] uppercase tracking-[0.16em] ${originalValueClass}`}
        >
          base {originalValue}
        </div>
      ) : null}
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function formatSignedValue(value: number) {
  return value >= 0 ? `+${value}` : `${value}`;
}

function CriticalConfirmationControl({
  isNaturalCritical,
  isThreatened,
  modifierTotal,
  decision,
  onDecisionChange,
}: {
  isNaturalCritical: boolean;
  isThreatened: boolean;
  modifierTotal: number;
  decision: "confirmed" | "rejected" | null;
  onDecisionChange: (decision: "confirmed" | "rejected" | null) => void;
}) {
  const [attemptCount, setAttemptCount] = useState(0);
  const [confirmationState, setConfirmationState] =
    useState<CriticalConfirmationState | null>(null);

  useEffect(() => {
    if (attemptCount === 0) {
      return;
    }

    let isActive = true;

    const intervalId = window.setInterval(() => {
      if (!isActive) {
        return;
      }

      setConfirmationState((currentState) => {
        if (!currentState?.isRolling) {
          return currentState;
        }

        return {
          ...currentState,
          previewRoll: rollDie(20),
        };
      });
    }, 85);

    const timeoutId = window.setTimeout(() => {
      window.clearInterval(intervalId);

      if (!isActive) {
        return;
      }

      const confirmationRoll = rollDie(20);

      setConfirmationState({
        isRolling: false,
        previewRoll: confirmationRoll,
        result: {
          roll: confirmationRoll,
          total: confirmationRoll + modifierTotal,
        },
      });
    }, 900);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [attemptCount, modifierTotal]);

  if (isNaturalCritical) {
    return (
      <div className="rounded-full border border-critical/40 bg-critical/12 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-critical">
        Critico natural
      </div>
    );
  }

  // TODO: Cuando exista la seccion de reglas especiales, permitir una regla
  // que trate cualquier amenaza de critico dentro del rango como critico
  // natural y omita por completo este flujo de confirmacion.
  if (!isThreatened) {
    return null;
  }

  const displayedConfirmationRoll =
    confirmationState?.result?.roll ?? confirmationState?.previewRoll;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => {
          onDecisionChange(null);
          setConfirmationState({
            isRolling: true,
            previewRoll: rollDie(20),
          });
          setAttemptCount((currentCount) => currentCount + 1);
        }}
        disabled={confirmationState?.isRolling}
        className="rounded-full border border-gold/40 bg-gold/12 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-gold transition-colors hover:bg-gold/18 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {confirmationState?.result
          ? "Repetir confirmacion"
          : "Confirmar critico"}
      </button>

      {confirmationState ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-background/35 px-3 py-3 text-center">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <DiceShape
              diceType={20}
              roll={displayedConfirmationRoll}
              isRolling={confirmationState.isRolling}
              colorClass="text-accent"
              sizeClassName="h-16 w-16"
            />
          </div>

          <div className="text-[10px] uppercase tracking-[0.16em] text-gold-dim">
            {confirmationState.isRolling
              ? "Confirmando..."
              : "Tirada de confirmacion"}
          </div>

          {confirmationState.result ? (
            <>
              <div className="text-xs text-muted-foreground">
                {confirmationState.result.roll}
                {modifierTotal !== 0
                  ? ` ${formatSignedValue(modifierTotal)}`
                  : ""}{" "}
                = {confirmationState.result.total}
              </div>

              <div
                className={`mt-1 grid w-full transition-all duration-300 ${
                  decision ? "grid-cols-2 gap-0" : "grid-cols-2 gap-2"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onDecisionChange("confirmed")}
                  disabled={decision !== null}
                  className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.16em] transition-all duration-300 ${
                    decision === "confirmed"
                      ? "col-span-2 justify-self-center border-critical/45 bg-critical/14 text-critical shadow-[0_0_18px_color-mix(in_oklab,var(--critical)_28%,transparent)]"
                      : decision === "rejected"
                        ? "pointer-events-none w-0 justify-self-start scale-90 overflow-hidden border-0 px-0 py-0 opacity-0"
                        : "border-border/60 bg-background/20 text-muted-foreground hover:border-critical/35 hover:text-critical"
                  }`}
                >
                  Critico confirmado
                </button>

                <button
                  type="button"
                  onClick={() => onDecisionChange("rejected")}
                  disabled={decision !== null}
                  className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.16em] transition-all duration-300 ${
                    decision === "rejected"
                      ? "col-span-2 justify-self-center border-fumble/45 bg-fumble/14 text-fumble shadow-[0_0_18px_color-mix(in_oklab,var(--fumble)_24%,transparent)]"
                      : decision === "confirmed"
                        ? "pointer-events-none w-0 justify-self-end scale-90 overflow-hidden border-0 px-0 py-0 opacity-0"
                        : "border-border/60 bg-background/20 text-muted-foreground hover:border-fumble/35 hover:text-fumble"
                  }`}
                >
                  No confirmado
                </button>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Propiedades del modal que presenta el resultado de una tirada.
 * @param isRolling Indica si la animacion de tirada esta en curso.
 * @param result Resultado de la tirada, incluyendo el valor del dado, modificadores y total.
 * @param showResult Controla la visibilidad del modal.
 * @param onClose Funcion a ejecutar al cerrar el modal.
 * @param rollLabel Etiqueta descriptiva de la tirada realizada (ej. "Tirada de ataque", "Salvacion de Fortaleza", etc.)
 * @return Una ventana modal que muestra la animacion de tirada, el resultado del dado, modificadores aplicados y un mensaje especial en caso de critico o pifia. Se monta sobre el documento para garantizar su visibilidad por encima de otros elementos.
 */
interface DiceRollModalProps {
  isRolling: boolean;
  result: DiceRollResult | null;
  showResult: boolean;
  onClose: () => void;
  rollLabel: string;
  onAttackCriticalStateChange?: (
    actionId: string,
    criticalAttackIndexes: number[],
  ) => void;
}

/**
 * Muestra la animacion de tirada y el desglose final del resultado en una
 * ventana modal montada sobre el documento.
 * @param isRolling Indica si la animacion de tirada esta en curso.
 * @param result Resultado de la tirada, incluyendo el valor del dado, modificadores y total.
 * @param showResult Controla la visibilidad del modal.
 * @param onClose Funcion a ejecutar al cerrar el modal.
 * @param rollLabel Etiqueta descriptiva de la tirada realizada (ej. "Tirada de ataque", "Salvacion de Fortaleza", etc.)
 * @return Una ventana modal que muestra la animacion de tirada, el resultado del dado, modificadores aplicados y un mensaje especial en caso de critico o pifia. Se monta sobre el documento para garantizar su visibilidad por encima de otros elementos.
 */
export function DiceRollModal({
  isRolling,
  result,
  showResult,
  onClose,
  rollLabel,
  onAttackCriticalStateChange,
}: DiceRollModalProps) {
  const canCloseRef = useRef(false);
  const [confirmationDecisionSession, setConfirmationDecisionSession] =
    useState<{
      key: string;
      decisions: Record<number, "confirmed" | "rejected" | null>;
    }>({
      key: "",
      decisions: {},
    });

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

  const appearance = getResultAppearance(result);
  const hasMultipleRolls = (result?.rolls.length ?? 0) > 1;
  const criticalConfirmationSessionKey = `${rollLabel}:${result?.diceType ?? 0}:${result?.selectedRollIndex ?? 0}:${result?.criticalThreatRangeStart ?? "none"}:${result?.rollInstanceId ?? 0}:${result?.rolls.join(",") ?? ""}`;
  const confirmationDecisions =
    confirmationDecisionSession.key === criticalConfirmationSessionKey
      ? confirmationDecisionSession.decisions
      : EMPTY_CONFIRMATION_DECISIONS;
  const confirmationModifierTotal =
    result?.modifierBreakdown.reduce(
      (sum, modifier) => sum + modifier.value,
      0,
    ) ?? 0;
  const threatenedRollIndexes =
    result?.diceType === 20 &&
    result.criticalThreatRangeStart !== undefined &&
    result.criticalThreatRangeStart < 20
      ? result.rolls.reduce<number[]>((indexes, rollValue, index) => {
          if (rollValue >= result.criticalThreatRangeStart! && rollValue < 20) {
            indexes.push(index);
          }

          return indexes;
        }, [])
      : [];
  const showOutcomeMessage =
    hasCriticalOutcome(result) || hasFumbleOutcome(result);
  const selectedRollIndexes =
    result?.selectedRollIndexes && result.selectedRollIndexes.length > 0
      ? result.selectedRollIndexes
      : result
        ? [result.selectedRollIndex]
        : [];

  const isSelectedRoll = (rollIndex: number) =>
    selectedRollIndexes.includes(rollIndex);

  const isCriticalRelevantRoll = (rollIndex: number) =>
    result?.rollMode === "normal" ? true : isSelectedRoll(rollIndex);

  const isNaturalCriticalRoll = (rollIndex: number) =>
    result?.diceType === 20 &&
    isCriticalRelevantRoll(rollIndex) &&
    (result.rolls[rollIndex] ?? 0) === 20;

  const isThreatenedRoll = (rollIndex: number) =>
    isCriticalRelevantRoll(rollIndex) &&
    threatenedRollIndexes.includes(rollIndex);

  const handleConfirmationDecisionChange = (
    rollIndex: number,
    decision: "confirmed" | "rejected" | null,
  ) => {
    setConfirmationDecisionSession((currentSession) => ({
      key: criticalConfirmationSessionKey,
      decisions: {
        ...(currentSession.key === criticalConfirmationSessionKey
          ? currentSession.decisions
          : {}),
        [rollIndex]: decision,
      },
    }));
  };

  useEffect(() => {
    if (
      !result?.actionId ||
      result.diceType !== 20 ||
      !onAttackCriticalStateChange
    ) {
      return;
    }

    const threatenedRollIndexes =
      result.criticalThreatRangeStart !== undefined &&
      result.criticalThreatRangeStart < 20
        ? result.rolls.reduce<number[]>((indexes, rollValue, index) => {
            if (
              rollValue >= result.criticalThreatRangeStart! &&
              rollValue < 20
            ) {
              indexes.push(index);
            }

            return indexes;
          }, [])
        : [];
    const selectedRollIndexes =
      result.selectedRollIndexes && result.selectedRollIndexes.length > 0
        ? result.selectedRollIndexes
        : [result.selectedRollIndex];
    const isCriticalRelevantRoll = (rollIndex: number) =>
      result.rollMode === "normal" || selectedRollIndexes.includes(rollIndex);
    const naturalCriticalIndexes = result.rolls.reduce<number[]>(
      (indexes, rollValue, index) => {
        if (rollValue === 20 && isCriticalRelevantRoll(index)) {
          indexes.push(result.chipAttackIndexes?.[index] ?? index);
        }

        return indexes;
      },
      [],
    );
    const confirmedThreatIndexes = threatenedRollIndexes
      .filter((rollIndex) => confirmationDecisions[rollIndex] === "confirmed")
      .map((rollIndex) => result.chipAttackIndexes?.[rollIndex] ?? rollIndex);
    const criticalAttackIndexes = [
      ...new Set([...naturalCriticalIndexes, ...confirmedThreatIndexes]),
    ].sort((left, right) => left - right);

    onAttackCriticalStateChange(result.actionId, criticalAttackIndexes);
  }, [
    confirmationDecisions,
    onAttackCriticalStateChange,
    result?.actionId,
    result?.chipAttackIndexes,
    result?.criticalThreatRangeStart,
    result?.diceType,
    result?.rollMode,
    result?.rolls,
    result?.selectedRollIndex,
    result?.selectedRollIndexes,
  ]);

  if (typeof document === "undefined" || !showResult) return null;

  const getRollChipTone = (rollIndex: number) => {
    const explicitTone = result?.chipTones?.[rollIndex];

    if (explicitTone) {
      return explicitTone;
    }

    const currentRoll = result?.rolls[rollIndex] ?? 0;
    const diceType = result?.diceType ?? 0;

    if (diceType === 20 && isNaturalCriticalRoll(rollIndex)) {
      return "critical" as const;
    }

    if (diceType === 20 && isThreatenedRoll(rollIndex)) {
      return "critical" as const;
    }

    if (diceType > 1 && currentRoll === 1) {
      return "fumble" as const;
    }

    return "default" as const;
  };

  const renderCriticalInteraction = (rollIndex: number) => {
    if (!result || result.diceType !== 20) {
      return null;
    }

    return (
      <CriticalConfirmationControl
        key={`${criticalConfirmationSessionKey}-${rollIndex}`}
        isNaturalCritical={isNaturalCriticalRoll(rollIndex)}
        isThreatened={isThreatenedRoll(rollIndex)}
        modifierTotal={confirmationModifierTotal}
        decision={confirmationDecisions[rollIndex] ?? null}
        onDecisionChange={(decision) =>
          handleConfirmationDecisionChange(rollIndex, decision)
        }
      />
    );
  };

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
      <div
        className={`absolute inset-0 ${appearance.backdropClass} backdrop-blur-sm transition-colors duration-500`}
      />

      <div
        className="relative z-10 flex flex-col items-center gap-6 p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gold tracking-wider uppercase">
            {rollLabel}
          </h2>
        </div>

        <div className="relative w-40 h-40 md:w-52 md:h-52 flex items-center justify-center">
          <div className={`relative ${isRolling ? "animate-dice-roll" : ""}`}>
            <DiceShape
              diceType={result?.diceType || 20}
              roll={result?.roll}
              isRolling={isRolling}
              colorClass={appearance.diceColorClass}
            />
          </div>

          {isRolling && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-gold text-lg animate-pulse">
                Lanzando...
              </span>
            </div>
          )}
        </div>

        {result && hasMultipleRolls && !isRolling && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {result.rolls.map((rollValue, index) => (
              <div
                key={`${rollValue}-${index}`}
                className="flex flex-col items-center gap-2"
              >
                <RollChip
                  value={result.chipValues?.[index] ?? rollValue}
                  originalValue={
                    result.chipValues?.[index] !== undefined
                      ? rollValue
                      : undefined
                  }
                  isSelected={isSelectedRoll(index)}
                  tone={getRollChipTone(index)}
                />
                {renderCriticalInteraction(index)}
              </div>
            ))}
          </div>
        )}

        {result && !hasMultipleRolls && !isRolling
          ? renderCriticalInteraction(0)
          : null}

        {result && showOutcomeMessage && (
          <div
            className={`text-2xl md:text-4xl font-bold tracking-widest ${appearance.diceColorClass}`}
          >
            {appearance.resultMessage}
          </div>
        )}

        {result && !isRolling && (
          <div className="flex flex-col items-center gap-4 animate-result-slam">
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
 * @param diceType El tipo de dado a mostrar (4, 6, 8, 10, 12, 20, 100).
 * @param roll El valor del dado a mostrar en el centro de la figura, se oculta durante la animacion de tirada.
 * @param isRolling Controla si se muestra la animacion de tirada o el resultado final.
 * @param colorClass Clase de color para aplicar al dado, se determina segun el resultado (critico, pifia o normal).
 * @return Un SVG con la forma del dado correspondiente al tipo de tirada, con un estilo de brillo que cambia segun el resultado. Durante la animacion se muestra un efecto de movimiento y el valor del dado se oculta hasta que termina la animacion.
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
          fontSize={26}
          className="fill-current"
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
          fontSize={28}
          className="fill-current"
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
          fontSize={28}
          className="fill-current"
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
          fontSize={28}
          className="fill-current"
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
          fontSize={26}
          className="fill-current"
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
          fontSize={22}
          className="fill-current"
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
        fontSize={26}
        dominantBaseline="middle"
        className="fill-current"
      />
    </svg>
  );
}
