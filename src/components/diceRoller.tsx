import { SectionShell } from "./sectionShell";
import { Popover } from "./popover";
import type { DiceRollMode } from "@/hooks/use-dice-roller";

const DICE_TYPES = [
  { sides: 4, label: "D4", color: "text-blue-400" },
  { sides: 6, label: "D6", color: "text-green-400" },
  { sides: 8, label: "D8", color: "text-purple-400" },
  { sides: 10, label: "D10", color: "text-orange-400" },
  { sides: 12, label: "D12", color: "text-pink-400" },
  { sides: 20, label: "D20", color: "text-gold" },
  { sides: 100, label: "D100", color: "text-cyan-400" },
];

/**
 * Propiedades del panel de tiradas rapidas de dados.
 * @param onRoll Funcion a ejecutar al seleccionar una opcion de tirada rapida, recibe el label descriptivo, los modificadores aplicables, el tipo de dado y el modo de tirada.
 * @param isOpen Indica si el panel de tiradas rapidas esta desplegado o plegado.
 * @param onToggle Funcion a ejecutar al hacer click en el control de plegado, normalmente para alternar el estado de isOpen.
 * @returns Un panel con botones para tirar dados rapidos y opciones predefinidas para situaciones comunes como ventaja o desventaja.
 */
interface DiceRollerProps {
  onRoll: (
    label: string,
    modifiers: { label: string; value: number }[],
    diceType: number,
    mode?: DiceRollMode,
  ) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

/**
 * Ofrece un tablero de dados rapidos y accesos directos para ventaja y
 * desventaja durante la partida.
 * @param onRoll Funcion a ejecutar al seleccionar una opcion de tirada rapida, recibe el label descriptivo, los modificadores aplicables, el tipo de dado y el modo de tirada.
 * @param isOpen Indica si el panel de tiradas rapidas esta desplegado o plegado.
 * @param onToggle Funcion a ejecutar al hacer click en el control de plegado, normalmente para alternar el estado de isOpen.
 * @returns Un panel con botones para tirar dados rapidos y opciones predefinidas para situaciones comunes como ventaja o desventaja.
 */
export function DiceRoller({ onRoll, isOpen, onToggle }: DiceRollerProps) {
  return (
    <SectionShell
      title="TIRADOR DE DADOS"
      isOpen={isOpen}
      onToggle={onToggle}
      headerDivider
    >
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {DICE_TYPES.map((dice) => (
          <Popover
            key={dice.sides}
            content={<div>{dice.label}</div>}
            side="top"
            align="center"
          >
            <button
              onClick={() => onRoll(`Tirada de ${dice.label}`, [], dice.sides)}
              className={`
                relative group flex flex-col items-center justify-center p-3 rounded-lg
                bg-secondary/50 border border-border
                hover:border-gold hover:bg-gold/10
                transition-all duration-200 hover:scale-105
                active:scale-95
              `}
              aria-label={`Tirar un ${dice.label}`}
            >
              <div className={`relative ${dice.color}`}>
                <DiceIcon sides={dice.sides} className="w-8 h-8" />
              </div>
              <span className="text-xs mt-1 text-muted-foreground group-hover:text-gold transition-colors">
                {dice.label}
              </span>
            </button>
          </Popover>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <QuickRollWithModifier onRoll={onRoll} />
      </div>
    </SectionShell>
  );
}

/**
 * Agrupa atajos de tirada comunes para agilizar situaciones frecuentes.
 * Actualmente incluye opciones para tirar con ventaja o desventaja, pero se pueden expandir con mas modos o combinaciones de modificadores.
 * @param onRoll Funcion a ejecutar al seleccionar una opcion de tirada rapida, recibe el label descriptivo, los modificadores aplicables, el tipo de dado y el modo de tirada.
 * @returns Un conjunto de botones para realizar tiradas rapidas con configuraciones predefinidas.
 */
function QuickRollWithModifier({
  onRoll,
}: {
  onRoll: (
    label: string,
    modifiers: { label: string; value: number }[],
    diceType: number,
    mode?: DiceRollMode,
  ) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 items-center justify-center">
      <button
        onClick={() =>
          onRoll("Ventaja (2d20 elige el mayor)", [], 20, "advantage")
        }
        className="px-3 py-1.5 text-xs rounded bg-success/20 border border-success/50 
          text-success hover:bg-success/30 transition-colors"
      >
        Ventaja
      </button>
      <button
        onClick={() =>
          onRoll("Desventaja (2d20 elige el menor)", [], 20, "disadvantage")
        }
        className="px-3 py-1.5 text-xs rounded bg-blood-red/10 border border-blood-red/50 
          text-blood-red hover:bg-blood-red/30 transition-colors"
      >
        Desventaja
      </button>
    </div>
  );
}

/**
 * Dibuja la representacion visual de cada tipo de dado usado en el panel de
 * tiradas rapidas.
 * @param sides Cantidad de caras del dado (4, 6, 8, 10, 12, 20, 100)
 * @param className Clases adicionales para personalizar el estilo del icono
 * @returns Un SVG con la forma y numero correspondiente al tipo de dado
 */
function DiceIcon({
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
    case 20:
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <polygon
            points="12,2 22,8 19,20 5,20 2,8"
            fillOpacity="0.3"
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
            20
          </text>
        </svg>
      );
    case 100:
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <circle
            cx="12"
            cy="12"
            r="9"
            fillOpacity="0.3"
            stroke="currentColor"
            strokeWidth="1"
          />
          <text
            x="12"
            y="14"
            textAnchor="middle"
            fontSize="5"
            fill="currentColor"
          >
            100
          </text>
        </svg>
      );
    default:
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
        </svg>
      );
  }
}
