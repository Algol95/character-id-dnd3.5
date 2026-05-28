import { useCallback, useEffect, useRef, useState } from "react";

export interface DiceModifier {
  label: string;
  value: number;
}

export type DiceRollMode = "normal" | "advantage" | "disadvantage";

export interface DiceRollOptions {
  mode?: DiceRollMode;
  highlightOutcome?: boolean;
  presetRolls?: number[];
  selectedRollIndex?: number;
  chipValues?: number[];
  criticalThreatRangeStart?: number;
}

export interface DiceRollResult {
  roll: number;
  total: number;
  diceType: number;
  rolls: number[];
  chipValues?: number[];
  criticalThreatRangeStart?: number;
  selectedRollIndex: number;
  rollMode: DiceRollMode;
  modifierBreakdown: DiceModifier[];
  isCritical: boolean;
  isFumble: boolean;
}

export function useDiceRoller() {
  const [isRolling, setIsRolling] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<DiceRollResult | null>(null);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    timersRef.current = [];
  }, []);

  const closeResult = useCallback(() => {
    if (isRolling) {
      return;
    }

    setShowResult(false);
  }, [isRolling]);

  const rollDice = useCallback(
    (
      diceType: number,
      modifiers: DiceModifier[] = [],
      options: DiceRollOptions = {},
    ) => {
      clearTimers();
      setIsRolling(true);
      setShowResult(true);
      setResult(null);

      const resolveTimer = window.setTimeout(() => {
        const rollMode = options.mode ?? "normal";
        const highlightOutcome = options.highlightOutcome ?? true;
        const rolls =
          options.presetRolls && options.presetRolls.length > 0
            ? [...options.presetRolls]
            : rollMode === "normal"
              ? [Math.floor(Math.random() * diceType) + 1]
              : [
                  Math.floor(Math.random() * diceType) + 1,
                  Math.floor(Math.random() * diceType) + 1,
                ];
        const selectedRollIndex =
          options.presetRolls && options.presetRolls.length > 0
            ? Math.min(
                Math.max(options.selectedRollIndex ?? 0, 0),
                rolls.length - 1,
              )
            : rollMode === "advantage"
              ? rolls[0] >= rolls[1]
                ? 0
                : 1
              : rollMode === "disadvantage"
                ? rolls[0] <= rolls[1]
                  ? 0
                  : 1
                : 0;
        const roll = rolls[selectedRollIndex];
        const modifierTotal = modifiers.reduce(
          (sum, modifier) => sum + modifier.value,
          0,
        );

        setResult({
          roll,
          total: roll + modifierTotal,
          diceType,
          rolls,
          chipValues:
            options.chipValues && options.chipValues.length === rolls.length
              ? [...options.chipValues]
              : undefined,
          criticalThreatRangeStart: options.criticalThreatRangeStart,
          selectedRollIndex,
          rollMode,
          modifierBreakdown: modifiers,
          isCritical: highlightOutcome && diceType > 1 && roll === diceType,
          isFumble: highlightOutcome && diceType > 1 && roll === 1,
        });
        setIsRolling(false);
      }, 900);

      timersRef.current.push(resolveTimer);
    },
    [clearTimers],
  );

  useEffect(() => clearTimers, [clearTimers]);

  return {
    isRolling,
    result,
    showResult,
    rollDice,
    closeResult,
  };
}
