import { FormNumberInput } from "@/components/formNumberInput";
import { SectionShell } from "./sectionShell";
import {
  formatModifier,
  getAbilityModifier,
  type CharacterData,
} from "@/lib/character-types";
import type { EquipmentBonuses } from "@/lib/equipment-effects";

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
  equipmentBonuses: EquipmentBonuses;
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
  equipmentBonuses,
  onChange,
  onRollInitiative,
  onRollAttack,
  isOpen,
  onToggle,
}: CombatProps) {
  const dexMod = getAbilityModifier(
    character.dexterity + equipmentBonuses.abilityBonuses.dexterity,
  );
  const strMod = getAbilityModifier(
    character.strength + equipmentBonuses.abilityBonuses.strength,
  );
  const initiativeTotal =
    dexMod + character.initiative + equipmentBonuses.initiative;
  const armorClassTotal = character.armorClass + equipmentBonuses.armorClass;
  const touchACTotal = character.touchAC + equipmentBonuses.touchAC;
  const flatFootedACTotal =
    character.flatFootedAC + equipmentBonuses.flatFootedAC;

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
                <FormNumberInput
                  value={character.currentHp}
                  onChange={(value) =>
                    onChange({ currentHp: parseInt(value, 10) || 0 })
                  }
                  className="w-18"
                  inputClassName="rounded bg-input py-1 text-center text-2xl font-bold"
                  ariaLabel="Puntos de golpe actuales"
                  compact
                />
                <div className="text-xs text-muted-foreground">Actual</div>
              </div>
              <span className="text-2xl text-muted-foreground">/</span>
              <div className="text-center">
                <FormNumberInput
                  value={character.hp}
                  onChange={(value) =>
                    onChange({ hp: parseInt(value, 10) || 0 })
                  }
                  className="w-18"
                  inputClassName="rounded bg-input py-1 text-center text-2xl font-bold"
                  ariaLabel="Puntos de golpe maximos"
                  compact
                />
                <div className="text-xs text-muted-foreground">Max.</div>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-xs text-muted-foreground">No letal:</span>
              <FormNumberInput
                value={character.nonlethalDamage}
                onChange={(value) =>
                  onChange({ nonlethalDamage: parseInt(value, 10) || 0 })
                }
                className="w-14"
                inputClassName="rounded bg-input py-0.5 text-center text-sm"
                ariaLabel="Dano no letal"
                compact
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
                <div className="text-2xl font-bold text-gold">
                  {armorClassTotal}
                </div>
                <div className="text-[11px] text-muted-foreground">Total</div>
                <FormNumberInput
                  value={character.armorClass}
                  onChange={(value) =>
                    onChange({ armorClass: parseInt(value, 10) || 0 })
                  }
                  className="mt-2 w-16"
                  inputClassName="rounded bg-input py-1 text-center text-sm font-semibold"
                  ariaLabel="Clase de armadura base"
                  compact
                />
                <div className="text-xs text-muted-foreground">Base AC</div>
                {equipmentBonuses.armorClass !== 0 ? (
                  <div className="text-[10px] text-gold/75">
                    Eq. {formatModifier(equipmentBonuses.armorClass)}
                  </div>
                ) : null}
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gold">
                  {touchACTotal}
                </div>
                <div className="text-[11px] text-muted-foreground">Total</div>
                <FormNumberInput
                  value={character.touchAC}
                  onChange={(value) =>
                    onChange({ touchAC: parseInt(value, 10) || 0 })
                  }
                  className="mt-2 w-16"
                  inputClassName="rounded bg-input py-1 text-center text-sm font-semibold"
                  ariaLabel="Clase de armadura de toque base"
                  compact
                />
                <div className="text-xs text-muted-foreground">Base toque</div>
                {equipmentBonuses.touchAC !== 0 ? (
                  <div className="text-[10px] text-gold/75">
                    Eq. {formatModifier(equipmentBonuses.touchAC)}
                  </div>
                ) : null}
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gold">
                  {flatFootedACTotal}
                </div>
                <div className="text-[11px] text-muted-foreground">Total</div>
                <FormNumberInput
                  value={character.flatFootedAC}
                  onChange={(value) =>
                    onChange({ flatFootedAC: parseInt(value, 10) || 0 })
                  }
                  className="mt-2 w-16"
                  inputClassName="rounded bg-input py-1 text-center text-sm font-semibold"
                  ariaLabel="Clase de armadura desprevenido base"
                  compact
                />
                <div className="text-xs text-muted-foreground">
                  Base desprevenido
                </div>
                {equipmentBonuses.flatFootedAC !== 0 ? (
                  <div className="text-[10px] text-gold/75">
                    Eq. {formatModifier(equipmentBonuses.flatFootedAC)}
                  </div>
                ) : null}
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
                      ...(equipmentBonuses.initiative !== 0
                        ? [
                            {
                              label: "Equipo",
                              value: equipmentBonuses.initiative,
                            },
                          ]
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
              <FormNumberInput
                value={character.initiative}
                onChange={(value) =>
                  onChange({ initiative: parseInt(value, 10) || 0 })
                }
                className="w-12"
                inputClassName="rounded bg-input py-0.5 text-center text-sm"
                ariaLabel="Modificador varios de iniciativa"
                compact
              />
              <span className="text-muted-foreground">varios</span>
              {equipmentBonuses.initiative !== 0 ? (
                <span className="text-gold">
                  + {formatModifier(equipmentBonuses.initiative)} equipo
                </span>
              ) : null}
            </div>
          </div>

          {/* Base Attack Bonus */}
          <div className="p-3 rounded bg-secondary/30 border border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Bono base de ataque</span>
              <FormNumberInput
                value={character.baseAttackBonus}
                onChange={(value) =>
                  onChange({ baseAttackBonus: parseInt(value, 10) || 0 })
                }
                className="w-18"
                inputClassName="rounded bg-input py-1 text-center text-xl font-bold"
                ariaLabel="Bono base de ataque"
                compact
              />
            </div>
          </div>

          {/* Speed */}
          <div className="p-3 rounded bg-secondary/30 border border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Velocidad</span>
              <div className="flex items-center gap-1">
                <FormNumberInput
                  value={character.speed}
                  onChange={(value) =>
                    onChange({ speed: parseInt(value, 10) || 0 })
                  }
                  className="w-18"
                  inputClassName="rounded bg-input py-1 text-center text-xl font-bold"
                  ariaLabel="Velocidad en pies"
                  compact
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
