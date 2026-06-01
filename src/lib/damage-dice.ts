export interface DiceTypeOption {
  sides: number;
  label: string;
  colorClass: string;
}

export const DAMAGE_DICE_TYPES: DiceTypeOption[] = [
  { sides: 4, label: "D4", colorClass: "text-blue-400" },
  { sides: 6, label: "D6", colorClass: "text-green-400" },
  { sides: 8, label: "D8", colorClass: "text-purple-400" },
  { sides: 10, label: "D10", colorClass: "text-orange-400" },
  { sides: 12, label: "D12", colorClass: "text-pink-400" },
];

const OFFICIAL_DAMAGE_DICE_VALUES = new Set(
  DAMAGE_DICE_TYPES.map((dice) => dice.sides),
);

export function isOfficialDamageDiceType(sides: number): boolean {
  return OFFICIAL_DAMAGE_DICE_VALUES.has(sides);
}
