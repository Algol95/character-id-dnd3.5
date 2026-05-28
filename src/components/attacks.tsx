import { useMemo, useState, type ReactNode } from "react";
import { BattleActionModal } from "./battleActionModal";
import { DiceButton } from "./diceButton";
import { FormCheckbox } from "./formCheckbox";
import { SectionShell } from "./sectionShell";
import type { DiceRollMode } from "@/hooks/use-dice-roller";
import {
  DAMAGE_TYPE_LABELS,
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
    actionId: string | undefined,
    attackName: string,
    modifiers: { label: string; value: number }[],
    diceCount?: number,
    criticalThreatRangeStart?: number,
    mode?: DiceRollMode,
  ) => void;
  onRollDamage: (
    attackName: string,
    damage: {
      diceCount: number;
      diceType: number;
      totalBonus: number;
      perDieBonus: number;
      baseMultiplier?: number;
      damageGroups?: { diceCount: number; baseMultiplier?: number }[];
    },
  ) => void;
  weaponCriticalStates: Record<string, number[]>;
  onResetWeaponCriticalState: (actionId: string) => void;
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
  tone?: "accent" | "critical" | "success";
  children: ReactNode;
}) {
  const toneClasses =
    tone === "critical"
      ? "border-blood-red/45 bg-blood-red/12 text-blood-red hover:bg-blood-red/22 hover:shadow-[0_0_10px_rgba(153,27,27,0.32)]"
      : tone === "success"
        ? "border-critical/50 bg-critical/12 text-critical hover:bg-critical/18 hover:shadow-[0_0_12px_color-mix(in_oklab,var(--critical)_35%,transparent)]"
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
  weaponCriticalStates,
  onResetWeaponCriticalState,
  isOpen,
  onToggle,
}: AttacksProps) {
  const [editingActionId, setEditingActionId] = useState<string | "new" | null>(
    null,
  );
  const [attackRollModes, setAttackRollModes] = useState<
    Record<string, DiceRollMode>
  >({});

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

    if (
      config.source === "equipped" &&
      config.selectedWeaponId &&
      !config.useCustomWeaponProfile
    ) {
      const equippedWeapon = character.equippedItems.find(
        (item) =>
          item.id === config.selectedWeaponId &&
          isEquippedWeaponCandidate(item),
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

  const getWeaponAttackCount = (attack: Attack) =>
    Math.max(
      1,
      1 + Math.max(0, attack.weaponConfig?.extraDamageDiceCount ?? 0),
    );

  const getEffectiveWeaponDiceCount = (attack: Attack) => {
    const snapshot = resolveWeaponSnapshot(attack);

    return Math.max(
      1,
      Math.max(1, snapshot?.damageDiceCount ?? 1) *
        getWeaponAttackCount(attack),
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

  const getWeaponDamageConfig = (
    attack: Attack,
    criticalAttackIndexes: number[] = [],
  ) => {
    const snapshot = resolveWeaponSnapshot(attack);
    const damageBonuses = summarizeModifiers(
      attack.weaponConfig?.damageModifiers ?? [],
    );
    const weaponAttackCount = getWeaponAttackCount(attack);
    const diceCountPerAttack = Math.max(1, snapshot?.damageDiceCount ?? 1);
    const criticalAttackIndexSet = new Set(criticalAttackIndexes);

    return {
      diceCount: diceCountPerAttack * weaponAttackCount,
      diceType: snapshot?.damageDiceType ?? 6,
      totalBonus: damageBonuses.total,
      perDieBonus: damageBonuses.perDie,
      damageGroups: Array.from(
        { length: weaponAttackCount },
        (_, attackIndex) => ({
          diceCount: diceCountPerAttack,
          baseMultiplier: criticalAttackIndexSet.has(attackIndex)
            ? Math.max(1, snapshot?.criticalMultiplier ?? 1)
            : 1,
        }),
      ),
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

    setAttackRollModes((currentModes) => {
      if (!(attackId in currentModes)) {
        return currentModes;
      }

      const nextModes = { ...currentModes };
      delete nextModes[attackId];
      return nextModes;
    });
  };

  const handleAttackRollModeToggle = (
    attackId: string,
    nextMode: Extract<DiceRollMode, "advantage" | "disadvantage">,
  ) => {
    setAttackRollModes((currentModes) => ({
      ...currentModes,
      [attackId]: currentModes[attackId] === nextMode ? "normal" : nextMode,
    }));
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
            const weaponAttackCount = getWeaponAttackCount(attack);
            const attackBonusTotal = summarizeModifiers(
              attack.weaponConfig?.attackModifiers ?? [],
            ).total;
            const damageBonusSummary = summarizeModifiers(
              attack.weaponConfig?.damageModifiers ?? [],
            );
            const spellBonusSummary = summarizeModifiers(
              attack.spellConfig?.effectModifiers ?? [],
            );
            const criticalAttackIndexes = weaponCriticalStates[attack.id] ?? [];
            const hasCriticalDamageState = criticalAttackIndexes.length > 0;
            const effectiveWeaponDiceCount =
              getEffectiveWeaponDiceCount(attack);
            const selectedAttackRollMode =
              attackRollModes[attack.id] ?? "normal";
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
                            {weaponSnapshot.name} · {effectiveWeaponDiceCount}d
                            {weaponSnapshot.damageDiceType}
                            {attack.weaponConfig?.damageType
                              ? ` · ${DAMAGE_TYPE_LABELS[attack.weaponConfig.damageType]}`
                              : ""}{" "}
                            · Critico {criticalRange}/x
                            {weaponSnapshot.criticalMultiplier}
                          </div>
                          <div>
                            Ataque {formatModifier(attackBonusTotal)}
                            {weaponAttackCount > 1
                              ? ` x${weaponAttackCount}`
                              : ""}{" "}
                            · Dano {getWeaponDamageExpression(attack)}
                            {damageBonusSummary.total !== 0 ||
                            damageBonusSummary.perDie !== 0
                              ? ` (${formatModifierSummary(
                                  damageBonusSummary.total,
                                  damageBonusSummary.perDie,
                                  effectiveWeaponDiceCount,
                                )})`
                              : ""}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                            <FormCheckbox
                              checked={selectedAttackRollMode === "advantage"}
                              onChange={() =>
                                handleAttackRollModeToggle(
                                  attack.id,
                                  "advantage",
                                )
                              }
                              ariaLabel={`Activar ventaja para ${attack.name}`}
                              label="Ventaja"
                              className="w-auto items-center gap-2"
                              boxClassName="h-3.5 w-3.5 rounded border-success/60 bg-background/40 text-success group-hover:border-success/50 peer-checked:border-success/65 peer-checked:bg-success/14 peer-checked:text-success peer-checked:shadow-[0_0_10px_rgba(34,197,94,0.22)] peer-focus-visible:ring-success"
                              labelClassName="text-xs font-medium text-success"
                            />

                            <FormCheckbox
                              checked={
                                selectedAttackRollMode === "disadvantage"
                              }
                              onChange={() =>
                                handleAttackRollModeToggle(
                                  attack.id,
                                  "disadvantage",
                                )
                              }
                              ariaLabel={`Activar desventaja para ${attack.name}`}
                              label="Desventaja"
                              className="w-auto items-center gap-2"
                              boxClassName="h-3.5 w-3.5 rounded border-blood-red/60 bg-background/40 text-blood-red group-hover:border-blood-red/50 peer-checked:border-blood-red/65 peer-checked:bg-blood-red/14 peer-checked:text-blood-red peer-checked:shadow-[0_0_10px_rgba(127,29,29,0.2)] peer-focus-visible:ring-blood-red"
                              labelClassName="text-xs font-medium text-blood-red"
                            />
                          </div>
                        </>
                      ) : null}

                      {attack.actionType === "spell" ? (
                        <div>
                          Tirada {getSpellExpression(attack)}
                          {attack.spellConfig?.damageType
                            ? ` · ${DAMAGE_TYPE_LABELS[attack.spellConfig.damageType]}`
                            : ""}
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
                                attack.id,
                                `${attack.name} Ataque`,
                                attack.weaponConfig?.attackModifiers.map(
                                  resolveModifier,
                                ) ?? [],
                                weaponAttackCount,
                                weaponSnapshot?.criticalRangeStart,
                                selectedAttackRollMode,
                              )
                            }
                            size="md"
                          />
                          <span className="text-xs text-muted-foreground">
                            Atq
                          </span>
                        </div>

                        <MacroActionButton
                          onClick={() => {
                            onRollDamage(
                              `${attack.name} Dano`,
                              getWeaponDamageConfig(
                                attack,
                                criticalAttackIndexes,
                              ),
                            );

                            if (hasCriticalDamageState) {
                              onResetWeaponCriticalState(attack.id);
                            }
                          }}
                          title="Tirar dano"
                          label="Dano"
                          tone={hasCriticalDamageState ? "success" : "accent"}
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

                        {hasCriticalDamageState ? (
                          <button
                            type="button"
                            onClick={() =>
                              onResetWeaponCriticalState(attack.id)
                            }
                            className="rounded-xl border border-critical/35 bg-critical/10 px-3 py-2 text-sm text-critical transition-colors hover:bg-critical/15"
                          >
                            Reset crit
                          </button>
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
