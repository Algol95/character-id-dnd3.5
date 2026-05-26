import { DiceButton } from "./diceButton";
import { SectionShell } from "./sectionShell";
import {
  formatModifier,
  getAbilityModifier,
  type CharacterData,
} from "@/lib/character-types";

/**
 * Propiedades de la seccion de caracteristicas del personaje.
 */
interface AbilityScoresProps {
  character: CharacterData;
  onChange: (updates: Partial<CharacterData>) => void;
  onRollAbility: (ability: string, modifier: number) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

const ABILITIES = [
  {
    key: "strength",
    label: "STR",
    name: "Fuerza",
    tempKey: "tempStrength",
  },
  {
    key: "dexterity",
    label: "DEX",
    name: "Destreza",
    tempKey: "tempDexterity",
  },
  {
    key: "constitution",
    label: "CON",
    name: "Constitucion",
    tempKey: "tempConstitution",
  },
  {
    key: "intelligence",
    label: "INT",
    name: "Inteligencia",
    tempKey: "tempIntelligence",
  },
  { key: "wisdom", label: "WIS", name: "Sabiduria", tempKey: "tempWisdom" },
  { key: "charisma", label: "CHA", name: "Carisma", tempKey: "tempCharisma" },
] as const;

/**
 * Renderiza las seis caracteristicas principales con sus valores base,
 * ajustes temporales y botones de tirada asociados.
 */
export function AbilityScores({
  character,
  onChange,
  onRollAbility,
  isOpen,
  onToggle,
}: AbilityScoresProps) {
  return (
    <SectionShell title="CARACTERISTICAS" isOpen={isOpen} onToggle={onToggle}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {ABILITIES.map(({ key, label, name, tempKey }) => {
          const baseScore = character[key as keyof CharacterData] as number;
          const tempScore = character[tempKey as keyof CharacterData] as
            | number
            | null;
          const effectiveScore = tempScore ?? baseScore;
          const modifier = getAbilityModifier(effectiveScore);

          return (
            <div
              key={key}
              className="rounded-2xl border border-border/60 bg-secondary/25 p-4 shadow-[0_10px_24px_rgba(0,0,0,0.12)]"
            >
              <div className="grid grid-cols-[1fr_auto] items-start gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full border border-gold/20 bg-gold/10 px-2.5 py-1 text-[11px] font-bold tracking-[0.22em] text-gold">
                      {label}
                    </span>
                    <h3 className="text-lg font-semibold leading-tight text-foreground">
                      {name}
                    </h3>
                  </div>
                </div>

                <DiceButton
                  size="sm"
                  onClick={() => onRollAbility(`Prueba de ${label}`, modifier)}
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-gold/15 bg-background/35 px-4 py-4 text-center">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Modificador
                  </p>
                  <p className="mt-3 text-4xl font-bold leading-none text-gold">
                    {formatModifier(modifier)}
                  </p>
                </div>

                <div className="rounded-xl border border-border/60 bg-background/20 px-4 py-4 text-center">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Valor actual
                  </p>
                  <p className="mt-3 text-3xl font-semibold leading-none text-foreground">
                    {effectiveScore}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Base
                  </span>
                  <input
                    type="number"
                    value={baseScore}
                    onChange={(e) =>
                      onChange({ [key]: parseInt(e.target.value) || 0 })
                    }
                    className="w-full rounded-xl px-3 py-2.5 text-center text-sm font-medium"
                    min={1}
                    max={99}
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Temporal
                  </span>
                  <input
                    type="number"
                    value={tempScore ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      onChange({
                        [tempKey]: val === "" ? null : parseInt(val) || 0,
                      });
                    }}
                    placeholder="Opcional"
                    className="w-full rounded-xl px-3 py-2.5 text-center text-sm font-medium placeholder:text-sm placeholder:font-medium placeholder:text-muted-foreground/70"
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}
