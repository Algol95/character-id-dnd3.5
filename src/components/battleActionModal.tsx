import { useMemo, useState } from "react";
import { FormNumberInput } from "@/components/formNumberInput";
import { FormSelect, type FormSelectOption } from "@/components/formSelect";
import { Modal } from "./modal";
import { DAMAGE_DICE_TYPES, DiceIcon } from "./diceIcon";
import {
  DAMAGE_TYPE_LABELS,
  DAMAGE_TYPE_OPTIONS,
  type BattleActionModifierApplication,
  type DamageType,
  formatModifier,
  getAbilityModifier,
  type Attack,
  type BattleActionModifier,
  type BattleActionModifierSource,
  type BattleActionWeaponSnapshot,
  type CharacterData,
  type EquippedItem,
} from "@/lib/character-types";
import {
  EQUIPMENT_SLOT_LABELS,
  isEquippedWeaponCandidate,
} from "@/lib/equipment-effects";

interface BattleActionModalProps {
  character: CharacterData;
  action: Attack | null;
  onClose: () => void;
  onSave: (action: Attack) => void;
}

const ACTION_TYPE_OPTIONS: FormSelectOption[] = [
  { value: "weapon", label: "Ataque con arma o melee" },
  { value: "spell", label: "Hechizo o efecto" },
];

const WEAPON_SOURCE_OPTIONS: FormSelectOption[] = [
  { value: "equipped", label: "Arma equipada" },
  { value: "improvised", label: "Arma improvisada" },
];

const MODIFIER_SOURCE_LABELS: Record<
  Exclude<BattleActionModifierSource, "custom">,
  string
> = {
  baseAttackBonus: "Bono base de ataque",
  initiative: "Iniciativa",
  strength: "Fuerza",
  dexterity: "Destreza",
  constitution: "Constitucion",
  intelligence: "Inteligencia",
  wisdom: "Sabiduria",
  charisma: "Carisma",
};

const MODIFIER_SOURCE_OPTIONS: FormSelectOption[] = [
  { value: "baseAttackBonus", label: "Bono base de ataque" },
  { value: "initiative", label: "Iniciativa" },
  { value: "strength", label: "Mod. Fuerza" },
  { value: "dexterity", label: "Mod. Destreza" },
  { value: "constitution", label: "Mod. Constitucion" },
  { value: "intelligence", label: "Mod. Inteligencia" },
  { value: "wisdom", label: "Mod. Sabiduria" },
  { value: "charisma", label: "Mod. Carisma" },
  { value: "custom", label: "Ajuste manual" },
];

const MODIFIER_APPLICATION_OPTIONS: FormSelectOption[] = [
  { value: "total", label: "Al resultado total" },
  { value: "perDie", label: "A cada dado" },
];

const DAMAGE_DICE_OPTIONS: FormSelectOption[] = DAMAGE_DICE_TYPES.map(
  (dice) => ({
    value: String(dice.sides),
    label: dice.label,
    icon: (
      <span className={`flex items-center justify-center ${dice.colorClass}`}>
        <DiceIcon sides={dice.sides} className="h-5 w-5" />
      </span>
    ),
  }),
);

const DAMAGE_TYPE_SELECT_OPTIONS: FormSelectOption[] = [
  { value: "", label: "Sin especificar" },
  ...DAMAGE_TYPE_OPTIONS.map((damageType) => ({
    value: damageType.value,
    label: damageType.label,
  })),
];

function createBattleActionId(prefix = "battle") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createEmptyWeaponSnapshot(): BattleActionWeaponSnapshot {
  return {
    name: "",
    damageDiceCount: 1,
    damageDiceType: 6,
    criticalRangeStart: 20,
    criticalMultiplier: 2,
  };
}

function createDefaultSpellConfig() {
  return {
    damageDiceCount: 1,
    damageDiceType: 6,
    damageType: undefined,
    effectModifiers: [],
  };
}

function createEmptyModifier(): BattleActionModifier {
  return {
    id: createBattleActionId("modifier"),
    source: "baseAttackBonus",
    application: "total",
  };
}

function getEffectiveModifierApplication(
  modifier: BattleActionModifier,
  diceCount: number,
) {
  return diceCount <= 1 ? "perDie" : (modifier.application ?? "total");
}

function cloneModifier(modifier: BattleActionModifier): BattleActionModifier {
  return { ...modifier };
}

