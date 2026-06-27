import { useState } from "react";
import { DiceButton } from "./diceButton";
import { FormNumberInput } from "./formNumberInput";
import { SectionShell } from "./sectionShell";
import type {
  CharacterData,
  DailySpellEntry,
  SpellLevelData,
} from "@/lib/character-types";

interface SpellsProps {
  character: CharacterData;
  onChange: (updates: Partial<CharacterData>) => void;
  onRollArcaneFailure: (failureChance: number) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

function createDailySpellEntry(): DailySpellEntry {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return {
      id: `daily-spell-${crypto.randomUUID()}`,
      name: "",
      totalUses: 1,
      remainingUses: 1,
    };
  }

  return {
    id: `daily-spell-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    totalUses: 1,
    remainingUses: 1,
  };
}

function getSpellLevelLabel(level: number) {
  return `${level}`;
}

function clampSpellUses(value: string) {
  return Math.max(0, Number.parseInt(value, 10) || 0);
}

function getSpellLevelCapacity(spellLevel: SpellLevelData) {
  return Math.max(0, spellLevel.dailySpells + spellLevel.additionalSpells);
}

function getDailyEntriesTotalUses(entries: DailySpellEntry[]) {
  return entries.reduce((sum, entry) => sum + entry.totalUses, 0);
}

function clampDailyEntriesToCapacity(
  entries: DailySpellEntry[],
  capacity: number,
) {
  let remainingCapacity = Math.max(0, capacity);

  return entries.map((entry) => {
    const nextTotalUses = Math.max(
      0,
      Math.min(entry.totalUses, remainingCapacity),
    );
    remainingCapacity -= nextTotalUses;

    return {
      ...entry,
      totalUses: nextTotalUses,
      remainingUses: Math.max(0, Math.min(entry.remainingUses, nextTotalUses)),
    };
  });
}

export function Spells({
  character,
  onChange,
  onRollArcaneFailure,
  isOpen,
  onToggle,
}: SpellsProps) {
  const spellLevels = character.spellcasting.spellLevels;
  const [selectedLevel, setSelectedLevel] = useState(0);

  const selectedSpellLevel =
    spellLevels.find((spellLevel) => spellLevel.level === selectedLevel) ??
    spellLevels[0];

  const specializationCount = character.spellcasting.specializations
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean).length;
  const selectedLevelRemainingUses = selectedSpellLevel.dailyEntries.reduce(
    (sum, entry) => sum + entry.remainingUses,
    0,
  );
  const selectedLevelCapacity = getSpellLevelCapacity(selectedSpellLevel);
  const selectedLevelAssignedUses = getDailyEntriesTotalUses(
    selectedSpellLevel.dailyEntries,
  );

  const updateSpellcasting = (
    updates: Partial<CharacterData["spellcasting"]>,
  ) => {
    onChange({
      spellcasting: {
        ...character.spellcasting,
        ...updates,
      },
    });
  };

  const updateSpellLevel = (
    level: number,
    updates: Partial<SpellLevelData>,
  ) => {
    updateSpellcasting({
      spellLevels: character.spellcasting.spellLevels.map((spellLevel) => {
        if (spellLevel.level !== level) {
          return spellLevel;
        }

        const nextSpellLevel = { ...spellLevel, ...updates };

        return {
          ...nextSpellLevel,
          dailyEntries: clampDailyEntriesToCapacity(
            nextSpellLevel.dailyEntries,
            getSpellLevelCapacity(nextSpellLevel),
          ),
        };
      }),
    });
  };

  const updateDailySpellEntry = (
    level: number,
    entryId: string,
    updates: Partial<DailySpellEntry>,
  ) => {
    const spellLevel = character.spellcasting.spellLevels.find(
      (entry) => entry.level === level,
    );

    if (!spellLevel) {
      return;
    }

    const capacity = getSpellLevelCapacity(spellLevel);
    const otherEntriesTotalUses = spellLevel.dailyEntries.reduce(
      (sum, entry) => (entry.id === entryId ? sum : sum + entry.totalUses),
      0,
    );
    const maxAllowedUsesForEntry = Math.max(
      0,
      capacity - otherEntriesTotalUses,
    );

    updateSpellLevel(level, {
      dailyEntries: spellLevel.dailyEntries.map((entry) => {
        if (entry.id !== entryId) {
          return entry;
        }

        const nextEntry = { ...entry, ...updates };
        const nextTotalUses = Math.min(
          Math.max(0, nextEntry.totalUses),
          maxAllowedUsesForEntry,
        );

        return {
          ...nextEntry,
          totalUses: nextTotalUses,
          remainingUses: Math.max(
            0,
            Math.min(nextTotalUses, nextEntry.remainingUses),
          ),
        };
      }),
    });
  };

  const addDailySpellEntry = (level: number) => {
    const spellLevel = character.spellcasting.spellLevels.find(
      (entry) => entry.level === level,
    );

    if (!spellLevel) {
      return;
    }

    const remainingCapacity = Math.max(
      0,
      getSpellLevelCapacity(spellLevel) -
        getDailyEntriesTotalUses(spellLevel.dailyEntries),
    );

    updateSpellLevel(level, {
      dailyEntries: [
        ...spellLevel.dailyEntries,
        {
          ...createDailySpellEntry(),
          totalUses: Math.min(1, remainingCapacity),
          remainingUses: Math.min(1, remainingCapacity),
        },
      ],
    });
  };

  const removeDailySpellEntry = (level: number, entryId: string) => {
    const spellLevel = character.spellcasting.spellLevels.find(
      (entry) => entry.level === level,
    );

    if (!spellLevel) {
      return;
    }

    updateSpellLevel(level, {
      dailyEntries: spellLevel.dailyEntries.filter(
        (entry) => entry.id !== entryId,
      ),
    });
  };

  return (
    <SectionShell title="CONJUROS" isOpen={isOpen} onToggle={onToggle}>
      <div className="min-w-0 space-y-4">
        <div className="min-w-0 rounded-[20px] border border-gold/18 bg-gradient-to-br from-gold/8 via-background/15 to-background/30 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-gold/80">
                Enfoque magico
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Dominios, escuelas o especializacion.
              </div>
            </div>

            <div className="rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-xs text-gold">
              {specializationCount}
            </div>
          </div>

          <textarea
            value={character.spellcasting.specializations}
            onChange={(event) =>
              updateSpellcasting({ specializations: event.target.value })
            }
            className="h-28 w-full rounded-2xl border border-border/70 bg-input/90 px-4 py-3 text-sm leading-6 resize-none"
            placeholder="Escribe aqui los dominios, escuelas o especializaciones magicas...&#10;&#10;- Evocacion&#10;- Nigromancia&#10;- Dominio del Sol"
          />
        </div>

        <div className="min-w-0 rounded-[20px] border border-border/60 bg-background/25 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <div className="mb-3 space-y-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-gold/80">
                Lanzamiento
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Fallo arcano, resumen y modificadores situacionales.
              </div>
            </div>
          </div>

          <div className="min-w-0 mb-4 rounded-2xl border border-border/60 bg-background/20 p-3">
            <div className="min-w-0 flex flex-wrap items-center gap-3">
              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground/80">
                Fallo arcano
              </span>

              <div className="flex items-center gap-2">
                <FormNumberInput
                  value={character.spellcasting.arcaneFailureChance}
                  onChange={(value) =>
                    updateSpellcasting({
                      arcaneFailureChance: Math.max(
                        0,
                        Math.min(100, Number.parseInt(value, 10) || 0),
                      ),
                    })
                  }
                  min={0}
                  max={100}
                  className="w-24"
                  inputClassName="rounded-xl py-2 text-center"
                  ariaLabel="Probabilidad de fallo arcano"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>

              <DiceButton
                onClick={() =>
                  onRollArcaneFailure(
                    character.spellcasting.arcaneFailureChance,
                  )
                }
                size="md"
              />
            </div>
          </div>

          <div className="text-[11px] uppercase tracking-[0.18em] text-gold/80">
            Modificadores condicionales
          </div>
          <textarea
            value={character.spellcasting.conditionalModifiers}
            onChange={(event) =>
              updateSpellcasting({ conditionalModifiers: event.target.value })
            }
            className="mt-2 min-h-28 w-full rounded-2xl border border-border/70 bg-input/90 px-4 py-3 text-sm leading-6 resize-none"
            placeholder="Anota aqui modificadores, dotes, metamagia o condiciones situacionales para tus conjuros..."
          />
        </div>

        <div className="min-w-0 rounded-[20px] border border-border/60 bg-background/25 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-gold/80">
                Tabla de conjuros
              </div>
            </div>
          </div>

          <div className="min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-background/16">
            <div className="grid grid-cols-[62px_repeat(4,minmax(0,1fr))_58px] gap-2 border-b border-border/60 bg-background/28 px-2 py-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">
              <span className="text-center">Nivel</span>
              <span className="text-center">Con</span>
              <span className="text-center">CD</span>
              <span className="text-center">Dia</span>
              <span className="text-center">Ad</span>
              <span className="text-center">Ok</span>
            </div>

            <div className="min-w-0 divide-y divide-border/45">
              {spellLevels.map((spellLevel) => {
                const isSelected =
                  spellLevel.level === selectedSpellLevel.level;

                return (
                  <button
                    key={spellLevel.level}
                    type="button"
                    onClick={() => setSelectedLevel(spellLevel.level)}
                    className={`grid w-full min-w-0 grid-cols-[62px_repeat(4,minmax(0,1fr))_58px] gap-2 px-2 py-2 text-left transition-colors ${isSelected ? "bg-gold/10" : "bg-background/10 hover:bg-background/22"}`}
                  >
                    <div className="flex items-center justify-center">
                      <span
                        className={`rounded-lg border px-2 py-1 text-center text-xs font-semibold transition-colors ${isSelected ? "border-gold/45 bg-gold/14 text-gold" : "border-border/60 bg-background/28 text-foreground"}`}
                      >
                        {getSpellLevelLabel(spellLevel.level)}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <FormNumberInput
                        value={spellLevel.knownSpells}
                        onChange={(value) =>
                          updateSpellLevel(spellLevel.level, {
                            knownSpells: clampSpellUses(value),
                          })
                        }
                        min={0}
                        className="w-full"
                        inputClassName="rounded-xl py-2 text-center"
                        ariaLabel={`Conjuros conocidos de nivel ${getSpellLevelLabel(spellLevel.level)}`}
                        compact
                      />
                    </div>

                    <div className="min-w-0">
                      <FormNumberInput
                        value={spellLevel.saveDC}
                        onChange={(value) =>
                          updateSpellLevel(spellLevel.level, {
                            saveDC: clampSpellUses(value),
                          })
                        }
                        min={0}
                        className="w-full"
                        inputClassName="rounded-xl py-2 text-center"
                        ariaLabel={`CD de salvacion de nivel ${getSpellLevelLabel(spellLevel.level)}`}
                        compact
                      />
                    </div>

                    <div className="min-w-0">
                      <FormNumberInput
                        value={spellLevel.dailySpells}
                        onChange={(value) =>
                          updateSpellLevel(spellLevel.level, {
                            dailySpells: clampSpellUses(value),
                          })
                        }
                        min={0}
                        className="w-full"
                        inputClassName="rounded-xl py-2 text-center"
                        ariaLabel={`Conjuros diarios de nivel ${getSpellLevelLabel(spellLevel.level)}`}
                        compact
                      />
                    </div>

                    <div className="min-w-0">
                      <FormNumberInput
                        value={spellLevel.additionalSpells}
                        onChange={(value) =>
                          updateSpellLevel(spellLevel.level, {
                            additionalSpells: clampSpellUses(value),
                          })
                        }
                        min={0}
                        className="w-full"
                        inputClassName="rounded-xl py-2 text-center"
                        ariaLabel={`Conjuros adicionales de nivel ${getSpellLevelLabel(spellLevel.level)}`}
                        compact
                      />
                    </div>

                    <div className="flex items-center justify-center">
                      <span
                        className={`rounded-lg border px-2 py-1 text-center text-xs font-semibold ${isSelected ? "border-gold/35 bg-gold/10 text-gold" : "border-border/60 bg-background/22 text-muted-foreground"}`}
                      >
                        {spellLevel.dailyEntries.length}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="min-w-0 rounded-[20px] border border-gold/18 bg-gradient-to-br from-background/28 via-background/22 to-gold/6 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-gold/80">
                Conjuros diarios
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Editor del nivel {getSpellLevelLabel(selectedSpellLevel.level)}.
              </div>
            </div>

            <button
              type="button"
              onClick={() => addDailySpellEntry(selectedSpellLevel.level)}
              className="rounded-full border border-gold/35 bg-gold/10 px-3 py-1.5 text-xs text-gold transition-colors hover:bg-gold/15"
            >
              + Anadir conjuro
            </button>
          </div>

          <div className="mb-4 flex w-full min-w-0 flex-wrap gap-2">
            {spellLevels.map((spellLevel) => (
              <button
                key={spellLevel.level}
                type="button"
                onClick={() => setSelectedLevel(spellLevel.level)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors ${spellLevel.level === selectedSpellLevel.level ? "border-gold/40 bg-gold/14 text-gold" : "border-border/60 bg-background/25 text-muted-foreground hover:text-foreground"}`}
              >
                Nivel {getSpellLevelLabel(spellLevel.level)}
              </button>
            ))}
          </div>

          <div className="mb-4 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-border/60 bg-background/20 p-3 text-center">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/80">
                Diarios
              </div>
              <div className="mt-2 text-xl font-semibold text-gold">
                {selectedSpellLevel.dailySpells}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/20 p-3 text-center">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/80">
                Adicionales
              </div>
              <div className="mt-2 text-xl font-semibold text-gold">
                {selectedSpellLevel.additionalSpells}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/20 p-3 text-center">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/80">
                Restantes
              </div>
              <div className="mt-2 text-xl font-semibold text-gold">
                {selectedLevelRemainingUses}
              </div>
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-border/60 bg-background/14 px-3 py-2 text-xs text-muted-foreground">
            Usos asignados: {selectedLevelAssignedUses} /{" "}
            {selectedLevelCapacity}
          </div>

          {selectedSpellLevel.dailyEntries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-background/12 px-4 py-5 text-sm text-muted-foreground">
              No hay conjuros diarios anotados para este nivel.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="hidden grid-cols-[minmax(0,1fr)_78px_88px_40px] gap-2 px-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80 md:grid">
                <span>Conjuro</span>
                <span className="text-center">Usos</span>
                <span className="text-center">Quedan</span>
                <span className="text-center">Quitar</span>
              </div>

              {selectedSpellLevel.dailyEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="grid gap-2 rounded-2xl border border-border/60 bg-background/16 p-2 md:grid-cols-[minmax(0,1fr)_78px_88px_40px]"
                >
                  <input
                    type="text"
                    value={entry.name}
                    onChange={(event) =>
                      updateDailySpellEntry(
                        selectedSpellLevel.level,
                        entry.id,
                        {
                          name: event.target.value,
                        },
                      )
                    }
                    placeholder="Nombre del conjuro"
                    className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm"
                  />

                  <div className="grid grid-cols-[1fr_1fr_40px] gap-2 md:contents">
                    <FormNumberInput
                      value={entry.totalUses}
                      onChange={(value) =>
                        updateDailySpellEntry(
                          selectedSpellLevel.level,
                          entry.id,
                          {
                            totalUses: clampSpellUses(value),
                            remainingUses: Math.min(
                              entry.remainingUses,
                              clampSpellUses(value),
                            ),
                          },
                        )
                      }
                      min={0}
                      className="w-full"
                      inputClassName="rounded-xl py-2 text-center"
                      ariaLabel={`Usos totales de ${entry.name || "conjuro"}`}
                      compact
                    />

                    <FormNumberInput
                      value={entry.remainingUses}
                      onChange={(value) =>
                        updateDailySpellEntry(
                          selectedSpellLevel.level,
                          entry.id,
                          {
                            remainingUses: Math.min(
                              entry.totalUses,
                              clampSpellUses(value),
                            ),
                          },
                        )
                      }
                      min={0}
                      max={entry.totalUses}
                      className="w-full"
                      inputClassName="rounded-xl py-2 text-center"
                      ariaLabel={`Usos restantes de ${entry.name || "conjuro"}`}
                      compact
                    />

                    <button
                      type="button"
                      onClick={() =>
                        removeDailySpellEntry(
                          selectedSpellLevel.level,
                          entry.id,
                        )
                      }
                      className="rounded-xl border border-blood-red/35 bg-blood-red/10 text-sm font-semibold text-blood-red transition-colors hover:bg-blood-red/18"
                      aria-label={`Quitar ${entry.name || "conjuro"}`}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SectionShell>
  );
}
