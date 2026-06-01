import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BattleActionModal } from "./battleActionModal";
import { DiceButton } from "./diceButton";
import { FormCheckbox } from "./formCheckbox";
import { SectionShell } from "./sectionShell";
import type { DiceRollMode } from "@/hooks/use-dice-roller";
import {
  DAMAGE_TYPE_LABELS,
  type BattleActionModifierApplication,
  formatModifier,
  getCharacterAbilityModifier,
  getFullAttackBonuses,
  getSpellDamageGroups,
  getSpellTotalDiceCount,
  type Attack,
  type BattleActionModifier,
  type CharacterData,
} from "@/lib/character-types";
import { computeEquipmentBonuses } from "@/lib/equipment-effects";
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
    attackBonusTotals?: number[],
  ) => void;
  onRollDamage: (
    attackName: string,
    damage: {
      diceCount: number;
      diceType: number;
      totalBonus: number;
      perDieBonus: number;
      totalModifiers?: { label: string; value: number }[];
      perDieModifiers?: { label: string; value: number }[];
      baseMultiplier?: number;
      damageGroups?: {
        diceCount: number;
        diceType?: number;
        damageType?: string;
        perDieBonus?: number;
        perDieModifiers?: { label: string; value: number }[];
        baseMultiplier?: number;
      }[];
    },
  ) => void;
  weaponCriticalStates: Record<string, number[]>;
  onResetWeaponCriticalState: (actionId: string) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

const MODIFIER_SOURCE_SHORT_LABELS: Record<
  Exclude<BattleActionModifier["source"], "custom">,
  string
> = {
  baseAttackBonus: "BBA",
  initiative: "INI",
  strength: "STR",
  dexterity: "DEX",
  constitution: "CON",
  intelligence: "INT",
  wisdom: "WIS",
  charisma: "CHA",
};

function MacroActionButton({
  onClick,
  title,
  tone = "spell",
  children,
}: {
  onClick: () => void;
  title: string;
  tone?: "weapon" | "spell" | "critical" | "success";
  children: ReactNode;
}) {
  const toneClasses =
    tone === "critical"
      ? "border-blood-red/45 bg-blood-red/12 text-blood-red hover:bg-blood-red/22 hover:shadow-[0_0_10px_rgba(153,27,27,0.32)]"
      : tone === "success"
        ? "border-critical/50 bg-critical/12 text-critical hover:bg-critical/18 hover:shadow-[0_0_12px_color-mix(in_oklab,var(--critical)_35%,transparent)]"
        : tone === "weapon"
          ? "border-[rgba(216,76,76,0.55)] bg-[rgba(216,76,76,0.16)] text-[rgb(244,120,120)] hover:bg-[rgba(216,76,76,0.26)] hover:shadow-[0_0_12px_rgba(216,76,76,0.28)]"
          : "border-[rgba(88,157,255,0.55)] bg-[rgba(88,157,255,0.16)] text-[rgb(124,181,255)] hover:bg-[rgba(88,157,255,0.24)] hover:shadow-[0_0_12px_rgba(88,157,255,0.28)]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded border transition-all duration-200 active:scale-95 ${toneClasses}`}
      title={title}
      aria-label={title}
    >
      {children}
    </button>
  );
}

function MacroInfoChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "weapon" | "spell" | "neutral";
}) {
  const toneClasses =
    tone === "weapon"
      ? "border-[rgba(216,76,76,0.28)] bg-[rgba(216,76,76,0.1)] text-foreground"
      : tone === "spell"
        ? "border-[rgba(88,157,255,0.3)] bg-[rgba(88,157,255,0.1)] text-foreground"
        : "border-border/50 bg-background/20 text-foreground";

  return (
    <div
      className={`rounded-2xl border px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] ${toneClasses}`}
    >
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold leading-tight text-foreground">
        {value}
      </div>
    </div>
  );
}

