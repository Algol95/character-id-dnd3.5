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

export function DiceIcon({
  sides,
  className = "",
}: {
  sides: number;
  className?: string;
}) {
  switch (sides) {
    case 4:
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path
            d="M12 2L2 20h20L12 2zm0 5.5L17.5 17h-11L12 7.5z"
            fillOpacity="0.3"
            stroke="currentColor"
            strokeWidth="1"
          />
          <text
            x="12"
            y="15"
            textAnchor="middle"
            fontSize="7"
            fill="currentColor"
          >
            4
          </text>
        </svg>
      );
    case 6:
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="2"
            fillOpacity="0.3"
            stroke="currentColor"
            strokeWidth="1"
          />
          <text
            x="12"
            y="15"
            textAnchor="middle"
            fontSize="8"
            fill="currentColor"
          >
            6
          </text>
        </svg>
      );
    case 8:
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path
            d="M12 2L2 12l10 10 10-10L12 2z"
            fillOpacity="0.3"
            stroke="currentColor"
            strokeWidth="1"
          />
          <text
            x="12"
            y="15"
            textAnchor="middle"
            fontSize="8"
            fill="currentColor"
          >
            8
          </text>
        </svg>
      );
    case 10:
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path
            d="M12 2L4 8v8l8 6 8-6V8L12 2z"
            fillOpacity="0.3"
            stroke="currentColor"
            strokeWidth="1"
          />
          <text
            x="12"
            y="15"
            textAnchor="middle"
            fontSize="7"
            fill="currentColor"
          >
            10
          </text>
        </svg>
      );
    case 12:
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path
            d="M12 2L3.5 7v10L12 22l8.5-5V7L12 2z"
            fillOpacity="0.3"
            stroke="currentColor"
            strokeWidth="1"
          />
          <text
            x="12"
            y="15"
            textAnchor="middle"
            fontSize="7"
            fill="currentColor"
          >
            12
          </text>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <circle
            cx="12"
            cy="12"
            r="9"
            fillOpacity="0.15"
            stroke="currentColor"
            strokeWidth="1"
          />
          <text
            x="12"
            y="14"
            textAnchor="middle"
            fontSize="6"
            fill="currentColor"
          >
            {sides}
          </text>
        </svg>
      );
  }
}
