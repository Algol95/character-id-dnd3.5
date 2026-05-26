import { SectionShell } from "./sectionShell";
import {
  formatModifier,
  getAbilityModifier,
  type CharacterData,
} from "@/lib/character-types";

/**
 * Dibuja un icono de dado simple para controles de combate auxiliares.
 */
// Inline dice icon component to avoid button nesting issues
function DiceIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`w-4 h-4 ${className}`}
      fill="currentColor"
    >
      <path d="M12 2L2 9l10 13 10-13L12 2zm0 3.84L18.26 9 12 18.54 5.74 9 12 5.84z" />
    </svg>
  );
}

/**
 * Renderiza un boton pequeno para ejecutar tiradas de combate puntuales.
 */
// Dice button component for standalone use
function DiceRollButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-6 h-6 flex items-center justify-center rounded transition-all duration-200 
        bg-secondary hover:bg-gold/20 border border-gold-dim hover:border-gold
        text-gold-dim hover:text-gold hover:shadow-[0_0_10px_var(--gold-dim)] active:scale-95"
      title="Tirar dado"
      aria-label="Tirar dado"
    >
      <DiceIcon />
    </button>
  );
}

/**
 * Propiedades de la seccion de combate.
 */
interface CombatProps {
  character: CharacterData;
  onChange: (updates: Partial<CharacterData>) => void;
  onRollInitiative: (modifiers: { label: string; value: number }[]) => void;
  onRollAttack: (
    attackName: string,
    modifiers: { label: string; value: number }[],
  ) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

/**
 * Agrupa los valores y accesos rapidos relacionados con el combate del
 * personaje.
 */
export function Combat({
  character,
  onChange,
  onRollInitiative,
  onRollAttack,
  isOpen,
  onToggle,
}: CombatProps) {
  const dexMod = getAbilityModifier(character.dexterity);
  const strMod = getAbilityModifier(character.strength);
  const initiativeTotal = dexMod + character.initiative;

  return (
    <SectionShell title="COMBATE" isOpen={isOpen} onToggle={onToggle}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column - HP & AC */}
        <div className="space-y-3">
          {/* Hit Points */}
          <div className="p-3 rounded bg-secondary/30 border border-border/50">
            <div className="text-xs text-muted-foreground mb-1 text-center">
              PUNTOS DE GOLPE
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="text-center">
                <input
                  type="number"
                  value={character.currentHp}
                  onChange={(e) =>
                    onChange({ currentHp: parseInt(e.target.value) || 0 })
                  }
                  className="w-16 text-center text-2xl font-bold rounded bg-input border border-border py-1"
                />
                <div className="text-xs text-muted-foreground">Actual</div>
              </div>
              <span className="text-2xl text-muted-foreground">/</span>
              <div className="text-center">
                <input
                  type="number"
                  value={character.hp}
                  onChange={(e) =>
                    onChange({ hp: parseInt(e.target.value) || 0 })
                  }
                  className="w-16 text-center text-2xl font-bold rounded bg-input border border-border py-1"
                />
                <div className="text-xs text-muted-foreground">Max.</div>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-xs text-muted-foreground">No letal:</span>
              <input
                type="number"
                value={character.nonlethalDamage}
                onChange={(e) =>
                  onChange({ nonlethalDamage: parseInt(e.target.value) || 0 })
                }
                className="w-12 text-center text-sm rounded bg-input border border-border py-0.5"
              />
            </div>
          </div>

          {/* Armor Class */}
          <div className="p-3 rounded bg-secondary/30 border border-border/50">
            <div className="text-xs text-muted-foreground mb-2 text-center">
              CLASE DE ARMADURA
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <input
                  type="number"
                  value={character.armorClass}
                  onChange={(e) =>
                    onChange({ armorClass: parseInt(e.target.value) || 0 })
                  }
                  className="w-14 text-center text-xl font-bold rounded bg-input border border-border py-1"
                />
                <div className="text-xs text-muted-foreground">AC</div>
              </div>
              <div className="text-center">
                <input
                  type="number"
                  value={character.touchAC}
                  onChange={(e) =>
                    onChange({ touchAC: parseInt(e.target.value) || 0 })
                  }
                  className="w-14 text-center text-xl font-bold rounded bg-input border border-border py-1"
                />
                <div className="text-xs text-muted-foreground">Toque</div>
              </div>
              <div className="text-center">
                <input
                  type="number"
                  value={character.flatFootedAC}
                  onChange={(e) =>
                    onChange({ flatFootedAC: parseInt(e.target.value) || 0 })
                  }
                  className="w-14 text-center text-xl font-bold rounded bg-input border border-border py-1"
                />
                <div className="text-xs text-muted-foreground">
                  Desprevenido
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Initiative, BAB, Speed */}
        <div className="space-y-3">
          {/* Initiative */}
          <div className="p-3 rounded bg-secondary/30 border border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Iniciativa</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-gold">
                  {formatModifier(initiativeTotal)}
                </span>
                <DiceRollButton
                  onClick={() =>
                    onRollInitiative([
                      { label: "DEX", value: dexMod },
                      ...(character.initiative !== 0
                        ? [{ label: "Varios", value: character.initiative }]
                        : []),
                    ])
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm">
              <span className="text-muted-foreground">
                = {formatModifier(dexMod)} DEX +
              </span>
              <input
                type="number"
                value={character.initiative}
                onChange={(e) =>
                  onChange({ initiative: parseInt(e.target.value) || 0 })
                }
                className="w-10 text-center text-sm rounded bg-input border border-border py-0.5"
              />
              <span className="text-muted-foreground">varios</span>
            </div>
          </div>

          {/* Base Attack Bonus */}
          <div className="p-3 rounded bg-secondary/30 border border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Bono base de ataque</span>
              <input
                type="number"
                value={character.baseAttackBonus}
                onChange={(e) =>
                  onChange({ baseAttackBonus: parseInt(e.target.value) || 0 })
                }
                className="w-14 text-center text-xl font-bold rounded bg-input border border-border py-1"
              />
            </div>
          </div>

          {/* Speed */}
          <div className="p-3 rounded bg-secondary/30 border border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Velocidad</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={character.speed}
                  onChange={(e) =>
                    onChange({ speed: parseInt(e.target.value) || 0 })
                  }
                  className="w-14 text-center text-xl font-bold rounded bg-input border border-border py-1"
                />
                <span className="text-sm text-muted-foreground">pies</span>
              </div>
            </div>
          </div>

          {/* Melee/Ranged Attack Shortcuts */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() =>
                onRollAttack("Ataque cuerpo a cuerpo", [
                  { label: "BBA", value: character.baseAttackBonus },
                  { label: "STR", value: strMod },
                ])
              }
              className="flex items-center justify-center gap-2 p-2 rounded bg-secondary/50 
                border border-border hover:border-gold hover:bg-gold/10 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 text-gold-dim"
                fill="currentColor"
              >
                <path d="M12 2L2 9l10 13 10-13L12 2zm0 3.84L18.26 9 12 18.54 5.74 9 12 5.84z" />
              </svg>
              <span className="text-sm">
                Cuerpo a cuerpo{" "}
                {formatModifier(character.baseAttackBonus + strMod)}
              </span>
            </button>
            <button
              onClick={() =>
                onRollAttack("Ataque a distancia", [
                  { label: "BBA", value: character.baseAttackBonus },
                  { label: "DEX", value: dexMod },
                ])
              }
              className="flex items-center justify-center gap-2 p-2 rounded bg-secondary/50 
                border border-border hover:border-gold hover:bg-gold/10 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 text-gold-dim"
                fill="currentColor"
              >
                <path d="M12 2L2 9l10 13 10-13L12 2zm0 3.84L18.26 9 12 18.54 5.74 9 12 5.84z" />
              </svg>
              <span className="text-sm">
                A distancia {formatModifier(character.baseAttackBonus + dexMod)}
              </span>
            </button>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