function cloneAction(action: Attack): Attack {
  return {
    ...action,
    weaponConfig: action.weaponConfig
      ? {
          ...action.weaponConfig,
          useCustomWeaponProfile:
            action.weaponConfig.useCustomWeaponProfile ?? false,
          extraDamageDiceCount: action.weaponConfig.extraDamageDiceCount ?? 0,
          weaponSnapshot: { ...action.weaponConfig.weaponSnapshot },
          attackModifiers:
            action.weaponConfig.attackModifiers.map(cloneModifier),
          damageModifiers:
            action.weaponConfig.damageModifiers.map(cloneModifier),
        }
      : undefined,
    spellConfig: action.spellConfig
      ? {
          ...action.spellConfig,
          damageDiceCount: action.spellConfig.damageDiceCount,
          damageDiceType: action.spellConfig.damageDiceType,
          damageType: action.spellConfig.damageType,
          effectModifiers:
            action.spellConfig.effectModifiers.map(cloneModifier),
        }
      : undefined,
  };
}

function normalizeWeaponSnapshot(
  snapshot?: Partial<BattleActionWeaponSnapshot>,
): BattleActionWeaponSnapshot {
  const damageDiceType = snapshot?.damageDiceType ?? 6;
  const isOfficialDie = DAMAGE_DICE_TYPES.some(
    (dice) => dice.sides === damageDiceType,
  );

  return {
    name: snapshot?.name?.trim() ?? "",
    damageDiceCount: Math.max(1, snapshot?.damageDiceCount ?? 1),
    damageDiceType: isOfficialDie ? damageDiceType : 6,
    criticalRangeStart: Math.min(
      20,
      Math.max(1, snapshot?.criticalRangeStart ?? 20),
    ),
    criticalMultiplier: Math.max(2, snapshot?.criticalMultiplier ?? 2),
  };
}

function getWeaponSnapshot(item: EquippedItem): BattleActionWeaponSnapshot {
  return normalizeWeaponSnapshot({
    name: item.name,
    damageDiceCount: item.weaponProfile?.damageDiceCount,
    damageDiceType: item.weaponProfile?.damageDiceType,
    criticalRangeStart: item.weaponProfile?.criticalRangeStart,
    criticalMultiplier: item.weaponProfile?.criticalMultiplier,
  });
}

function resolveModifierPreviewValue(
  character: CharacterData,
  modifier: BattleActionModifier,
  diceCount: number,
): number {
  const baseValue = (() => {
    switch (modifier.source) {
      case "custom":
        return modifier.customValue ?? 0;
      case "baseAttackBonus":
        return character.baseAttackBonus;
      case "initiative":
        return character.initiative;
      default:
        return getAbilityModifier(character[modifier.source]);
    }
  })();

  return getEffectiveModifierApplication(modifier, diceCount) === "perDie"
    ? baseValue * diceCount
    : baseValue;
}

function getModifierPreviewLabel(
  modifier: BattleActionModifier,
  diceCount: number,
) {
  return getEffectiveModifierApplication(modifier, diceCount) === "perDie"
    ? "por dado"
    : "al total";
}

function normalizeModifier(
  modifier: BattleActionModifier,
): BattleActionModifier {
  if (modifier.source === "custom") {
    return {
      ...modifier,
      application: modifier.application ?? "total",
      customLabel: modifier.customLabel?.trim() || "Ajuste manual",
      customValue: modifier.customValue ?? 0,
    };
  }

  return {
    id: modifier.id,
    source: modifier.source,
    application: modifier.application ?? "total",
  };
}

function createEmptyAction(firstWeapon: EquippedItem | null): Attack {
  if (firstWeapon) {
    return {
      id: createBattleActionId(),
      name: firstWeapon.name,
      actionType: "weapon",
      notes: "",
      weaponConfig: {
        source: "equipped",
        selectedWeaponId: firstWeapon.id,
        weaponSnapshot: getWeaponSnapshot(firstWeapon),
        damageType: undefined,
        useCustomWeaponProfile: false,
        extraDamageDiceCount: 0,
        attackModifiers: [],
        damageModifiers: [],
      },
    };
  }

  return {
    id: createBattleActionId(),
    name: "",
    actionType: "weapon",
    notes: "",
    weaponConfig: {
      source: "improvised",
      weaponSnapshot: createEmptyWeaponSnapshot(),
      damageType: undefined,
      useCustomWeaponProfile: false,
      extraDamageDiceCount: 0,
      attackModifiers: [],
      damageModifiers: [],
    },
  };
}

