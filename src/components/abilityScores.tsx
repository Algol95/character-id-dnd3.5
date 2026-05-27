import { DiceButton } from "./diceButton";
import { FormNumberInput } from "@/components/formNumberInput";
import { SectionShell } from "./sectionShell";
import {
  formatModifier,
  getAbilityModifier,
  type CharacterData,
} from "@/lib/character-types";
import type { EquipmentBonuses } from "@/lib/equipment-effects";

/**
 * Propiedades de la seccion de caracteristicas del personaje.
 */
interface AbilityScoresProps {
  character: CharacterData;
  equipmentBonuses: EquipmentBonuses;
  onChange: (updates: Partial<CharacterData>) => void;
  onRollAbility: (ability: string, modifier: number) => void;
  onRollInitiative: (modifiers: { label: string; value: number }[]) => void;
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
  equipmentBonuses,
  onChange,
  onRollAbility,
  onRollInitiative,
  isOpen,
  onToggle,
}: AbilityScoresProps) {
  const dexMod = getAbilityModifier(
    character.dexterity + equipmentBonuses.abilityBonuses.dexterity,
  );
  const initiativeTotal =
    dexMod + character.initiative + equipmentBonuses.initiative;
  const armorClassTotal = character.armorClass + equipmentBonuses.armorClass;
  const touchACTotal = character.touchAC + equipmentBonuses.touchAC;
  const flatFootedACTotal =
    character.flatFootedAC + equipmentBonuses.flatFootedAC;
  const hpCurrent = character.currentHp;
  const hpMax = Math.max(character.hp, 0);
  const hpSafeMax = Math.max(hpMax, 1);
  const hpRatio = hpCurrent / hpSafeMax;
  const hpBarRatio = Math.max(0, Math.min(hpRatio, 1));
  const hpPercentage = Math.round(hpBarRatio * 100);
  const isDead = hpCurrent <= -10;
  const isUnconscious = hpCurrent <= 0 && hpCurrent > -10;
  const hpStatusLabel = isDead
    ? ""
    : isUnconscious
      ? "Inconsciente"
      : hpRatio <= 0.25
        ? "Critico"
        : hpRatio <= 0.5
          ? "Herido"
          : hpRatio <= 0.75
            ? "Estable"
            : "Fuerte";
  const hpStatusDescription = isDead
    ? "Muerto"
    : isUnconscious
      ? "Inconsciente."
      : `${hpPercentage}% disponible`;
  const hpBarToneClass = isDead
    ? "from-zinc-700 via-zinc-500 to-zinc-300"
    : isUnconscious
      ? "from-violet-900 via-violet-700 to-violet-400"
      : hpRatio <= 0.25
        ? "from-red-700 via-red-500 to-amber-400"
        : hpRatio <= 0.5
          ? "from-orange-700 via-orange-500 to-amber-300"
          : hpRatio <= 0.75
            ? "from-amber-700 via-gold to-yellow-200"
            : "from-emerald-700 via-emerald-500 to-lime-300";
  const hpStatusToneClass = isDead
    ? "border-zinc-400/35 bg-zinc-900/60 text-zinc-100"
    : isUnconscious
      ? "border-violet-400/35 bg-violet-950/35 text-violet-100"
      : hpRatio <= 0.25
        ? "border-red-400/35 bg-red-950/35 text-red-100"
        : hpRatio <= 0.5
          ? "border-orange-400/35 bg-orange-950/30 text-orange-100"
          : hpRatio <= 0.75
            ? "border-gold/30 bg-gold/12 text-gold"
            : "border-emerald-400/35 bg-emerald-950/30 text-emerald-100";
  const hpValueToneClass = isDead
    ? "text-zinc-100"
    : isUnconscious
      ? "text-violet-100"
      : "text-gold";

  return (
    <SectionShell title="CARACTERISTICAS" isOpen={isOpen} onToggle={onToggle}>
      <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4 shadow-[0_10px_24px_rgba(0,0,0,0.12)]">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-border/50 pb-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-gold/80">
              Datos de combate
            </p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">
              Supervivencia y capacidad ofensiva
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            <div className="rounded-[1.7rem] border border-gold/35 bg-[radial-gradient(circle_at_top,rgba(217,160,58,0.18),transparent_42%),linear-gradient(145deg,rgba(93,20,21,0.94),rgba(28,14,11,0.96))] p-5 shadow-[0_18px_34px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,215,130,0.12)]">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-[0.24em] text-gold/85">
                    PUNTOS DE GOLPE
                  </p>
                  <div className="mt-2 flex items-end gap-3">
                    <p
                      className={`min-w-[2.6ch] text-right text-5xl font-black leading-none tabular-nums drop-shadow-[0_2px_18px_rgba(217,160,58,0.25)] ${hpValueToneClass}`}
                    >
                      {hpCurrent}
                    </p>
                    <div className="min-w-0 pb-1 text-left">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground/90">
                        de {hpMax}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {hpStatusDescription}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${hpStatusToneClass}`}
                  >
                    {isDead ? (
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        className="h-3.5 w-3.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path
                          d="M9 9.25h.01M15 9.25h.01M9.25 14.5c1.1-.8 4.4-.8 5.5 0M12 3c4.05 0 7.34 2.98 7.34 6.66 0 1.97-.94 3.74-2.42 4.96V18a1 1 0 0 1-1 1H14.4l-.9 2h-3l-.9-2H8.08a1 1 0 0 1-1-1v-3.38C5.6 13.4 4.66 11.63 4.66 9.66 4.66 5.98 7.95 3 12 3Z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                    {hpStatusLabel}
                  </span>
                  <p className="mt-2 text-xs text-foreground/75">
                    Estado vital actual
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="h-3 overflow-hidden rounded-full border border-gold/20 bg-black/25 shadow-[inset_0_1px_3px_rgba(0,0,0,0.35)]">
                  <div
                    className={`h-full rounded-full bg-linear-to-r ${hpBarToneClass} transition-[width] duration-300`}
                    style={{ width: `${hpPercentage}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-3">
                <div className="rounded-2xl border border-gold/20 bg-black/15 px-4 py-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-foreground/80">
                    Actuales
                  </div>
                  <FormNumberInput
                    value={character.currentHp}
                    onChange={(value) =>
                      onChange({ currentHp: parseInt(value, 10) || 0 })
                    }
                    className="mt-3 w-full"
                    inputClassName="rounded-xl border-gold/35 bg-background/55 py-2 text-center text-3xl font-black text-gold shadow-[0_0_18px_rgba(217,160,58,0.12)]"
                    ariaLabel="Puntos de golpe actuales"
                    compact
                  />
                </div>

                <span className="pb-4 text-4xl font-light text-gold/50">/</span>

                <div className="rounded-2xl border border-gold/12 bg-black/10 px-4 py-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-foreground/80">
                    Maximos
                  </div>
                  <FormNumberInput
                    value={character.hp}
                    onChange={(value) =>
                      onChange({ hp: parseInt(value, 10) || 0 })
                    }
                    className="mt-3 w-full"
                    inputClassName="rounded-xl border-gold/20 bg-background/40 py-2 text-center text-3xl font-black text-foreground"
                    ariaLabel="Puntos de golpe maximos"
                    compact
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-gold/15 bg-black/15 px-3 py-2.5">
                <div>
                  <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Dano no letal
                  </span>
                  <p className="mt-1 text-xs text-foreground/70">
                    Se acumula por separado del dano normal.
                  </p>
                </div>
                <FormNumberInput
                  value={character.nonlethalDamage}
                  onChange={(value) =>
                    onChange({ nonlethalDamage: parseInt(value, 10) || 0 })
                  }
                  className="w-16 shrink-0"
                  inputClassName="rounded-lg bg-background/60 py-1 text-center text-base font-bold text-foreground"
                  ariaLabel="Dano no letal"
                  compact
                />
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/20 p-4">
              <div className="text-xs text-muted-foreground text-center">
                CLASE DE ARMADURA
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3">
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
                  <div className="mt-1 text-xs text-muted-foreground">
                    Base AC
                  </div>
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
                  <div className="text-[11px] text-muted-foreground">Toque</div>
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
                  <div className="mt-1 text-xs text-muted-foreground">
                    Base toque
                  </div>
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
                  <div className="text-[11px] text-muted-foreground">
                    Desprev.
                  </div>
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
                  <div className="mt-1 text-xs text-muted-foreground">
                    Base desp.
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-2xl border border-border/60 bg-background/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Iniciativa
                  </p>
                  <p className="mt-2 text-3xl font-bold leading-none text-gold">
                    {formatModifier(initiativeTotal)}
                  </p>
                </div>

                <DiceButton
                  size="sm"
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

              <div className="mt-3 flex items-center gap-2 text-sm">
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
              </div>

              {equipmentBonuses.initiative !== 0 ? (
                <div className="mt-2 text-xs text-gold/75">
                  Equipo {formatModifier(equipmentBonuses.initiative)}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Bono base de ataque
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-3xl font-bold leading-none text-gold">
                  {formatModifier(character.baseAttackBonus)}
                </p>
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

            <div className="rounded-2xl border border-border/60 bg-background/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Velocidad
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-3xl font-bold leading-none text-gold">
                    {character.speed}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">pies</p>
                </div>
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
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {ABILITIES.map(({ key, label, name, tempKey }) => {
          const baseScore = character[key as keyof CharacterData] as number;
          const tempScore = character[tempKey as keyof CharacterData] as
            | number
            | null;
          const equipmentBonus = equipmentBonuses.abilityBonuses[key] ?? 0;
          const effectiveScore = (tempScore ?? baseScore) + equipmentBonus;
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
                  {equipmentBonus !== 0 ? (
                    <p className="mt-2 text-xs text-gold">
                      Equipo {formatModifier(equipmentBonus)}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Base
                  </span>
                  <FormNumberInput
                    value={baseScore}
                    onChange={(value) =>
                      onChange({ [key]: parseInt(value, 10) || 0 })
                    }
                    className="w-full"
                    inputClassName="rounded-xl px-3 py-2.5 text-center text-sm font-medium"
                    min={1}
                    max={99}
                    ariaLabel={`Valor base de ${name}`}
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Temporal
                  </span>
                  <FormNumberInput
                    value={tempScore ?? ""}
                    onChange={(value) => {
                      onChange({
                        [tempKey]:
                          value === "" ? null : parseInt(value, 10) || 0,
                      });
                    }}
                    placeholder="Opcional"
                    className="w-full"
                    inputClassName="rounded-xl px-3 py-2.5 text-center text-sm font-medium placeholder:text-sm placeholder:font-medium placeholder:text-muted-foreground/70"
                    ariaLabel={`Valor temporal de ${name}`}
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
