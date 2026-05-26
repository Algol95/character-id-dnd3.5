import { useCallback, useEffect, useRef, useState } from "react";

export interface DiceModifier {
  label: string;
  value: number;
}

export interface DiceRollResult {
  roll: number;
  total: number;
  diceType: number;
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
    (diceType: number, modifiers: DiceModifier[] = []) => {
      clearTimers();
      setIsRolling(true);
      setShowResult(true);
      setResult(null);

      const resolveTimer = window.setTimeout(() => {
        const roll = Math.floor(Math.random() * diceType) + 1;
        const modifierTotal = modifiers.reduce(
          (sum, modifier) => sum + modifier.value,
          0,
        );

        setResult({
          roll,
          total: roll + modifierTotal,
          diceType,
          modifierBreakdown: modifiers,
          isCritical: roll === diceType,
          isFumble: diceType === 20 && roll === 1,
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