interface WeaponProfileEditorProps {
  snapshot: BattleActionWeaponSnapshot;
  onChange: (snapshot: BattleActionWeaponSnapshot) => void;
  nameLabel: string;
  namePlaceholder: string;
}

function WeaponProfileEditor({
  snapshot,
  onChange,
  nameLabel,
  namePlaceholder,
}: WeaponProfileEditorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block sm:col-span-2">
        <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {nameLabel}
        </span>
        <input
          type="text"
          value={snapshot.name}
          onChange={(event) =>
            onChange({
              ...snapshot,
              name: event.target.value,
            })
          }
          className="w-full rounded-xl px-3 py-2 text-sm"
          placeholder={namePlaceholder}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Cantidad de dados
        </span>
        <FormNumberInput
          value={snapshot.damageDiceCount}
          onChange={(value) =>
            onChange(
              normalizeWeaponSnapshot({
                ...snapshot,
                damageDiceCount: Number.parseInt(value, 10) || 1,
              }),
            )
          }
          min={1}
          className="w-full"
          inputClassName="rounded-xl px-3 py-2 text-center text-sm"
          ariaLabel="Cantidad de dados del arma"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Dado de dano
        </span>
        <FormSelect
          value={String(snapshot.damageDiceType)}
          onChange={(value) =>
            onChange(
              normalizeWeaponSnapshot({
                ...snapshot,
                damageDiceType: Number.parseInt(value, 10) || 6,
              }),
            )
          }
          options={DAMAGE_DICE_OPTIONS}
          ariaLabel="Dado del arma"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Critico desde
        </span>
        <FormNumberInput
          value={snapshot.criticalRangeStart}
          onChange={(value) =>
            onChange(
              normalizeWeaponSnapshot({
                ...snapshot,
                criticalRangeStart: Number.parseInt(value, 10) || 20,
              }),
            )
          }
          min={1}
          max={20}
          className="w-full"
          inputClassName="rounded-xl px-3 py-2 text-center text-sm"
          ariaLabel="Rango critico del arma"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Multiplicador critico
        </span>
        <FormNumberInput
          value={snapshot.criticalMultiplier}
          onChange={(value) =>
            onChange(
              normalizeWeaponSnapshot({
                ...snapshot,
                criticalMultiplier: Number.parseInt(value, 10) || 2,
              }),
            )
          }
          min={2}
          className="w-full"
          inputClassName="rounded-xl px-3 py-2 text-center text-sm"
          ariaLabel="Multiplicador critico del arma"
        />
      </label>
    </div>
  );
}

interface ModifierListEditorProps {
  title: string;
  description: string;
  character: CharacterData;
  modifiers: BattleActionModifier[];
  onChange: (modifiers: BattleActionModifier[]) => void;
  allowPerDie?: boolean;
  diceCount?: number;
}