function MacroIconButton({
  onClick,
  title,
  tone = "neutral",
  children,
}: {
  onClick: () => void;
  title: string;
  tone?: "neutral" | "danger";
  children: ReactNode;
}) {
  const toneClasses =
    tone === "danger"
      ? "border-blood-red/35 bg-blood-red/10 text-blood-red hover:bg-blood-red/15"
      : "border-border/60 bg-background/25 text-muted-foreground hover:border-gold/30 hover:text-foreground";

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${toneClasses}`}
    >
      {children}
    </button>
  );
}

function MacroCollapseButton({
  collapsed,
  onClick,
  tone,
}: {
  collapsed: boolean;
  onClick: () => void;
  tone: "weapon" | "spell";
}) {
  const toneClasses =
    tone === "weapon"
      ? "border-[rgba(216,76,76,0.35)] bg-[rgba(216,76,76,0.12)] text-[rgb(244,120,120)] hover:bg-[rgba(216,76,76,0.18)]"
      : "border-[rgba(88,157,255,0.38)] bg-[rgba(88,157,255,0.12)] text-[rgb(124,181,255)] hover:bg-[rgba(88,157,255,0.18)]";

  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? "Desplegar macro" : "Replegar macro"}
      aria-label={collapsed ? "Desplegar macro" : "Replegar macro"}
      className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${toneClasses}`}
    >
      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        className={`h-4 w-4 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          d="M5 7.5 10 12.5 15 7.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function MacroBodyPanel({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "weapon" | "spell";
}) {
  const toneClasses =
    tone === "weapon"
      ? "border-[rgba(216,76,76,0.22)] bg-[rgba(22,8,8,0.52)]"
      : "border-[rgba(88,157,255,0.24)] bg-[rgba(10,18,32,0.5)]";

  return (
    <div className={`space-y-3 rounded-[22px] border p-4 ${toneClasses}`}>
      {children}
    </div>
  );
}

function MacroCard({
  title,
  subtitle,
  icon,
  tone,
  headerChips,
  details,
  notes,
  actionStart,
  actionEnd,
  collapsed,
  onToggle,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  tone: "weapon" | "spell";
  headerChips: ReactNode;
  details: ReactNode;
  notes: ReactNode;
  actionStart: ReactNode;
  actionEnd: ReactNode;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const cardToneClasses =
    tone === "weapon"
      ? "border-[rgba(216,76,76,0.28)] bg-[linear-gradient(180deg,rgba(46,16,16,0.96)_0%,rgba(24,10,10,0.98)_100%)] shadow-[0_10px_26px_rgba(216,76,76,0.14)]"
      : "border-[rgba(88,157,255,0.3)] bg-[linear-gradient(180deg,rgba(16,30,52,0.96)_0%,rgba(10,18,32,0.98)_100%)] shadow-[0_10px_26px_rgba(88,157,255,0.16)]";
  const iconShellClasses =
    tone === "weapon"
      ? "border-[rgba(216,76,76,0.38)] bg-[rgba(216,76,76,0.12)] text-[rgb(244,120,120)]"
      : "border-[rgba(88,157,255,0.4)] bg-[rgba(88,157,255,0.12)] text-[rgb(124,181,255)]";
  const actionPanelClasses =
    tone === "weapon"
      ? "border-[rgba(216,76,76,0.18)] bg-[rgba(36,12,12,0.34)]"
      : "border-[rgba(88,157,255,0.2)] bg-[rgba(14,24,40,0.34)]";
  const notePanelClasses =
    tone === "weapon"
      ? "border-[rgba(216,76,76,0.18)] bg-[rgba(16,7,7,0.4)]"
      : "border-[rgba(88,157,255,0.2)] bg-[rgba(8,15,28,0.42)]";
  const subtitleClasses =
    tone === "weapon"
      ? "text-[rgb(244,120,120)]/80"
      : "text-[rgb(124,181,255)]/80";
  const detailsPanelRef = useRef<HTMLDivElement | null>(null);
  const [detailsPanelHeight, setDetailsPanelHeight] = useState<number | null>(
    null,
  );
  const [shouldSyncNotesHeight, setShouldSyncNotesHeight] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : false,
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateViewportMode = () => {
      setShouldSyncNotesHeight(mediaQuery.matches);
    };

    updateViewportMode();
    mediaQuery.addEventListener("change", updateViewportMode);

    return () => {
      mediaQuery.removeEventListener("change", updateViewportMode);
    };
  }, []);

  useEffect(() => {
    const detailsElement = detailsPanelRef.current;

    if (!detailsElement || typeof ResizeObserver === "undefined") {
      return;
    }

    const updateHeight = () => {
      setDetailsPanelHeight(detailsElement.getBoundingClientRect().height);
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    resizeObserver.observe(detailsElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [collapsed, details, shouldSyncNotesHeight]);

  const notePanelStyle =
    shouldSyncNotesHeight && detailsPanelHeight
      ? { height: `${detailsPanelHeight}px` }
      : undefined;

  return (
    <div
      className={`rounded-3xl border p-4 transition-shadow duration-200 hover:shadow-[0_18px_42px_rgba(0,0,0,0.22)] ${cardToneClasses}`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${iconShellClasses}`}
            >
              {icon}
            </div>

            <div className="min-w-0">
              <h4 className="text-lg font-semibold text-foreground">{title}</h4>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[320px]">
              {headerChips}
            </div>
            <MacroCollapseButton
              collapsed={collapsed}
              onClick={onToggle}
              tone={tone}
            />
          </div>
        </div>

        <div
          aria-hidden={collapsed}
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${collapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              className={`flex flex-col gap-4 pt-1 transition-transform duration-300 ease-out ${collapsed ? "-translate-y-2" : "translate-y-0"}`}
            >
              <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                <div ref={detailsPanelRef} className="min-h-0">
                  {details}
                </div>

                <div
                  className={`relative rounded-[22px] border text-sm leading-6 text-muted-foreground lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden ${notePanelClasses}`}
                  style={notePanelStyle}
                >
                  <div className="pointer-events-none absolute inset-x-4 top-4 z-10 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">
                    Notas y contexto
                  </div>
                  <div className="max-h-40 min-h-12 overflow-y-auto px-4 pb-4 pt-10 pr-2 whitespace-pre-wrap lg:min-h-0 lg:flex-1 lg:max-h-none">
                    {notes}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`grid gap-3 rounded-[18px] border px-3 py-2 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center ${actionPanelClasses}`}
        >
          <div className="flex flex-wrap items-center gap-2">{actionStart}</div>

          <div
            className={`text-center text-[10px] uppercase tracking-[0.18em] ${subtitleClasses}`}
          >
            {subtitle}
          </div>

          <div className="flex items-center justify-end gap-2">{actionEnd}</div>
        </div>
      </div>
    </div>
  );
}

function WeaponMacroIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        d="M14.5 4.5 19.5 9.5 9.75 19.25 5 20l.75-4.75L14.5 4.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="m13 6 5 5" strokeLinecap="round" />
      <path d="M4.5 19.5 8 16" strokeLinecap="round" />
    </svg>
  );
}

function SpellMacroIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        d="M12 3.5 13.65 8.35 18.5 10 13.65 11.65 12 16.5 10.35 11.65 5.5 10 10.35 8.35 12 3.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 4.5 18.6 6.4 20.5 7 18.6 7.6 18 9.5 17.4 7.6 15.5 7 17.4 6.4 18 4.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 14.5 6.6 16.4 8.5 17 6.6 17.6 6 19.5 5.4 17.6 3.5 17 5.4 16.4 6 14.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
  const equipmentBonuses = useMemo(
    () => computeEquipmentBonuses(character),
    [character],
  );
  const [editingActionId, setEditingActionId] = useState<string | "new" | null>(
    null,
  );
  const [attackRollModes, setAttackRollModes] = useState<
    Record<string, DiceRollMode>
  >({});
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>(
    {},
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
    const application = (modifier.application ??
      "total") as BattleActionModifierApplication;

    switch (modifier.source) {
      case "custom":
        return {
          label: modifier.customLabel?.trim() || "Ajuste manual",
          value: modifier.customValue ?? 0,
          application,
          spellDamageGroupId: modifier.spellDamageGroupId,
        };
      case "baseAttackBonus":
        return {
          label: "Bono base de ataque",
          value: character.baseAttackBonus,
          application,
          spellDamageGroupId: modifier.spellDamageGroupId,
        };
      case "initiative":
        return {
          label: "Iniciativa",
          value: character.initiative + equipmentBonuses.initiative,
          application,
          spellDamageGroupId: modifier.spellDamageGroupId,
        };
      case "strength":
      case "dexterity":
      case "constitution":
      case "intelligence":
      case "wisdom":
      case "charisma":
        return {
          label: `Mod. ${modifier.source}`,
          value: getCharacterAbilityModifier(
            character,
            modifier.source,
            equipmentBonuses.abilityBonuses[modifier.source],
          ),
          application,
          spellDamageGroupId: modifier.spellDamageGroupId,
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
    getWeaponAttackBonusTotals(attack).length;

  const getWeaponAttackBonusTotals = (attack: Attack) => {
    const attackBonusModifierTotal = summarizeModifiers(
      attack.weaponConfig?.attackModifiers ?? [],
    ).total;
    const baseSequence = attack.weaponConfig?.isFullAttack
      ? getFullAttackBonuses(character.baseAttackBonus)
      : [character.baseAttackBonus];
    const extraAttackCount = Math.max(
      0,
      attack.weaponConfig?.extraDamageDiceCount ?? 0,
    );

    return [
      ...baseSequence.map((bonus) => bonus + attackBonusModifierTotal),
      ...Array.from(
        { length: extraAttackCount },
        () => character.baseAttackBonus + attackBonusModifierTotal,
      ),
    ];
  };

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

  const formatDamageGroupsExpression = (
    damageGroups: {
      diceCount: number;
      diceType: number;
      damageType?: string;
    }[],
  ) =>
    damageGroups
      .map((group) => `${group.diceCount}d${group.diceType}`)
      .join(" + ");

  const getSpellBaseExpression = (attack: Attack) =>
    formatDamageGroupsExpression(getSpellDamageGroups(attack.spellConfig));

  const getWeaponBaseExpression = (attack: Attack) => {
    const snapshot = resolveWeaponSnapshot(attack);

    if (!snapshot) {
      return "1d6";
    }

    return `${getEffectiveWeaponDiceCount(attack)}d${snapshot.damageDiceType}`;
  };

  const summarizeModifiers = (
    modifiers: BattleActionModifier[],
    spellDamageGroups: ReturnType<typeof getSpellDamageGroups> = [],
  ) =>
    modifiers.reduce(
      (accumulator, modifier) => {
        const resolvedModifier = resolveModifier(modifier);

        if (resolvedModifier.application === "perGroup") {
          if (spellDamageGroups.length <= 1) {
            accumulator.perDie += resolvedModifier.value;
            return accumulator;
          }

          const fallbackGroupId = spellDamageGroups[0]?.id;
          const targetGroupId = spellDamageGroups.some(
            (group) => group.id === resolvedModifier.spellDamageGroupId,
          )
            ? resolvedModifier.spellDamageGroupId
            : fallbackGroupId;

          if (targetGroupId) {
            accumulator.perGroup[targetGroupId] =
              (accumulator.perGroup[targetGroupId] ?? 0) +
              resolvedModifier.value;
          }

          return accumulator;
        }

        if (resolvedModifier.application === "perDie") {
          accumulator.perDie += resolvedModifier.value;
        } else {
          accumulator.total += resolvedModifier.value;
        }

        return accumulator;
      },
      { total: 0, perDie: 0, perGroup: {} as Record<string, number> },
    );

  const getModifierRollLabel = (
    modifier: BattleActionModifier,
    application: BattleActionModifierApplication,
    groupIndex?: number,
  ) => {
    const baseLabel =
      modifier.source === "custom"
        ? modifier.customLabel?.trim() || "Ajuste"
        : MODIFIER_SOURCE_SHORT_LABELS[modifier.source];

    if (application === "perDie") {
      return `${baseLabel}/dado`;
    }

    if (application === "perGroup") {
      return groupIndex === undefined
        ? `${baseLabel}/dado`
        : `${baseLabel}/dado G${groupIndex + 1}`;
    }

    return baseLabel;
  };

  const getResolvedDamageModifierDetails = (
    modifiers: BattleActionModifier[],
    spellDamageGroups: ReturnType<typeof getSpellDamageGroups> = [],
  ) =>
    modifiers.reduce(
      (accumulator, modifier) => {
        const resolvedModifier = resolveModifier(modifier);

        if (resolvedModifier.application === "perGroup") {
          if (spellDamageGroups.length <= 1) {
            accumulator.perDie.push({
              label: getModifierRollLabel(modifier, "perDie"),
              value: resolvedModifier.value,
            });
            return accumulator;
          }

          const fallbackGroupId = spellDamageGroups[0]?.id;
          const targetGroupId = spellDamageGroups.some(
            (group) => group.id === resolvedModifier.spellDamageGroupId,
          )
            ? resolvedModifier.spellDamageGroupId
            : fallbackGroupId;

          if (!targetGroupId) {
            return accumulator;
          }

          const targetGroupIndex = spellDamageGroups.findIndex(
            (group) => group.id === targetGroupId,
          );

          accumulator.perGroup[targetGroupId] = [
            ...(accumulator.perGroup[targetGroupId] ?? []),
            {
              label: getModifierRollLabel(
                modifier,
                "perGroup",
                targetGroupIndex >= 0 ? targetGroupIndex : undefined,
              ),
              value: resolvedModifier.value,
            },
          ];

          return accumulator;
        }

        if (resolvedModifier.application === "perDie") {
          accumulator.perDie.push({
            label: getModifierRollLabel(modifier, "perDie"),
            value: resolvedModifier.value,
          });
        } else {
          accumulator.total.push({
            label: getModifierRollLabel(modifier, "total"),
            value: resolvedModifier.value,
          });
        }

        return accumulator;
      },
      {
        total: [] as Array<{ label: string; value: number }>,
        perDie: [] as Array<{ label: string; value: number }>,
        perGroup: {} as Record<string, Array<{ label: string; value: number }>>,
      },
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

  const formatSpellModifierSummary = (
    totalBonus: number,
    perDieBonus: number,
    perGroupBonuses: Record<string, number>,
    spellDamageGroups: ReturnType<typeof getSpellDamageGroups>,
  ) => {
    const parts: string[] = [];

    if (totalBonus !== 0) {
      parts.push(`${formatModifier(totalBonus)} total`);
    }

    if (perDieBonus !== 0) {
      const totalDiceCount = spellDamageGroups.reduce(
        (total, group) => total + group.diceCount,
        0,
      );
      parts.push(
        `${formatModifier(perDieBonus)} por dado${totalDiceCount > 1 ? ` (${formatModifier(perDieBonus * totalDiceCount)})` : ""}`,
      );
    }

    spellDamageGroups.forEach((group, index) => {
      const groupBonus = perGroupBonuses[group.id ?? ""] ?? 0;

      if (groupBonus === 0) {
        return;
      }

      parts.push(
        `${formatModifier(groupBonus)} por dado en grupo ${index + 1}${group.diceCount > 1 ? ` (${formatModifier(groupBonus * group.diceCount)})` : ""}`,
      );
    });

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
    const damageModifierDetails = getResolvedDamageModifierDetails(
      attack.weaponConfig?.damageModifiers ?? [],
    );
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
      totalModifiers: damageModifierDetails.total,
      perDieModifiers: damageModifierDetails.perDie,
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
    const damageGroups = getSpellDamageGroups(spellConfig);
    const modifierBonuses = summarizeModifiers(
      attack.spellConfig?.effectModifiers ?? [],
      damageGroups,
    );
    const totalDiceCount = getSpellTotalDiceCount(spellConfig);
    const groupSpecificModifierTotal = damageGroups.reduce(
      (total, group) =>
        total +
        (modifierBonuses.perGroup[group.id ?? ""] ?? 0) * group.diceCount,
      0,
    );

    if (!spellConfig) {
      return "1d6";
    }

    const baseExpression = formatDamageGroupsExpression(damageGroups);
    const totalModifier =
      modifierBonuses.total +
      modifierBonuses.perDie * totalDiceCount +
      groupSpecificModifierTotal;

    return totalModifier === 0
      ? baseExpression
      : `${baseExpression}${totalModifier > 0 ? ` + ${totalModifier}` : ` - ${Math.abs(totalModifier)}`}`;
  };

  const getSpellDamageConfig = (attack: Attack) => {
    const spellConfig = attack.spellConfig;
    const damageGroups = getSpellDamageGroups(spellConfig);
    const modifierDetails = getResolvedDamageModifierDetails(
      attack.spellConfig?.effectModifiers ?? [],
      damageGroups,
    );
    const modifierBonuses = summarizeModifiers(
      attack.spellConfig?.effectModifiers ?? [],
      damageGroups,
    );

    return {
      diceCount: getSpellTotalDiceCount(spellConfig),
      diceType: damageGroups[0]?.diceType ?? 6,
      totalBonus: modifierBonuses.total,
      perDieBonus: modifierBonuses.perDie,
      totalModifiers: modifierDetails.total,
      perDieModifiers: modifierDetails.perDie,
      damageGroups: damageGroups.map((group) => ({
        ...group,
        perDieBonus: modifierBonuses.perGroup[group.id ?? ""] ?? 0,
        perDieModifiers: modifierDetails.perGroup[group.id ?? ""] ?? [],
      })),
    };
  };

  const getSpellTouchAttackModifiers = (attack: Attack) => {
    const isRangedTouch = attack.spellConfig?.touchAttackType === "ranged";
    const ability = isRangedTouch ? "dexterity" : "strength";

    return [
      {
        label: "Bono base de ataque",
        value: character.baseAttackBonus,
      },
      {
        label: isRangedTouch ? "DEX" : "STR",
        value: getCharacterAbilityModifier(
          character,
          ability,
          equipmentBonuses.abilityBonuses[ability],
        ),
      },
    ];
  };

  const getSpellTouchAttackBonus = (attack: Attack) =>
    getSpellTouchAttackModifiers(attack).reduce(
      (total, modifier) => total + modifier.value,
      0,
    );

  const getSpellTouchAttackSummary = (attack: Attack) => {
    const isRangedTouch = attack.spellConfig?.touchAttackType === "ranged";

    return `Toque ${isRangedTouch ? "a distancia" : "cuerpo a cuerpo"} ${formatModifier(getSpellTouchAttackBonus(attack))}`;
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

    setCollapsedCards((currentCards) => {
      if (!(attackId in currentCards)) {
        return currentCards;
      }

      const nextCards = { ...currentCards };
      delete nextCards[attackId];
      return nextCards;
    });
  };

  const toggleAttackCard = (attackId: string) => {
    setCollapsedCards((currentCards) => ({
      ...currentCards,
      [attackId]: !currentCards[attackId],
    }));
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

  const renderAttackRollModeControls = (attack: Attack) => {
    const selectedAttackRollMode = attackRollModes[attack.id] ?? "normal";

    return (
      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
        <FormCheckbox
          checked={selectedAttackRollMode === "advantage"}
          onChange={() => handleAttackRollModeToggle(attack.id, "advantage")}
          ariaLabel={`Activar ventaja para ${attack.name}`}
          label="Ventaja"
          className="w-auto items-center gap-2"
          boxClassName="h-3.5 w-3.5 rounded border-success/60 bg-background/40 text-success group-hover:border-success/50 peer-checked:border-success/65 peer-checked:bg-success/14 peer-checked:text-success peer-checked:shadow-[0_0_10px_rgba(34,197,94,0.22)] peer-focus-visible:ring-success"
          labelClassName="text-xs font-medium text-success"
        />

        <FormCheckbox
          checked={selectedAttackRollMode === "disadvantage"}
          onChange={() => handleAttackRollModeToggle(attack.id, "disadvantage")}
          ariaLabel={`Activar desventaja para ${attack.name}`}
          label="Desventaja"
          className="w-auto items-center gap-2"
          boxClassName="h-3.5 w-3.5 rounded border-blood-red/60 bg-background/40 text-blood-red group-hover:border-blood-red/50 peer-checked:border-blood-red/65 peer-checked:bg-blood-red/14 peer-checked:text-blood-red peer-checked:shadow-[0_0_10px_rgba(127,29,29,0.2)] peer-focus-visible:ring-blood-red"
          labelClassName="text-xs font-medium text-blood-red"
        />
      </div>
    );
  };

  return (
    <SectionShell
      title="ACCIONES DE BATALLA"
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="max-h-[75vh] space-y-4 overflow-y-auto pr-2">
        {character.attacks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-secondary/12 px-4 py-5 text-sm leading-6 text-muted-foreground">
            Crea macros para ataques con arma, acciones melee o hechizos y
            tendras sus tiradas listas con un click.
          </div>
        ) : (
          character.attacks.map((attack) => {
            const isWeaponMacro = attack.actionType === "weapon";
            const weaponSnapshot = isWeaponMacro
              ? resolveWeaponSnapshot(attack)
              : null;
            const weaponAttackRollModifiers = [
              {
                label: "Bono base de ataque",
                value: character.baseAttackBonus,
              },
              ...((attack.weaponConfig?.attackModifiers ?? []).map(
                resolveModifier,
              ) ?? []),
            ];
            const weaponAttackBonuses = getWeaponAttackBonusTotals(attack);
            const weaponAttackCount = weaponAttackBonuses.length;
            const damageBonusSummary = summarizeModifiers(
              attack.weaponConfig?.damageModifiers ?? [],
            );
            const spellDamageGroups = getSpellDamageGroups(attack.spellConfig);
            const spellBonusSummary = summarizeModifiers(
              attack.spellConfig?.effectModifiers ?? [],
              spellDamageGroups,
            );
            const criticalAttackIndexes = weaponCriticalStates[attack.id] ?? [];
            const hasCriticalDamageState = criticalAttackIndexes.length > 0;
            const effectiveWeaponDiceCount =
              getEffectiveWeaponDiceCount(attack);
            const selectedAttackRollMode =
              attackRollModes[attack.id] ?? "normal";
            const isCollapsed = collapsedCards[attack.id] ?? false;
            const criticalRange = weaponSnapshot
              ? weaponSnapshot.criticalRangeStart >= 20
                ? "20"
                : `${weaponSnapshot.criticalRangeStart}-20`
              : null;
            const weaponAttackSummary = weaponAttackBonuses.every(
              (bonus) => bonus === weaponAttackBonuses[0],
            )
              ? `${formatModifier(weaponAttackBonuses[0] ?? 0)}${weaponAttackCount > 1 ? ` x${weaponAttackCount}` : ""}`
              : weaponAttackBonuses
                  .map((bonus) => formatModifier(bonus))
                  .join(" / ");
            const weaponDamageSummary = `${getWeaponDamageExpression(attack)}${
              damageBonusSummary.total !== 0 || damageBonusSummary.perDie !== 0
                ? ` (${formatModifierSummary(
                    damageBonusSummary.total,
                    damageBonusSummary.perDie,
                    effectiveWeaponDiceCount,
                  )})`
                : ""
            }`;
            const hasWeaponModifierBreakdown =
              damageBonusSummary.total !== 0 || damageBonusSummary.perDie !== 0;
            const weaponModifierBreakdown = hasWeaponModifierBreakdown
              ? formatModifierSummary(
                  damageBonusSummary.total,
                  damageBonusSummary.perDie,
                  effectiveWeaponDiceCount,
                )
              : "";
            const hasSpellModifierBreakdown =
              spellBonusSummary.total !== 0 ||
              spellBonusSummary.perDie !== 0 ||
              Object.values(spellBonusSummary.perGroup).some(
                (value) => value !== 0,
              );
            const spellModifierBreakdown = hasSpellModifierBreakdown
              ? formatSpellModifierSummary(
                  spellBonusSummary.total,
                  spellBonusSummary.perDie,
                  spellBonusSummary.perGroup,
                  spellDamageGroups,
                )
              : "";

            return (
              <MacroCard
                key={attack.id}
                title={attack.name}
                subtitle={
                  isWeaponMacro
                    ? "Macro de combate fisico"
                    : "Macro de conjuro o efecto"
                }
                icon={isWeaponMacro ? <WeaponMacroIcon /> : <SpellMacroIcon />}
                tone={isWeaponMacro ? "weapon" : "spell"}
                collapsed={isCollapsed}
                onToggle={() => toggleAttackCard(attack.id)}
                headerChips={
                  isWeaponMacro && weaponSnapshot ? (
                    <>
                      <MacroInfoChip
                        label="Perfil"
                        value={`${effectiveWeaponDiceCount}d${weaponSnapshot.damageDiceType}`}
                        tone="weapon"
                      />
                      <MacroInfoChip
                        label="Critico"
                        value={`${criticalRange}/x${weaponSnapshot.criticalMultiplier}`}
                        tone="weapon"
                      />
                    </>
                  ) : (
                    <>
                      <MacroInfoChip
                        label="Lanzamiento"
                        value={getSpellExpression(attack)}
                        tone="spell"
                      />
                      <MacroInfoChip
                        label="Toque"
                        value={
                          attack.spellConfig?.requiresTouchAttack
                            ? getSpellTouchAttackSummary(attack)
                            : "Sin toque"
                        }
                        tone="spell"
                      />
                    </>
                  )
                }
                details={
                  attack.actionType === "weapon" && weaponSnapshot ? (
                    <MacroBodyPanel tone="weapon">
                      <div className="flex flex-wrap gap-2">
                        <MacroInfoChip
                          label="Arma"
                          value={weaponSnapshot.name}
                          tone="weapon"
                        />
                        <MacroInfoChip
                          label="Tipo"
                          value={
                            attack.weaponConfig?.damageType
                              ? DAMAGE_TYPE_LABELS[
                                  attack.weaponConfig.damageType
                                ]
                              : "Sin tipo"
                          }
                          tone="neutral"
                        />
                      </div>

                      <div className="space-y-2 text-sm leading-6 text-muted-foreground">
                        <div>
                          <span className="text-[rgb(244,120,120)]/90">
                            Ataque
                          </span>{" "}
                          {weaponAttackSummary}
                        </div>
                        <div>
                          <span className="text-[rgb(244,120,120)]/90">
                            Base
                          </span>{" "}
                          {getWeaponBaseExpression(attack)}
                        </div>
                        <div>
                          <span className="text-[rgb(244,120,120)]/90">
                            Total
                          </span>{" "}
                          {getWeaponDamageExpression(attack)}
                        </div>
                        {hasWeaponModifierBreakdown ? (
                          <div>
                            <span className="text-[rgb(244,120,120)]/90">
                              Desglose de modificadores
                            </span>{" "}
                            {weaponModifierBreakdown}
                          </div>
                        ) : null}
                        <div>
                          <span className="text-[rgb(244,120,120)]/90">
                            Resumen
                          </span>{" "}
                          {weaponDamageSummary}
                        </div>
                      </div>

                      {renderAttackRollModeControls(attack)}
                    </MacroBodyPanel>
                  ) : (
                    <MacroBodyPanel tone="spell">
                      <div className="flex flex-wrap gap-2">
                        <MacroInfoChip
                          label="Dados"
                          value={spellDamageGroups
                            .map(
                              (group) => `${group.diceCount}d${group.diceType}`,
                            )
                            .join(" + ")}
                          tone="spell"
                        />
                        <MacroInfoChip
                          label="Aplicacion"
                          value={
                            attack.spellConfig?.requiresTouchAttack
                              ? "Con tirada de toque"
                              : "Resolucion directa"
                          }
                          tone="neutral"
                        />
                      </div>

                      <div className="space-y-2 text-sm leading-6 text-muted-foreground">
                        <div>
                          <span className="text-[rgb(124,181,255)]/90">
                            Base
                          </span>{" "}
                          {getSpellBaseExpression(attack)}
                        </div>

                        <div>
                          <span className="text-[rgb(124,181,255)]/90">
                            Total
                          </span>{" "}
                          {getSpellExpression(attack)}
                        </div>

                        {hasSpellModifierBreakdown ? (
                          <div>
                            <span className="text-[rgb(124,181,255)]/90">
                              Desglose de modificadores
                            </span>{" "}
                            {spellModifierBreakdown}
                          </div>
                        ) : null}

                        {attack.spellConfig?.requiresTouchAttack ? (
                          <div>{getSpellTouchAttackSummary(attack)}</div>
                        ) : null}
                      </div>

                      {attack.spellConfig?.requiresTouchAttack
                        ? renderAttackRollModeControls(attack)
                        : null}
                    </MacroBodyPanel>
                  )
                }
                notes={
                  attack.notes ||
                  (isWeaponMacro
                    ? "Sin notas adicionales para esta secuencia de combate."
                    : "Sin notas adicionales para este conjuro o efecto.")
                }
                actionStart={
                  <>
                    {attack.actionType === "weapon" ? (
                      <>
                        <div className="flex items-center">
                          <DiceButton
                            onClick={() =>
                              onRollAttack(
                                attack.id,
                                `${attack.name} Ataque`,
                                weaponAttackRollModifiers,
                                weaponAttackCount,
                                weaponSnapshot?.criticalRangeStart,
                                selectedAttackRollMode,
                                weaponAttackBonuses,
                              )
                            }
                            size="md"
                          />
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
                          tone={hasCriticalDamageState ? "success" : "weapon"}
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
                      <>
                        {attack.spellConfig?.requiresTouchAttack ? (
                          <div className="flex items-center">
                            <DiceButton
                              onClick={() =>
                                onRollAttack(
                                  undefined,
                                  `${attack.name} Toque`,
                                  getSpellTouchAttackModifiers(attack),
                                  1,
                                  undefined,
                                  selectedAttackRollMode,
                                )
                              }
                              size="md"
                            />
                          </div>
                        ) : null}

                        <MacroActionButton
                          onClick={() =>
                            onRollDamage(`${attack.name} Hechizo`, {
                              ...getSpellDamageConfig(attack),
                            })
                          }
                          title="Tirar hechizo"
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
                      </>
                    )}
                  </>
                }
                actionEnd={
                  <>
                    <MacroIconButton
                      onClick={() => setEditingActionId(attack.id)}
                      title="Editar macro"
                    >
                      <svg
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      >
                        <path
                          d="M4.5 15.5 5.1 12.9 12.95 5.05a1.5 1.5 0 0 1 2.12 0l.88.88a1.5 1.5 0 0 1 0 2.12L8.1 15.9 5.5 16.5Z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path d="m11.8 6.2 2 2" strokeLinecap="round" />
                      </svg>
                    </MacroIconButton>

                    <MacroIconButton
                      onClick={() => removeAttack(attack.id)}
                      title="Eliminar macro"
                      tone="danger"
                    >
                      <svg
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      >
                        <path d="M4.5 6h11" strokeLinecap="round" />
                        <path
                          d="M8 6V4.75A1.25 1.25 0 0 1 9.25 3.5h1.5A1.25 1.25 0 0 1 12 4.75V6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M6.25 6.75v7.5A1.75 1.75 0 0 0 8 16h4a1.75 1.75 0 0 0 1.75-1.75v-7.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path d="M8.5 9.25v4" strokeLinecap="round" />
                        <path d="M11.5 9.25v4" strokeLinecap="round" />
                      </svg>
                    </MacroIconButton>
                  </>
                }
              />
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
