import { useMemo, useState, type ReactNode } from "react";
import { BattleActionModal } from "./battleActionModal";
import { DiceButton } from "./diceButton";
import { SectionShell } from "./sectionShell";
import {
  formatModifier,
  getAbilityModifier,
  type Attack,
  type BattleActionModifier,
  type CharacterData,
} from "@/lib/character-types";
import { isEquippedWeaponCandidate } from "@/lib/equipment-effects";

/**
 * Propiedades de la seccion de ataques personalizados.
 */
interface AttacksProps {
  character: CharacterData;
  onChange: (updates: Partial<CharacterData>) => void;
  onRollAttack: (
    attackName: string,
    modifiers: { label: string; value: number }[],
    diceCount?: number,
  ) => void;
  onRollDamage: (
    attackName: string,
    damage: {
      diceCount: number;
      diceType: number;
      totalBonus: number;
      perDieBonus: number;
      baseMultiplier?: number;
    },
  ) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

function MacroActionButton({
  onClick,
  title,
  label,
  tone = "accent",
  children,
}: {
  onClick: () => void;
  title: string;
  label: string;
  tone?: "accent" | "critical";
  children: ReactNode;
}) {
  const toneClasses =
    tone === "critical"
      ? "border-blood-red/45 bg-blood-red/12 text-blood-red hover:bg-blood-red/22 hover:shadow-[0_0_10px_rgba(153,27,27,0.32)]"
      : "border-accent/50 bg-accent/20 text-accent hover:border-accent hover:bg-accent/40 hover:shadow-[0_0_10px_var(--accent)]";

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onClick}
        className={`flex h-8 w-8 items-center justify-center rounded border transition-all duration-200 active:scale-95 ${toneClasses}`}
        title={title}
        aria-label={title}
      >
        {children}
      </button>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

/**
 * Permite administrar la lista de ataques del personaje y lanzar sus tiradas.
 */
export function Attacks({
  character,
  onChange,
  onRollAttack,
  onRollDamage,
  isOpen,
  onToggle,
}: AttacksProps) {
  const [editingActionId, setEditingActionId] = useState<string | "new" | null>(
    null,
  );

  const actionBeingEdited = useMemo(
    () =>
      editingActionId && editingActionId !== "new"
        ? (character.attacks.find((attack) => attack.id === editingActionId) ??
          null)
        : null,
    [character.attacks, editingActionId],
  );

  const resolveModifier = (modifier: BattleActionModifier) => {
    const application = modifier.application ?? "total";

    switch (modifier.source) {
      case "custom":
        return {
          label: modifier.customLabel?.trim() || "Ajuste manual",
          value: modifier.customValue ?? 0,
          application,
        };
      case "baseAttackBonus":
        return {
          label: "Bono base de ataque",
          value: character.baseAttackBonus,
          application,
        };
      case "initiative":
        return {
          label: "Iniciativa",
          value: character.initiative,
          application,
        };
      case "strength":
      case "dexterity":
      case "constitution":
      case "intelligence":
      case "wisdom":
      case "charisma":
        return {
          label: `Mod. ${modifier.source}`,
          value: getAbilityModifier(character[modifier.source]),
          application,
        };
    }
  };

  const resolveWeaponSnapshot = (attack: Attack) => {
    const config = attack.weaponConfig;

    if (!config) {
      return null;
    }

    if (config.source === "equipped" && config.selectedWeaponId) {
      const equippedWeapon = character.equippedItems.find(
        (item) =>
          item.id === config.selectedWeaponId && isEquippedWeaponCandidate(item),
      );

      if (equippedWeapon) {
        return {
          name: equippedWeapon.name,
          damageDiceCount: equippedWeapon.weaponProfile?.damageDiceCount ?? 1,
          damageDiceType: equippedWeapon.weaponProfile?.damageDiceType ?? 6,
          criticalRangeStart:
            equippedWeapon.weaponProfile?.criticalRangeStart ?? 20,
          criticalMultiplier:
            equippedWeapon.weaponProfile?.criticalMultiplier ?? 2,
        };
      }
    }

    return config.weaponSnapshot;
  };

  const getEffectiveWeaponDiceCount = (attack: Attack) => {
    const snapshot = resolveWeaponSnapshot(attack);
    return Math.max(
      1,
      (snapshot?.damageDiceCount ?? 1) +
        Math.max(0, attack.weaponConfig?.extraDamageDiceCount ?? 0),
    );
  };

  const buildRollExpression = (
    diceCount: number,
    diceType: number,
    modifier: number,
  ) => {
    const modifierSuffix =
      modifier === 0 ? "" : modifier > 0 ? `+${modifier}` : `${modifier}`;

    return `${diceCount}d${diceType}${modifierSuffix}`;
  };

  const summarizeModifiers = (modifiers: BattleActionModifier[]) =>
    modifiers.reduce(
      (accumulator, modifier) => {
        const resolvedModifier = resolveModifier(modifier);

        if (resolvedModifier.application === "perDie") {
          accumulator.perDie += resolvedModifier.value;
        } else {
          accumulator.total += resolvedModifier.value;
        }

        return accumulator;
      },
      { total: 0, perDie: 0 },
    );

  const formatModifierSummary = (
    totalBonus: number,
    perDieBonus: number,
    diceCount: number,
  ) => {
    const parts: string[] = [];

    if (totalBonus !== 0) {
      parts.push(`${formatModifier(totalBonus)} total`);
    }

    if (perDieBonus !== 0) {
      parts.push(
        `${formatModifier(perDieBonus)} por dado${diceCount > 1 ? ` (${formatModifier(perDieBonus * diceCount)})` : ""}`,
      );
    }

    return parts.join(" · ");
  };

  const getWeaponDamageExpression = (attack: Attack) => {
    const snapshot = resolveWeaponSnapshot(attack);
    const damageBonuses = summarizeModifiers(
      attack.weaponConfig?.damageModifiers ?? [],
    );
    const effectiveDiceCount = getEffectiveWeaponDiceCount(attack);

    if (!snapshot) {
      return "1d6";
    }

    return buildRollExpression(
      effectiveDiceCount,
      snapshot.damageDiceType,
      damageBonuses.total + damageBonuses.perDie * effectiveDiceCount,
    );
  };

  const getWeaponDamageConfig = (attack: Attack) => {
    const snapshot = resolveWeaponSnapshot(attack);
    const damageBonuses = summarizeModifiers(
      attack.weaponConfig?.damageModifiers ?? [],
    );

    return {
      diceCount: getEffectiveWeaponDiceCount(attack),
      diceType: snapshot?.damageDiceType ?? 6,
      totalBonus: damageBonuses.total,
      perDieBonus: damageBonuses.perDie,
    };
  };

  const getCriticalExpression = (attack: Attack) => {
    const snapshot = resolveWeaponSnapshot(attack);

    if (!snapshot) {
      return null;
    }

    return {
      ...getWeaponDamageConfig(attack),
      baseMultiplier: snapshot.criticalMultiplier,
    };
  };

  const getSpellExpression = (attack: Attack) => {
    const spellConfig = attack.spellConfig;
    const modifierBonuses = summarizeModifiers(
      attack.spellConfig?.effectModifiers ?? [],
    );

    if (!spellConfig) {
      return "1d6";
    }

    return buildRollExpression(
      spellConfig.damageDiceCount,
      spellConfig.damageDiceType,
      modifierBonuses.total +
        modifierBonuses.perDie * spellConfig.damageDiceCount,
    );
  };

  const getSpellDamageConfig = (attack: Attack) => {
    const spellConfig = attack.spellConfig;
    const modifierBonuses = summarizeModifiers(
      attack.spellConfig?.effectModifiers ?? [],
    );

    return {
      diceCount: spellConfig?.damageDiceCount ?? 1,
      diceType: spellConfig?.damageDiceType ?? 6,
      totalBonus: modifierBonuses.total,
      perDieBonus: modifierBonuses.perDie,
    };
  };

  const handleSaveAction = (savedAction: Attack) => {
    if (editingActionId === "new") {
      onChange({ attacks: [...character.attacks, savedAction] });
      setEditingActionId(null);
      return;
    }

    onChange({
      attacks: character.attacks.map((attack) =>
        attack.id === savedAction.id ? savedAction : attack,
      ),
    });
    setEditingActionId(null);
  };

  const removeAttack = (attackId: string) => {
    onChange({
      attacks: character.attacks.filter((attack) => attack.id !== attackId),
    });
  };

  return (
    <SectionShell
      title="ACCIONES DE BATALLA"
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="space-y-3">
        {character.attacks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-secondary/12 px-4 py-5 text-sm leading-6 text-muted-foreground">
            Crea macros para ataques con arma, acciones melee o hechizos y
            tendras sus tiradas listas con un click.
          </div>
        ) : (
          character.attacks.map((attack) => {
            const weaponSnapshot =
              attack.actionType === "weapon"
                ? resolveWeaponSnapshot(attack)
                : null;
            const attackBonusTotal = summarizeModifiers(
              attack.weaponConfig?.attackModifiers ?? [],
            ).total;
            const damageBonusSummary = summarizeModifiers(
              attack.weaponConfig?.damageModifiers ?? [],
            );
            const spellBonusSummary = summarizeModifiers(
              attack.spellConfig?.effectModifiers ?? [],
            );
            const effectiveWeaponDiceCount = getEffectiveWeaponDiceCount(attack);
            const criticalRange = weaponSnapshot
              ? weaponSnapshot.criticalRangeStart >= 20
                ? "20"
                : `${weaponSnapshot.criticalRangeStart}-20`
              : null;

            return (
              <div
                key={attack.id}
                className="rounded-2xl border border-border/60 bg-secondary/20 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-semibold text-foreground">
                        {attack.name}
                      </h4>
                      <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-gold">
                        {attack.actionType === "weapon"
                          ? "Arma / melee"
                          : "Hechizo"}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {attack.actionType === "weapon" && weaponSnapshot ? (
                        <>
                          <div>
                            {weaponSnapshot.name} ·{" "}
                            {effectiveWeaponDiceCount}d
                            {weaponSnapshot.damageDiceType} · Critico{" "}
                            {criticalRange}/x{weaponSnapshot.criticalMultiplier}
                          </div>
                          <div>
                            Ataque {formatModifier(attackBonusTotal)}
                            {effectiveWeaponDiceCount > 1
                              ? ` x${effectiveWeaponDiceCount}`
                              : ""} · Dano{" "}
                            {getWeaponDamageExpression(attack)}
                            {damageBonusSummary.total !== 0 ||
                            damageBonusSummary.perDie !== 0
                              ? ` (${formatModifierSummary(
                                  damageBonusSummary.total,
                                  damageBonusSummary.perDie,
                                  effectiveWeaponDiceCount,
                                )})`
                              : ""}
                          </div>
                        </>
                      ) : null}

                      {attack.actionType === "spell" ? (
                        <div>
                          Tirada {getSpellExpression(attack)}
                          {spellBonusSummary.total !== 0 ||
                          spellBonusSummary.perDie !== 0
                            ? ` · Ajustes ${formatModifierSummary(
                                spellBonusSummary.total,
                                spellBonusSummary.perDie,
                                attack.spellConfig?.damageDiceCount ?? 1,
                              )}`
                            : ""}
                        </div>
                      ) : null}

                      {attack.notes ? <div>{attack.notes}</div> : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {attack.actionType === "weapon" ? (
                      <>
                        <div className="flex flex-col items-center gap-1">
                          <DiceButton
                            onClick={() =>
                              onRollAttack(
                                `${attack.name} Ataque`,
                                attack.weaponConfig?.attackModifiers.map(
                                  resolveModifier,
                                ) ?? [],
                                effectiveWeaponDiceCount,
                              )
                            }
                            size="md"
                          />
                          <span className="text-xs text-muted-foreground">
                            Atq
                          </span>
                        </div>

                        <MacroActionButton
                          onClick={() =>
                            onRollDamage(`${attack.name} Dano`, {
                              ...getWeaponDamageConfig(attack),
                            })
                          }
                          title="Tirar dano"
                          label="Dano"
                        >
                          <svg
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <path
                              d="M4 6.5h12M4 10h12M4 13.5h12"
                              strokeLinecap="round"
                            />
                            <path
                              d="M6 4.5h8v11H6z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </MacroActionButton>

                        {weaponSnapshot ? (
                          <MacroActionButton
                            tone="critical"
                            onClick={() => {
                              const criticalExpression =
                                getCriticalExpression(attack);

                              if (criticalExpression) {
                                onRollDamage(
                                  `${attack.name} Critico`,
                                  criticalExpression,
                                );
                              }
                            }}
                            title="Tirar critico"
                            label="Crit"
                          >
                            <svg
                              viewBox="0 0 20 20"
                              aria-hidden="true"
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            >
                              <path
                                d="M10 2.75 11.8 7.2l4.8.38-3.67 3.1 1.15 4.57L10 12.8l-4.08 2.45 1.15-4.57-3.67-3.1 4.8-.38L10 2.75Z"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </MacroActionButton>
                        ) : null}
                      </>
                    ) : (
                      <MacroActionButton
                        onClick={() =>
                          onRollDamage(`${attack.name} Hechizo`, {
                            ...getSpellDamageConfig(attack),
                          })
                        }
                        title="Tirar hechizo"
                        label="Hech"
                      >
                        <svg
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path
                            d="M10 2.5v3M10 14.5v3M3.5 10h3M13.5 10h3M5.6 5.6l2.1 2.1M12.3 12.3l2.1 2.1M14.4 5.6l-2.1 2.1M7.7 12.3l-2.1 2.1"
                            strokeLinecap="round"
                          />
                          <circle cx="10" cy="10" r="2.5" />
                        </svg>
                      </MacroActionButton>
                    )}

                    <button
                      type="button"
                      onClick={() => setEditingActionId(attack.id)}
                      className="rounded-xl border border-border/60 bg-background/25 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => removeAttack(attack.id)}
                      className="rounded-xl border border-blood-red/35 bg-blood-red/10 px-3 py-2 text-sm text-blood-red transition-colors hover:bg-blood-red/15"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-border/50 bg-secondary/15 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm leading-6 text-muted-foreground">
            Agrega acciones de batalla.
          </div>

          <button
            type="button"
            onClick={() => setEditingActionId("new")}
            className="rounded-2xl border border-gold/45 bg-gold/14 px-4 py-2 text-sm font-semibold text-gold transition-colors hover:bg-gold/20"
          >
            +
          </button>
        </div>
      </div>

      {editingActionId ? (
        <BattleActionModal
          character={character}
          action={editingActionId === "new" ? null : actionBeingEdited}
          onClose={() => setEditingActionId(null)}
          onSave={handleSaveAction}
        />
      ) : null}

      {/* TODO: concretar el texto adicional solicitado por el usuario para esta seccion cuando detalle la frase completa. */}
    </SectionShell>
  );
}