function ModifierListEditor({
  title,
  description,
  character,
  modifiers,
  onChange,
  allowPerDie = false,
  diceCount = 1,
}: ModifierListEditorProps) {
  const previewTotal = useMemo(
    () =>
      modifiers.reduce(
        (total, modifier) =>
          total + resolveModifierPreviewValue(character, modifier, diceCount),
        0,
      ),
    [character, diceCount, modifiers],
  );

  const updateModifier = (
    modifierId: string,
    updater: (modifier: BattleActionModifier) => BattleActionModifier,
  ) => {
    onChange(
      modifiers.map((modifier) =>
        modifier.id === modifierId ? updater(modifier) : modifier,
      ),
    );
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-secondary/15 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold/80">
            {title}
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs text-gold">
          Total actual {formatModifier(previewTotal)}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {modifiers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-background/10 px-4 py-3 text-sm text-muted-foreground">
            No hay modificadores configurados.
          </div>
        ) : (
          modifiers.map((modifier) => {
            const previewValue = resolveModifierPreviewValue(
              character,
              modifier,
              diceCount,
            );

            return (
              <div
                key={modifier.id}
                className="rounded-xl border border-border/55 bg-background/20 p-3"
              >
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      Fuente del modificador
                    </span>
                    <FormSelect
                      value={modifier.source}
                      onChange={(value) =>
                        updateModifier(modifier.id, (currentModifier) => ({
                          ...currentModifier,
                          source: value as BattleActionModifierSource,
                          customLabel:
                            value === "custom"
                              ? (currentModifier.customLabel ?? "Ajuste manual")
                              : undefined,
                          customValue:
                            value === "custom"
                              ? (currentModifier.customValue ?? 0)
                              : undefined,
                        }))
                      }
                      options={MODIFIER_SOURCE_OPTIONS}
                      ariaLabel={`Fuente para ${title}`}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      onChange(
                        modifiers.filter(
                          (currentModifier) =>
                            currentModifier.id !== modifier.id,
                        ),
                      )
                    }
                    className="flex h-11 w-11 items-center justify-center self-end rounded-xl border border-border/60 bg-background/30 text-muted-foreground transition-colors hover:border-blood-red/40 hover:text-blood-red"
                    title="Quitar modificador"
                    aria-label="Quitar modificador"
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
                  </button>
                </div>

                {modifier.source === "custom" ? (
                  <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_110px]">
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        Etiqueta
                      </span>
                      <input
                        type="text"
                        value={modifier.customLabel ?? ""}
                        onChange={(event) =>
                          updateModifier(modifier.id, (currentModifier) => ({
                            ...currentModifier,
                            customLabel: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl px-3 py-2 text-sm"
                        placeholder="Ej. Bono de inspiracion"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        Valor
                      </span>
                      <FormNumberInput
                        value={modifier.customValue ?? 0}
                        onChange={(value) =>
                          updateModifier(modifier.id, (currentModifier) => ({
                            ...currentModifier,
                            customValue: Number.parseInt(value, 10) || 0,
                          }))
                        }
                        className="w-full"
                        inputClassName="rounded-xl px-3 py-2 text-center text-sm"
                        ariaLabel={`Valor manual para ${title}`}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-border/50 bg-background/18 px-3 py-2 text-sm text-muted-foreground">
                    Se aplicara como {MODIFIER_SOURCE_LABELS[modifier.source]}:{" "}
                    {formatModifier(previewValue)}{" "}
                    {getModifierPreviewLabel(modifier, diceCount)}
                  </div>
                )}

                {allowPerDie && diceCount > 1 ? (
                  <label className="mt-3 block">
                    <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      Como se aplica
                    </span>
                    <FormSelect
                      value={modifier.application ?? "total"}
                      onChange={(value) =>
                        updateModifier(modifier.id, (currentModifier) => ({
                          ...currentModifier,
                          application: value as BattleActionModifierApplication,
                        }))
                      }
                      options={MODIFIER_APPLICATION_OPTIONS}
                      ariaLabel={`Aplicacion para ${title}`}
                    />
                  </label>
                ) : null}
              </div>
            );
          })
        )}

        <button
          type="button"
          onClick={() => onChange([...modifiers, createEmptyModifier()])}
          className="rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-xs text-gold transition-colors hover:bg-gold/15"
        >
          + Anadir modificador
        </button>
      </div>
    </div>
  );
}

export function BattleActionModal({
  character,
  action,
  onClose,
  onSave,
}: BattleActionModalProps) {
  const equippedWeapons = useMemo(
    () => character.equippedItems.filter(isEquippedWeaponCandidate),
    [character.equippedItems],
  );

  const [draft, setDraft] = useState<Attack>(() =>
    action
      ? cloneAction(action)
      : createEmptyAction(equippedWeapons[0] ?? null),
  );

  const equippedWeaponOptions = useMemo<FormSelectOption[]>(
    () =>
      equippedWeapons.map((item) => ({
        value: item.id,
        label: `${item.name} (${EQUIPMENT_SLOT_LABELS[item.slot]})`,
      })),
    [equippedWeapons],
  );

  const weaponSourceOptions = useMemo<FormSelectOption[]>(
    () =>
      WEAPON_SOURCE_OPTIONS.map((option) => ({
        ...option,
        disabled: option.value === "equipped" && equippedWeapons.length === 0,
      })),
    [equippedWeapons.length],
  );

  const currentWeaponConfig = draft.weaponConfig;
  const currentSpellConfig = draft.spellConfig;
  const selectedEquippedWeapon =
    currentWeaponConfig?.source === "equipped"
      ? (equippedWeapons.find(
          (item) => item.id === currentWeaponConfig.selectedWeaponId,
        ) ?? null)
      : null;
  const equippedWeaponSnapshot = selectedEquippedWeapon
    ? getWeaponSnapshot(selectedEquippedWeapon)
    : null;
  const currentWeaponSnapshot = currentWeaponConfig
    ? currentWeaponConfig.source === "equipped" &&
      !currentWeaponConfig.useCustomWeaponProfile
      ? (equippedWeaponSnapshot ??
        normalizeWeaponSnapshot(currentWeaponConfig.weaponSnapshot))
      : normalizeWeaponSnapshot(currentWeaponConfig.weaponSnapshot)
    : null;
  const weaponAttackCount =
    1 + Math.max(0, currentWeaponConfig?.extraDamageDiceCount ?? 0);
  const effectiveWeaponDiceCount =
    Math.max(1, currentWeaponSnapshot?.damageDiceCount ?? 1) *
    weaponAttackCount;

  const canSave =
    draft.name.trim().length > 0 &&
    (draft.actionType === "spell"
      ? Boolean(
          currentSpellConfig?.damageDiceCount &&
          currentSpellConfig?.damageDiceType,
        )
      : currentWeaponConfig?.source === "equipped"
        ? Boolean(currentWeaponConfig.selectedWeaponId || equippedWeapons[0])
        : Boolean(currentWeaponConfig?.weaponSnapshot.name.trim()));

  const setWeaponConfig = (
    updater: (
      currentConfig: NonNullable<Attack["weaponConfig"]>,
    ) => NonNullable<Attack["weaponConfig"]>,
  ) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      actionType: "weapon",
      spellConfig: undefined,
      weaponConfig: updater(
        currentDraft.weaponConfig ?? {
          source: equippedWeapons.length > 0 ? "equipped" : "improvised",
          selectedWeaponId: equippedWeapons[0]?.id,
          weaponSnapshot: equippedWeapons[0]
            ? getWeaponSnapshot(equippedWeapons[0])
            : createEmptyWeaponSnapshot(),
          damageType: undefined,
          useCustomWeaponProfile: false,
          extraDamageDiceCount: 0,
          attackModifiers: [],
          damageModifiers: [],
        },
      ),
    }));
  };

  const setSpellConfig = (
    updater: (
      currentConfig: NonNullable<Attack["spellConfig"]>,
    ) => NonNullable<Attack["spellConfig"]>,
  ) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      actionType: "spell",
      weaponConfig: undefined,
      spellConfig: updater(
        currentDraft.spellConfig ?? createDefaultSpellConfig(),
      ),
    }));
  };

  const handleSave = () => {
    if (!canSave) {
      return;
    }

    const trimmedName = draft.name.trim();
    const trimmedNotes = draft.notes.trim();
    const spellConfig = draft.spellConfig;

    if (draft.actionType === "spell" && spellConfig) {
      onSave({
        id: draft.id || createBattleActionId(),
        name: trimmedName,
        actionType: "spell",
        notes: trimmedNotes,
        spellConfig: {
          damageDiceCount: Math.max(1, spellConfig.damageDiceCount),
          damageDiceType: spellConfig.damageDiceType,
          damageType: spellConfig.damageType,
          effectModifiers: spellConfig.effectModifiers.map((modifier) => {
            const normalizedModifier = normalizeModifier(modifier);

            return {
              ...normalizedModifier,
              application:
                spellConfig.damageDiceCount <= 1
                  ? "perDie"
                  : normalizedModifier.application,
            };
          }),
        },
      });
      return;
    }

    const baseWeaponConfig = draft.weaponConfig;
    if (!baseWeaponConfig) {
      return;
    }

    const equippedWeapon =
      baseWeaponConfig.source === "equipped"
        ? (equippedWeapons.find(
            (item) => item.id === baseWeaponConfig.selectedWeaponId,
          ) ?? null)
        : null;
    const weaponSnapshot = equippedWeapon
      ? baseWeaponConfig.source === "equipped" &&
        baseWeaponConfig.useCustomWeaponProfile
        ? normalizeWeaponSnapshot(baseWeaponConfig.weaponSnapshot)
        : getWeaponSnapshot(equippedWeapon)
      : normalizeWeaponSnapshot(baseWeaponConfig.weaponSnapshot);
    const normalizedSnapshot = {
      ...weaponSnapshot,
      name: weaponSnapshot.name.trim() || trimmedName,
    };

    onSave({
      id: draft.id || createBattleActionId(),
      name: trimmedName,
      actionType: "weapon",
      notes: trimmedNotes,
      weaponConfig: {
        source: baseWeaponConfig.source,
        selectedWeaponId:
          baseWeaponConfig.source === "equipped"
            ? (equippedWeapon?.id ?? baseWeaponConfig.selectedWeaponId)
            : undefined,
        weaponSnapshot: normalizedSnapshot,
        damageType: baseWeaponConfig.damageType,
        useCustomWeaponProfile:
          baseWeaponConfig.source === "equipped"
            ? Boolean(baseWeaponConfig.useCustomWeaponProfile)
            : false,
        extraDamageDiceCount: Math.max(
          0,
          baseWeaponConfig.extraDamageDiceCount ?? 0,
        ),
        attackModifiers:
          baseWeaponConfig.attackModifiers.map(normalizeModifier),
        damageModifiers: baseWeaponConfig.damageModifiers.map((modifier) => {
          const normalizedModifier = normalizeModifier(modifier);

          return {
            ...normalizedModifier,
            application:
              effectiveWeaponDiceCount <= 1
                ? "perDie"
                : normalizedModifier.application,
          };
        }),
      },
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      panelClassName="max-w-6xl"
      header={
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-gold/75">
              Acciones de batalla
            </div>
            <h3 className="mt-1 text-2xl font-semibold text-foreground">
              {action ? "Editar macro" : "Nueva macro"}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Configura un ataque con arma o un hechizo con sus tiradas, bonos y
              dano automatizable.
            </p>
          </div>

          <div className="rounded-full border border-gold/25 bg-gold/10 px-4 py-2 text-sm text-gold">
            {draft.actionType === "weapon" ? "Arma / melee" : "Hechizo"}
          </div>
        </div>
      }
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-border/60 bg-background/20 px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="rounded-2xl border border-gold/45 bg-gold/14 px-5 py-2.5 text-sm font-semibold text-gold transition-colors hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Guardar macro
          </button>
        </div>
      }
    >
      <div className="grid gap-5 grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <form className="min-w-0 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Nombre de la accion
              </span>
              <input
                type="text"
                value={draft.name}
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    name: event.target.value,
                  }))
                }
                className="w-full rounded-2xl px-4 py-3 text-sm"
                placeholder="Ej. Espadazo giratorio o Proyectil magico"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Tipo de macro
              </span>
              <FormSelect
                value={draft.actionType}
                onChange={(value) => {
                  if (value === "spell") {
                    setSpellConfig((currentConfig) => currentConfig);
                    return;
                  }

                  setWeaponConfig((currentConfig) => currentConfig);
                }}
                options={ACTION_TYPE_OPTIONS}
                ariaLabel="Tipo de accion"
              />
            </label>

            {draft.actionType === "weapon" && currentWeaponConfig ? (
              <>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Fuente del arma
                  </span>
                  <FormSelect
                    value={currentWeaponConfig.source}
                    onChange={(value) =>
                      setWeaponConfig((currentConfig) => {
                        if (value === "equipped") {
                          const weapon = equippedWeapons[0] ?? null;

                          return {
                            ...currentConfig,
                            source: "equipped",
                            selectedWeaponId: weapon?.id,
                            useCustomWeaponProfile: false,
                            weaponSnapshot: weapon
                              ? getWeaponSnapshot(weapon)
                              : currentConfig.weaponSnapshot,
                          };
                        }

                        return {
                          ...currentConfig,
                          source: "improvised",
                          selectedWeaponId: undefined,
                          useCustomWeaponProfile: false,
                          weaponSnapshot:
                            currentConfig.source === "equipped"
                              ? createEmptyWeaponSnapshot()
                              : currentConfig.weaponSnapshot,
                        };
                      })
                    }
                    options={weaponSourceOptions}
                    ariaLabel="Fuente del arma"
                  />
                </label>

                {currentWeaponConfig.source === "equipped" ? (
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Arma equipada
                    </span>
                    <FormSelect
                      value={
                        currentWeaponConfig.selectedWeaponId ??
                        equippedWeapons[0]?.id ??
                        ""
                      }
                      onChange={(value) =>
                        setWeaponConfig((currentConfig) => {
                          const weapon =
                            equippedWeapons.find((item) => item.id === value) ??
                            null;

                          if (!weapon) {
                            return currentConfig;
                          }

                          return {
                            ...currentConfig,
                            selectedWeaponId: weapon.id,
                            weaponSnapshot: getWeaponSnapshot(weapon),
                          };
                        })
                      }
                      options={equippedWeaponOptions}
                      placeholder="Selecciona un arma equipada"
                      ariaLabel="Arma equipada"
                      disabled={equippedWeapons.length === 0}
                    />
                  </label>
                ) : null}

                <label className="block">
                  <span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Tipo de dano
                  </span>
                  <FormSelect
                    value={currentWeaponConfig.damageType ?? ""}
                    onChange={(value) =>
                      setWeaponConfig((currentConfig) => ({
                        ...currentConfig,
                        damageType:
                          value.trim().length > 0
                            ? (value as DamageType)
                            : undefined,
                      }))
                    }
                    options={DAMAGE_TYPE_SELECT_OPTIONS}
                    ariaLabel="Tipo de dano del arma"
                  />
                </label>
              </>
            ) : null}
          </div>

          {draft.actionType === "weapon" && currentWeaponConfig ? (
            <>
              {currentWeaponConfig.source === "improvised" ? (
                <div className="rounded-2xl border border-border/60 bg-secondary/15 p-4">
                  <WeaponProfileEditor
                    snapshot={currentWeaponConfig.weaponSnapshot}
                    onChange={(weaponSnapshot) =>
                      setWeaponConfig((currentConfig) => ({
                        ...currentConfig,
                        weaponSnapshot,
                      }))
                    }
                    nameLabel="Nombre del arma improvisada"
                    namePlaceholder="Ej. Silla rota o antorcha"
                  />
                </div>
              ) : null}

              <label className="block">
                <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  Ataques extra
                </span>
                <FormNumberInput
                  value={Math.max(
                    0,
                    currentWeaponConfig.extraDamageDiceCount ?? 0,
                  )}
                  onChange={(value) =>
                    setWeaponConfig((currentConfig) => ({
                      ...currentConfig,
                      extraDamageDiceCount: Math.max(
                        0,
                        Number.parseInt(value, 10) || 0,
                      ),
                    }))
                  }
                  min={0}
                  className="w-full"
                  inputClassName="rounded-xl px-3 py-2 text-center text-sm"
                  ariaLabel="Ataques extra del arma"
                />
              </label>

              {currentWeaponConfig.source === "equipped" ? (
                <div className="rounded-2xl border border-border/60 bg-secondary/15 p-4 text-sm leading-6 text-muted-foreground">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.18em] text-gold/80">
                        Perfil del arma para esta macro
                      </div>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                        Puedes dejar el perfil vinculado al arma equipada o
                        sobrescribirlo solo para esta macro.
                      </p>
                    </div>

                    {currentWeaponConfig.useCustomWeaponProfile ? (
                      <button
                        type="button"
                        onClick={() =>
                          setWeaponConfig((currentConfig) => ({
                            ...currentConfig,
                            useCustomWeaponProfile: false,
                            weaponSnapshot:
                              equippedWeaponSnapshot ??
                              currentConfig.weaponSnapshot,
                          }))
                        }
                        className="rounded-full border border-border/60 bg-background/20 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-gold/45 hover:text-foreground"
                      >
                        Resetear al arma equipada
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setWeaponConfig((currentConfig) => ({
                            ...currentConfig,
                            useCustomWeaponProfile: true,
                            weaponSnapshot:
                              currentWeaponSnapshot ??
                              currentConfig.weaponSnapshot,
                          }))
                        }
                        className="rounded-full border border-gold/35 bg-gold/10 px-3 py-1.5 text-xs text-gold transition-colors hover:bg-gold/15"
                      >
                        Editar perfil para esta macro
                      </button>
                    )}
                  </div>

                  {currentWeaponConfig.useCustomWeaponProfile ? (
                    <div className="mt-4">
                      <WeaponProfileEditor
                        snapshot={currentWeaponConfig.weaponSnapshot}
                        onChange={(weaponSnapshot) =>
                          setWeaponConfig((currentConfig) => ({
                            ...currentConfig,
                            weaponSnapshot,
                          }))
                        }
                        nameLabel="Nombre del arma en esta macro"
                        namePlaceholder="Ej. Espada corta con veneno"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="mt-3 text-foreground">
                        {currentWeaponSnapshot?.name || "Arma sin nombre"}
                      </div>
                      <div className="mt-1">
                        {(() => {
                          const snapshot =
                            currentWeaponSnapshot ??
                            createEmptyWeaponSnapshot();
                          const criticalRange =
                            snapshot.criticalRangeStart >= 20
                              ? "20"
                              : `${snapshot.criticalRangeStart}-20`;
                          const damageTypeLabel = currentWeaponConfig.damageType
                            ? DAMAGE_TYPE_LABELS[currentWeaponConfig.damageType]
                            : null;

                          return `${effectiveWeaponDiceCount}d${snapshot.damageDiceType}${damageTypeLabel ? ` | ${damageTypeLabel}` : ""} | Critico ${criticalRange}/x${snapshot.criticalMultiplier}`;
                        })()}
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </>
          ) : null}

          {draft.actionType === "spell" && currentSpellConfig ? (
            <>
              <div className="rounded-2xl border border-border/60 bg-secondary/15 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      Cantidad de dados
                    </span>
                    <FormNumberInput
                      value={currentSpellConfig.damageDiceCount}
                      onChange={(value) =>
                        setSpellConfig((currentConfig) => ({
                          ...currentConfig,
                          damageDiceCount: Number.parseInt(value, 10) || 1,
                        }))
                      }
                      min={1}
                      className="w-full"
                      inputClassName="rounded-xl px-3 py-2 text-center text-sm"
                      ariaLabel="Cantidad de dados del hechizo"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      Dado del hechizo o efecto
                    </span>
                    <FormSelect
                      value={String(currentSpellConfig.damageDiceType)}
                      onChange={(value) =>
                        setSpellConfig((currentConfig) => ({
                          ...currentConfig,
                          damageDiceType: Number.parseInt(value, 10) || 6,
                        }))
                      }
                      options={DAMAGE_DICE_OPTIONS}
                      ariaLabel="Dado del hechizo"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      Tipo de dano
                    </span>
                    <FormSelect
                      value={currentSpellConfig.damageType ?? ""}
                      onChange={(value) =>
                        setSpellConfig((currentConfig) => ({
                          ...currentConfig,
                          damageType:
                            value.trim().length > 0
                              ? (value as DamageType)
                              : undefined,
                        }))
                      }
                      options={DAMAGE_TYPE_SELECT_OPTIONS}
                      ariaLabel="Tipo de dano del hechizo"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-secondary/15 p-4 text-sm leading-6 text-muted-foreground">
                Configura la base del hechizo igual que un arma: cantidad de
                dados y tipo de dado. Los ajustes extra se sumaran despues.
              </div>
            </>
          ) : null}

          <label className="block">
            <span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Notas
            </span>
            <textarea
              value={draft.notes}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  notes: event.target.value,
                }))
              }
              className="h-28 w-full resize-none rounded-2xl px-4 py-3 text-sm"
              placeholder="Alcance, condiciones, texto de conjuro, observaciones tacticas..."
            />
          </label>
        </form>

        <div className="min-w-0 space-y-4">
          {draft.actionType === "weapon" && currentWeaponConfig ? (
            <>
              <ModifierListEditor
                title="Bonos al ataque"
                description="Aqui puedes sumar atributos o estadisticas al d20 del ataque."
                character={character}
                modifiers={currentWeaponConfig.attackModifiers}
                onChange={(attackModifiers) =>
                  setWeaponConfig((currentConfig) => ({
                    ...currentConfig,
                    attackModifiers,
                  }))
                }
              />

              <ModifierListEditor
                title="Bonos al dano"
                description="Los modificadores se sumaran al dano base del arma seleccionada."
                character={character}
                modifiers={currentWeaponConfig.damageModifiers}
                allowPerDie
                diceCount={effectiveWeaponDiceCount}
                onChange={(damageModifiers) =>
                  setWeaponConfig((currentConfig) => ({
                    ...currentConfig,
                    damageModifiers,
                  }))
                }
              />
            </>
          ) : null}

          {draft.actionType === "spell" && currentSpellConfig ? (
            <ModifierListEditor
              title="Bufos o ajustes del hechizo"
              description="Añade bonos manuales o atributos que deban sumarse al efecto del conjuro."
              character={character}
              modifiers={currentSpellConfig.effectModifiers}
              allowPerDie
              diceCount={currentSpellConfig.damageDiceCount}
              onChange={(effectModifiers) =>
                setSpellConfig((currentConfig) => ({
                  ...currentConfig,
                  effectModifiers,
                }))
              }
            />
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
