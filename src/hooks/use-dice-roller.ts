import { useCallback, useEffect, useRef, useState } from "react";

export interface DiceModifier {
  label: string;
  value: number;
}

export type DiceRollMode = "normal" | "advantage" | "disadvantage";
export type DiceRollOutcomeTone = "critical" | "fumble";

export interface DiceRollSpecialOutcome {
  tone: DiceRollOutcomeTone;
  message: string;
  triggerOnRollAtMost?: number;
  triggerOnRollAtLeast?: number;
}

export interface DiceRollOptions {
  mode?: DiceRollMode;
  highlightOutcome?: boolean;
  presetRolls?: number[];
  showAggregateTotal?: boolean;
  aggregateTotalModifiers?: DiceModifier[];
  selectedRollIndex?: number;
  selectedRollIndexes?: number[];
  chipValues?: number[];
  chipLabels?: string[];
  chipTones?: Array<"default" | "critical" | "fumble">;
  chipAttackIndexes?: number[];
  criticalThreatRangeStart?: number;
  actionId?: string;
  perRollModifierBreakdowns?: DiceModifier[][];
  specialOutcome?: DiceRollSpecialOutcome;
}

export interface DiceRollResult {
  roll: number;
  total: number;
  diceType: number;
  rolls: number[];
  showAggregateTotal?: boolean;
  aggregateTotalModifiers?: DiceModifier[];
  selectedRollIndexes?: number[];
  chipValues?: number[];
  chipLabels?: string[];
  chipTones?: Array<"default" | "critical" | "fumble">;
  chipAttackIndexes?: number[];
  perRollModifierBreakdowns?: DiceModifier[][];
  criticalThreatRangeStart?: number;
  actionId?: string;
  rollInstanceId: number;
  selectedRollIndex: number;
  rollMode: DiceRollMode;
  modifierBreakdown: DiceModifier[];
  isCritical: boolean;
  isFumble: boolean;
  specialOutcomeTone?: DiceRollOutcomeTone;
  specialOutcomeMessage?: string;
}

export function useDiceRoller() {
  const [isRolling, setIsRolling] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<DiceRollResult | null>(null);
  const timersRef = useRef<number[]>([]);
  const rollInstanceRef = useRef(0);

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
        const specialOutcome = options.specialOutcome;
        const meetsAtMostTrigger =
          typeof specialOutcome?.triggerOnRollAtMost === "number"
            ? roll <= specialOutcome.triggerOnRollAtMost
            : true;
        const meetsAtLeastTrigger =
          typeof specialOutcome?.triggerOnRollAtLeast === "number"
            ? roll >= specialOutcome.triggerOnRollAtLeast
            : true;
        const resolvedSpecialOutcome =
          specialOutcome && meetsAtMostTrigger && meetsAtLeastTrigger
            ? specialOutcome
            : undefined;
        rollInstanceRef.current += 1;

        setResult({
          roll,
          total: roll + modifierTotal,
          diceType,
          rolls,
          showAggregateTotal: options.showAggregateTotal ?? false,
          aggregateTotalModifiers: options.aggregateTotalModifiers
            ? [...options.aggregateTotalModifiers]
            : undefined,
          selectedRollIndexes:
            options.selectedRollIndexes &&
            options.selectedRollIndexes.length > 0
              ? [...options.selectedRollIndexes]
              : undefined,
          chipValues:
            options.chipValues && options.chipValues.length === rolls.length
              ? [...options.chipValues]
              : undefined,
          perRollModifierBreakdowns:
            options.perRollModifierBreakdowns &&
            options.perRollModifierBreakdowns.length === rolls.length
              ? options.perRollModifierBreakdowns.map((breakdown) => [
                  ...breakdown,
                ])
              : undefined,
          chipLabels:
            options.chipLabels && options.chipLabels.length === rolls.length
              ? [...options.chipLabels]
              : undefined,
          chipTones:
            options.chipTones && options.chipTones.length === rolls.length
              ? [...options.chipTones]
              : undefined,
          chipAttackIndexes:
            options.chipAttackIndexes &&
            options.chipAttackIndexes.length === rolls.length
              ? [...options.chipAttackIndexes]
              : undefined,
          criticalThreatRangeStart: options.criticalThreatRangeStart,
          actionId: options.actionId,
          rollInstanceId: rollInstanceRef.current,
          selectedRollIndex,
          rollMode,
          modifierBreakdown: modifiers,
          isCritical: highlightOutcome && diceType > 1 && roll === diceType,
          isFumble: highlightOutcome && diceType > 1 && roll === 1,
          specialOutcomeTone: resolvedSpecialOutcome?.tone,
          specialOutcomeMessage: resolvedSpecialOutcome?.message,
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
