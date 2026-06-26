import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useDiceRoller, type DiceRollMode } from "@/hooks/use-dice-roller";
import { DiceRollModal } from "./diceRollModal";
import { BasicInfo } from "./basicInfo";
import { AbilityScores } from "./abilityScores";
import { SavingThrows } from "./savingThrows";
import { Attacks } from "./attacks";
import { Skills } from "./skills";
import { EquippedGear } from "./equippedGear";
import { Equipment } from "./equipment";
import { Feats } from "./feats";
import { DiceRoller } from "./diceRoller";
import { Header } from "./header";
import { Footer } from "./footer";
import {
  DEFAULT_CHARACTER,
  type CarryingCapacity,
  getSpellDamageGroups,
  type Attack,
  type CharacterData,
  type EquippedItem,
  type InventoryItem,
  type WeaponProfile,
} from "@/lib/character-types";
import { computeEquipmentBonuses } from "@/lib/equipment-effects";

const STORAGE_KEY = "dnd35-character-sheet";
const SECTION_VISIBILITY_KEY = "dnd35-section-visibility";

type SaveStatus = "saved" | "saving" | "error";
type RollModifier = { label: string; value: number };
type WeaponCriticalStateMap = Record<string, number[]>;

type SectionKey =
  | "basicInfo"
  | "abilities"
  | "saves"
  | "attacks"
  | "equippedGear"
  | "equipment"
  | "dice"
  | "skills"
  | "feats";

const DEFAULT_SECTION_VISIBILITY: Record<SectionKey, boolean> = {
  basicInfo: true,
  abilities: true,
  saves: true,
  attacks: true,
  equippedGear: true,
  equipment: true,
  dice: true,
  skills: true,
  feats: true,
};

interface ParsedDamageRoll {
  numDice: number;
  diceType: number;
  modifier: number;
}

interface PanelSectionProps {
  eyebrow: string;
  title: string;
  caption: string;
  sticky?: boolean;
  children: ReactNode;
}

type StoredEquippedItem = EquippedItem & Partial<WeaponProfile>;
type StoredInventoryItem = Partial<InventoryItem>;
type StoredCarryingCapacity = Partial<CarryingCapacity>;

const OFFICIAL_DAMAGE_DICE_TYPES = new Set([4, 6, 8, 10, 12]);

function readStoredState<T extends object>(
  storageKey: string,
  fallback: T,
  errorMessage: string,
) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      return { ...fallback, ...JSON.parse(saved) } as T;
    }
  } catch (err) {
    console.error(errorMessage, err);
  }

  return fallback;
}

function persistStoredState(
  storageKey: string,
  value: unknown,
  errorMessage: string,
) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(errorMessage, err);
    return false;
  }
}

function parseDamageRoll(damageString: string): ParsedDamageRoll | null {
  const match = damageString.match(/^(\d+)d(\d+)([+-]\d+)?$/i);

  if (!match) {
    return null;
  }

  return {
    numDice: Number.parseInt(match[1], 10),
    diceType: Number.parseInt(match[2], 10),
    modifier: match[3] ? Number.parseInt(match[3], 10) : 0,
  };
}

type LegacyStoredAttack = {
  name?: string;
  attackBonus?: number;
  damage?: string;
  critical?: string;
  range?: string;
  type?: string;
  notes?: string;
};

function createBattleActionId(prefix = "battle") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeStoredInventory(
  equipment: CharacterData["equipment"] | StoredInventoryItem[] | string | null,
): InventoryItem[] {
  if (typeof equipment === "string") {
    return equipment
      .split(/\r?\n/)
      .map((line) => line.replace(/^\s*[-*•]\s*/, "").trim())
      .filter(Boolean)
      .map((name) => ({
        id: createBattleActionId("inventory"),
        name,
        quantity: 1,
        weight: 0,
      }));
  }

  if (!Array.isArray(equipment)) {
    return [];
  }

  return equipment.map((item) => ({
    id:
      typeof item.id === "string" && item.id.trim().length > 0
        ? item.id
        : createBattleActionId("inventory"),
    name: typeof item.name === "string" ? item.name : "",
    quantity:
      typeof item.quantity === "number" && Number.isFinite(item.quantity)
        ? Math.max(0, Math.trunc(item.quantity))
        : 1,
    weight:
      typeof item.weight === "number" && Number.isFinite(item.weight)
        ? Math.max(0, item.weight)
        : 0,
  }));
}

function normalizeStoredCarryingCapacity(
  carryingCapacity:
    | CharacterData["carryingCapacity"]
    | StoredCarryingCapacity
    | null
    | undefined,
): CarryingCapacity {
  return {
    lightLoad:
      typeof carryingCapacity?.lightLoad === "number" &&
      Number.isFinite(carryingCapacity.lightLoad)
        ? Math.max(0, Math.trunc(carryingCapacity.lightLoad))
        : DEFAULT_CHARACTER.carryingCapacity.lightLoad,
    mediumLoad:
      typeof carryingCapacity?.mediumLoad === "number" &&
      Number.isFinite(carryingCapacity.mediumLoad)
        ? Math.max(0, Math.trunc(carryingCapacity.mediumLoad))
        : DEFAULT_CHARACTER.carryingCapacity.mediumLoad,
    heavyLoad:
      typeof carryingCapacity?.heavyLoad === "number" &&
      Number.isFinite(carryingCapacity.heavyLoad)
        ? Math.max(0, Math.trunc(carryingCapacity.heavyLoad))
        : DEFAULT_CHARACTER.carryingCapacity.heavyLoad,
    liftOverHead:
      typeof carryingCapacity?.liftOverHead === "number" &&
      Number.isFinite(carryingCapacity.liftOverHead)
        ? Math.max(0, Math.trunc(carryingCapacity.liftOverHead))
        : DEFAULT_CHARACTER.carryingCapacity.liftOverHead,
    liftOffGround:
      typeof carryingCapacity?.liftOffGround === "number" &&
      Number.isFinite(carryingCapacity.liftOffGround)
        ? Math.max(0, Math.trunc(carryingCapacity.liftOffGround))
        : DEFAULT_CHARACTER.carryingCapacity.liftOffGround,
    pushOrDrag:
      typeof carryingCapacity?.pushOrDrag === "number" &&
      Number.isFinite(carryingCapacity.pushOrDrag)
        ? Math.max(0, Math.trunc(carryingCapacity.pushOrDrag))
        : DEFAULT_CHARACTER.carryingCapacity.pushOrDrag,
  };
}

function parseLegacyCritical(critical?: string) {
  if (!critical) {
    return { criticalRangeStart: 20, criticalMultiplier: 2 };
  }

  const criticalMatch = critical.match(/(?:(\d+)-20|20)?\s*\/?\s*x?(\d+)/i);

  if (!criticalMatch) {
    return { criticalRangeStart: 20, criticalMultiplier: 2 };
  }

  return {
    criticalRangeStart: criticalMatch[1]
      ? Number.parseInt(criticalMatch[1], 10)
      : 20,
    criticalMultiplier: Number.parseInt(criticalMatch[2], 10) || 2,
  };
}

function migrateLegacyAttack(legacyAttack: LegacyStoredAttack): Attack {
  const parsedDamage = parseDamageRoll(legacyAttack.damage?.trim() ?? "");
  const critical = parseLegacyCritical(legacyAttack.critical);
  const legacyNotes = [
    legacyAttack.range,
    legacyAttack.type,
    legacyAttack.notes,
  ]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" | ");

  return {
    id: createBattleActionId(),
    name: legacyAttack.name?.trim() || "Ataque heredado",
    actionType: "weapon",
    notes: legacyNotes,
    weaponConfig: {
      source: "improvised",
      weaponSnapshot: {
        name: legacyAttack.name?.trim() || "Arma heredada",
        damageDiceCount: parsedDamage?.numDice ?? 1,
        damageDiceType: parsedDamage?.diceType ?? 6,
        criticalRangeStart: critical.criticalRangeStart,
        criticalMultiplier: critical.criticalMultiplier,
      },
      attackModifiers:
        typeof legacyAttack.attackBonus === "number" &&
        legacyAttack.attackBonus !== 0
          ? [
              {
                id: createBattleActionId("modifier"),
                source: "custom",
                customLabel: "Ataque legado",
                customValue: legacyAttack.attackBonus,
              },
            ]
          : [],
      damageModifiers:
        parsedDamage && parsedDamage.modifier !== 0
          ? [
              {
                id: createBattleActionId("modifier"),
                source: "custom",
                customLabel: "Dano legado",
                customValue: parsedDamage.modifier,
              },
            ]
          : [],
    },
  };
}

function normalizeStoredAttack(
  storedAttack: Attack | LegacyStoredAttack,
): Attack {
  if ("actionType" in storedAttack) {
    const legacySpellExpression =
      storedAttack.spellConfig && "rollExpression" in storedAttack.spellConfig
        ? typeof storedAttack.spellConfig.rollExpression === "string"
          ? storedAttack.spellConfig.rollExpression
          : ""
        : "";
    const normalizedSpellConfig = storedAttack.spellConfig
      ? "rollExpression" in storedAttack.spellConfig
        ? (() => {
            const parsedLegacySpellDamage = parseDamageRoll(
              legacySpellExpression,
            );
            const normalizedDamageDiceGroups = [
              {
                id: createBattleActionId("spell-dice"),
                diceCount: parsedLegacySpellDamage?.numDice ?? 1,
                diceType: parsedLegacySpellDamage?.diceType ?? 6,
                damageType: storedAttack.spellConfig.damageType,
              },
            ];

            return {
              damageDiceCount: normalizedDamageDiceGroups[0].diceCount,
              damageDiceType: normalizedDamageDiceGroups[0].diceType,
              damageDiceGroups: normalizedDamageDiceGroups,
              damageType: normalizedDamageDiceGroups[0].damageType,
              requiresTouchAttack: false,
              touchAttackType: "melee" as const,
              effectModifiers: storedAttack.spellConfig.effectModifiers ?? [],
            };
          })()
        : (() => {
            const normalizedDamageDiceGroups = getSpellDamageGroups(
              storedAttack.spellConfig,
            ).map((group) => ({
              ...group,
              id: group.id || createBattleActionId("spell-dice"),
            }));

            return {
              damageDiceCount: normalizedDamageDiceGroups[0]?.diceCount ?? 1,
              damageDiceType: normalizedDamageDiceGroups[0]?.diceType ?? 6,
              damageDiceGroups: normalizedDamageDiceGroups,
              damageType: normalizedDamageDiceGroups[0]?.damageType,
              requiresTouchAttack: Boolean(
                storedAttack.spellConfig.requiresTouchAttack,
              ),
              touchAttackType:
                storedAttack.spellConfig.touchAttackType === "ranged"
                  ? ("ranged" as const)
                  : ("melee" as const),
              effectModifiers: storedAttack.spellConfig.effectModifiers ?? [],
            };
          })()
      : undefined;

    return {
      ...storedAttack,
      id: storedAttack.id || createBattleActionId(),
      weaponConfig: storedAttack.weaponConfig
        ? {
            ...storedAttack.weaponConfig,
            isFullAttack: Boolean(storedAttack.weaponConfig.isFullAttack),
            useCustomWeaponProfile: Boolean(
              storedAttack.weaponConfig.useCustomWeaponProfile,
            ),
            extraDamageDiceCount: Math.max(
              0,
              storedAttack.weaponConfig.extraDamageDiceCount ?? 0,
            ),
          }
        : undefined,
      spellConfig: normalizedSpellConfig,
    };
  }

  return migrateLegacyAttack(storedAttack);
}

function normalizeStoredEquippedItem(item: StoredEquippedItem): EquippedItem {
  const shouldTreatAsWeapon =
    Boolean(item.weaponProfile) ||
    item.category === "weapon" ||
    item.slot === "ranged";
  const legacyWeaponProfile =
    item.weaponProfile ??
    (shouldTreatAsWeapon
      ? {
          damageDiceCount: item.damageDiceCount,
          damageDiceType: item.damageDiceType,
          criticalRangeStart: item.criticalRangeStart,
          criticalMultiplier: item.criticalMultiplier,
        }
      : undefined);
  const normalizedDamageDiceType =
    legacyWeaponProfile?.damageDiceType &&
    OFFICIAL_DAMAGE_DICE_TYPES.has(legacyWeaponProfile.damageDiceType)
      ? legacyWeaponProfile.damageDiceType
      : 8;

  return {
    ...item,
    category: item.slot === "ranged" ? "weapon" : item.category,
    description: item.description ?? "",
    effects: item.effects ?? [],
    weaponProfile: shouldTreatAsWeapon
      ? {
          damageDiceCount: Math.max(
            1,
            legacyWeaponProfile?.damageDiceCount ?? 1,
          ),
          damageDiceType: normalizedDamageDiceType,
          criticalRangeStart: Math.min(
            20,
            Math.max(1, legacyWeaponProfile?.criticalRangeStart ?? 20),
          ),
          criticalMultiplier: Math.max(
            2,
            legacyWeaponProfile?.criticalMultiplier ?? 2,
          ),
        }
      : undefined,
  };
}

function sanitizeCharacterData(character: CharacterData): CharacterData {
  return {
    ...character,
    attacks: character.attacks.map(normalizeStoredAttack),
    equippedItems: character.equippedItems
      .filter((item) => item.slot !== "ammunition")
      .map((item) => normalizeStoredEquippedItem(item as StoredEquippedItem)),
    equipment: normalizeStoredInventory(
      character.equipment as CharacterData["equipment"] | string,
    ),
    carryingCapacity: normalizeStoredCarryingCapacity(
      character.carryingCapacity,
    ),
  };
}
/**
 * Agrupa la presentacion visual comun de cada columna principal del panel.
 */
function PanelSection({
  eyebrow,
  title,
  caption,
  sticky = false,
  children,
}: PanelSectionProps) {
  return (
    <section
      className={`self-start rounded-3xl border border-border/50 bg-background/12 p-3 md:p-4 ${sticky ? "lg:sticky lg:top-5" : ""}`}
    >
      <div className="mb-4 flex items-end justify-between gap-3 border-b border-border/50 pb-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-gold/80">
            {eyebrow}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">
            {title}
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">{caption}</span>
      </div>

      <div className="space-y-6">{children}</div>
    </section>
  );
}

/**
 * Renderiza el contenedor principal de la hoja de personaje y coordina el
 * estado global de la aplicacion.
 *
 * Gestiona la persistencia local, el plegado de secciones, la exportacion,
 * la importacion y las tiradas de dados mostradas en el modal.
 */
export function CharacterId() {
  const [character, setCharacter] = useState<CharacterData>(() =>
    sanitizeCharacterData(
      readStoredState(
        STORAGE_KEY,
        DEFAULT_CHARACTER,
        "[v0] Failed to load character:",
      ),
    ),
  );
  const [rollLabel, setRollLabel] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [visibleSections, setVisibleSections] = useState<
    Record<SectionKey, boolean>
  >(() =>
    readStoredState(
      SECTION_VISIBILITY_KEY,
      DEFAULT_SECTION_VISIBILITY,
      "[v0] Failed to load section visibility:",
    ),
  );

  const { isRolling, result, showResult, rollDice, closeResult } =
    useDiceRoller();
  const [weaponCriticalStates, setWeaponCriticalStates] =
    useState<WeaponCriticalStateMap>({});
  const equipmentBonuses = useMemo(
    () => computeEquipmentBonuses(character),
    [character],
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSaveStatus("saving");

      const didPersist = persistStoredState(
        STORAGE_KEY,
        character,
        "[v0] Failed to save character:",
      );

      setSaveStatus(didPersist ? "saved" : "error");
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [character]);

  useEffect(() => {
    persistStoredState(
      SECTION_VISIBILITY_KEY,
      visibleSections,
      "[v0] Failed to save section visibility:",
    );
  }, [visibleSections]);

  const handleChange = useCallback((updates: Partial<CharacterData>) => {
    setCharacter((prev) => sanitizeCharacterData({ ...prev, ...updates }));
  }, []);

  const toggleSection = useCallback((section: SectionKey) => {
    setVisibleSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const handleRoll = useCallback(
    (
      label: string,
      modifiers: RollModifier[],
      diceType: number = 20,
      mode: DiceRollMode = "normal",
    ) => {
      setRollLabel(label);
      rollDice(diceType, modifiers, { mode });
    },
    [rollDice],
  );

  const handleNamedRoll = useCallback(
    (
      actionId: string | undefined,
      label: string,
      modifiers: RollModifier[],
      diceCount = 1,
      criticalThreatRangeStart?: number,
      mode: DiceRollMode = "normal",
      attackBonusTotals?: number[],
    ) => {
      if (actionId) {
        setWeaponCriticalStates((currentStates) => {
          if (!(actionId in currentStates)) {
            return currentStates;
          }

          const nextStates = { ...currentStates };
          delete nextStates[actionId];
          return nextStates;
        });
      }

      if (
        diceCount <= 1 &&
        criticalThreatRangeStart === undefined &&
        mode === "normal"
      ) {
        handleRoll(label, modifiers);
        return;
      }

      const modifierTotal = modifiers.reduce(
        (sum, modifier) => sum + modifier.value,
        0,
      );
      const baseAttackModifierIndex = modifiers.findIndex((modifier) =>
        /^(BBA|Bono base de ataque)$/i.test(modifier.label),
      );
      const resolvedAttackBonusTotals =
        attackBonusTotals && attackBonusTotals.length === diceCount
          ? attackBonusTotals
          : Array.from({ length: diceCount }, () => modifierTotal);
      const shouldPairRolls = mode !== "normal";
      const attackRolls = shouldPairRolls
        ? Array.from({ length: diceCount }, () => [
            Math.floor(Math.random() * 20) + 1,
            Math.floor(Math.random() * 20) + 1,
          ]).flat()
        : Array.from(
            { length: diceCount },
            () => Math.floor(Math.random() * 20) + 1,
          );
      const selectedRollIndexes = shouldPairRolls
        ? Array.from({ length: diceCount }, (_, attackIndex) => {
            const leftIndex = attackIndex * 2;
            const rightIndex = leftIndex + 1;
            const leftRoll = attackRolls[leftIndex] ?? 0;
            const rightRoll = attackRolls[rightIndex] ?? 0;

            return mode === "advantage"
              ? leftRoll >= rightRoll
                ? leftIndex
                : rightIndex
              : leftRoll <= rightRoll
                ? leftIndex
                : rightIndex;
          })
        : [0];
      const perRollModifierBreakdowns = attackRolls.map((_, index) => {
        const attackIndex = shouldPairRolls ? Math.floor(index / 2) : index;
        const resolvedAttackBonusTotal =
          resolvedAttackBonusTotals[attackIndex] ?? modifierTotal;
        const adjustment = resolvedAttackBonusTotal - modifierTotal;

        if (adjustment === 0) {
          return modifiers.map((modifier) => ({ ...modifier }));
        }

        if (baseAttackModifierIndex >= 0) {
          return modifiers.map((modifier, modifierIndex) =>
            modifierIndex === baseAttackModifierIndex
              ? { ...modifier, value: modifier.value + adjustment }
              : { ...modifier },
          );
        }

        return [
          ...modifiers.map((modifier) => ({ ...modifier })),
          { label: "Ajuste por ataque", value: adjustment },
        ];
      });
      const labelDetails = [
        diceCount > 1 ? `${diceCount} ataques` : null,
        mode === "advantage"
          ? "ventaja"
          : mode === "disadvantage"
            ? "desventaja"
            : null,
      ].filter((detail): detail is string => Boolean(detail));

      setRollLabel(
        labelDetails.length > 0
          ? `${label} (${labelDetails.join(", ")})`
          : label,
      );
      rollDice(20, modifiers, {
        highlightOutcome: criticalThreatRangeStart === undefined,
        presetRolls: attackRolls,
        perRollModifierBreakdowns,
        chipValues: attackRolls.map((roll, index) => {
          const attackIndex = shouldPairRolls ? Math.floor(index / 2) : index;

          return (
            roll + (resolvedAttackBonusTotals[attackIndex] ?? modifierTotal)
          );
        }),
        chipAttackIndexes: shouldPairRolls
          ? Array.from({ length: diceCount }, (_, attackIndex) => [
              attackIndex,
              attackIndex,
            ]).flat()
          : Array.from({ length: diceCount }, (_, attackIndex) => attackIndex),
        criticalThreatRangeStart,
        actionId,
        mode,
        selectedRollIndex: selectedRollIndexes[0] ?? 0,
        selectedRollIndexes: shouldPairRolls ? selectedRollIndexes : undefined,
      });
    },
    [handleRoll, rollDice],
  );

  const handleNamedRollSimple = useCallback(
    (label: string, modifiers: RollModifier[]) => {
      handleNamedRoll(undefined, label, modifiers);
    },
    [handleNamedRoll],
  );

  const handleAttackCriticalStateChange = useCallback(
    (actionId: string, criticalAttackIndexes: number[]) => {
      setWeaponCriticalStates((currentStates) => {
        const normalizedIndexes = [...new Set(criticalAttackIndexes)].sort(
          (left, right) => left - right,
        );

        if (normalizedIndexes.length === 0) {
          if (!(actionId in currentStates)) {
            return currentStates;
          }

          const nextStates = { ...currentStates };
          delete nextStates[actionId];
          return nextStates;
        }

        const previousIndexes = currentStates[actionId] ?? [];
        const isSameState =
          previousIndexes.length === normalizedIndexes.length &&
          previousIndexes.every(
            (value, index) => value === normalizedIndexes[index],
          );

        if (isSameState) {
          return currentStates;
        }

        return {
          ...currentStates,
          [actionId]: normalizedIndexes,
        };
      });
    },
    [],
  );

  const handleResetWeaponCriticalState = useCallback((actionId: string) => {
    setWeaponCriticalStates((currentStates) => {
      if (!(actionId in currentStates)) {
        return currentStates;
      }

      const nextStates = { ...currentStates };
      delete nextStates[actionId];
      return nextStates;
    });
  }, []);

  const handleAbilityRoll = useCallback(
    (label: string, modifier: number) => {
      handleRoll(label, [{ label: "Modificador", value: modifier }]);
    },
    [handleRoll],
  );

  const handleInitiativeRoll = useCallback(
    (modifiers: RollModifier[]) => {
      handleRoll("Iniciativa", modifiers);
    },
    [handleRoll],
  );

  const handleSimpleAttackRoll = useCallback(
    (attackName: string, modifiers: RollModifier[]) => {
      handleNamedRoll(undefined, attackName, modifiers);
    },
    [handleNamedRoll],
  );

  const handleDamageRoll = useCallback(
    (
      attackName: string,
      damageConfig: {
        diceCount: number;
        diceType: number;
        totalBonus: number;
        perDieBonus: number;
        totalModifiers?: RollModifier[];
        perDieModifiers?: RollModifier[];
        baseMultiplier?: number;
        damageGroups?: {
          diceCount: number;
          diceType?: number;
          damageType?: string;
          perDieBonus?: number;
          perDieModifiers?: RollModifier[];
          baseMultiplier?: number;
        }[];
      },
    ) => {
      const {
        diceCount,
        diceType,
        totalBonus,
        perDieBonus,
        totalModifiers = [],
        perDieModifiers = [],
        baseMultiplier = 1,
        damageGroups,
      } = damageConfig;
      const resolvedTotalModifiers =
        totalModifiers.length > 0
          ? totalModifiers
          : totalBonus !== 0
            ? [{ label: "Bono", value: totalBonus }]
            : [];
      const resolvedPerDieModifiers =
        perDieModifiers.length > 0
          ? perDieModifiers
          : perDieBonus !== 0
            ? [{ label: "Bono/dado", value: perDieBonus }]
            : [];

      const resolvedDamageGroups =
        damageGroups && damageGroups.length > 0
          ? damageGroups.map((group, groupIndex) => ({
              diceCount: Math.max(1, group.diceCount),
              diceType: group.diceType ?? diceType,
              damageType: group.damageType,
              perDieBonus: group.perDieBonus ?? 0,
              perDieModifiers:
                group.perDieModifiers && group.perDieModifiers.length > 0
                  ? group.perDieModifiers
                  : (group.perDieBonus ?? 0) !== 0
                    ? [
                        {
                          label: `Bono/dado G${groupIndex + 1}`,
                          value: group.perDieBonus ?? 0,
                        },
                      ]
                    : [],
              baseMultiplier: Math.max(1, group.baseMultiplier ?? 1),
            }))
          : [
              {
                diceCount: Math.max(1, diceCount),
                diceType,
                damageType: undefined,
                perDieBonus: 0,
                perDieModifiers: [],
                baseMultiplier: Math.max(1, baseMultiplier),
              },
            ];

      const groupedBaseRolls = resolvedDamageGroups.map((group) =>
        Array.from(
          { length: group.diceCount },
          () => Math.floor(Math.random() * group.diceType) + 1,
        ),
      );
      const baseRolls = groupedBaseRolls.flat();
      const initialSelectedRollIndex = 0;
      const baseDiceCount = baseRolls.length;
      const remainingBaseRolls =
        baseRolls.reduce((sum, roll) => sum + roll, 0) -
        (baseRolls[initialSelectedRollIndex] ?? 0);
      const criticalExtra = resolvedDamageGroups.reduce(
        (extraTotal, group, index) => {
          if (group.baseMultiplier <= 1) {
            return extraTotal;
          }

          const groupTotal = groupedBaseRolls[index].reduce(
            (sum, roll) => sum + roll,
            0,
          );

          return extraTotal + groupTotal * (group.baseMultiplier - 1);
        },
        0,
      );
      const criticalGroups = resolvedDamageGroups.filter(
        (group) => group.baseMultiplier > 1,
      );
      const flatRollDetails = groupedBaseRolls.flatMap(
        (groupRolls, groupIndex) => {
          const resolvedGroup = resolvedDamageGroups[groupIndex];
          const groupPerDieBonus = resolvedGroup?.perDieBonus ?? 0;
          const groupPerDieModifiers = resolvedGroup?.perDieModifiers ?? [];
          const groupMultiplier = Math.max(
            1,
            resolvedGroup?.baseMultiplier ?? 1,
          );

          return groupRolls.map((roll) => ({
            roll,
            diceType: resolvedGroup?.diceType ?? diceType,
            groupIndex,
            groupPerDieBonus,
            groupPerDieModifiers,
            groupMultiplier,
          }));
        },
      );
      const chipMetadata = groupedBaseRolls.flatMap(
        (groupRolls, groupIndex) => {
          const groupPerDieBonus =
            resolvedDamageGroups[groupIndex]?.perDieBonus ?? 0;
          const groupMultiplier = Math.max(
            1,
            resolvedDamageGroups[groupIndex]?.baseMultiplier ?? 1,
          );
          const isCriticalGroup = groupMultiplier > 1;
          const chipLabel = `d${resolvedDamageGroups[groupIndex]?.diceType ?? diceType}`;

          return groupRolls.map((roll) => ({
            value: roll * groupMultiplier + perDieBonus + groupPerDieBonus,
            label: chipLabel,
            tone: isCriticalGroup
              ? ("critical" as const)
              : ("default" as const),
          }));
        },
      );
      const perDieModifierTotals = resolvedPerDieModifiers.map((modifier) => ({
        label: modifier.label,
        value: modifier.value * baseDiceCount,
      }));
      const groupPerDieModifierTotals = resolvedDamageGroups.flatMap((group) =>
        (group.perDieModifiers ?? []).map((modifier) => ({
          label: modifier.label,
          value: modifier.value * group.diceCount,
        })),
      );
      const expression = resolvedDamageGroups
        .map((group) => `${group.diceCount}d${group.diceType}`)
        .join(" + ");
      const hasCriticalGroups = criticalGroups.length > 0;
      const hasUniformDiceType = resolvedDamageGroups.every(
        (group) => group.diceType === resolvedDamageGroups[0]?.diceType,
      );
      const isUniformCritical =
        hasCriticalGroups &&
        criticalGroups.length === resolvedDamageGroups.length &&
        criticalGroups.every(
          (group) => group.baseMultiplier === criticalGroups[0]?.baseMultiplier,
        );
      const criticalLabel = isUniformCritical
        ? `Critico x${criticalGroups[0]?.baseMultiplier ?? 2}`
        : "Critico parcial";

      setRollLabel(
        `${attackName} Dano (${expression}${hasCriticalGroups ? `, ${isUniformCritical ? `crit x${criticalGroups[0]?.baseMultiplier ?? 2}` : "crit parcial"}` : ""})`,
      );

      const modifiers = [
        ...(remainingBaseRolls !== 0
          ? [
              {
                label: hasUniformDiceType
                  ? `${baseDiceCount - 1}d${resolvedDamageGroups[0]?.diceType ?? diceType}`
                  : "Dados restantes",
                value: remainingBaseRolls,
              },
            ]
          : []),
        ...(criticalExtra !== 0
          ? [{ label: criticalLabel, value: criticalExtra }]
          : []),
        ...perDieModifierTotals,
        ...groupPerDieModifierTotals,
        ...resolvedTotalModifiers,
      ];
      const perRollModifierBreakdowns = flatRollDetails.map((rollDetail) => {
        return [
          ...(rollDetail.groupMultiplier > 1
            ? [
                {
                  label: `Critico x${rollDetail.groupMultiplier}`,
                  value: rollDetail.roll * (rollDetail.groupMultiplier - 1),
                },
              ]
            : []),
          ...resolvedPerDieModifiers,
          ...rollDetail.groupPerDieModifiers,
          ...resolvedTotalModifiers,
        ];
      });

      rollDice(diceType, modifiers, {
        highlightOutcome: false,
        presetRolls: baseRolls,
        showAggregateTotal: true,
        aggregateTotalModifiers: resolvedTotalModifiers,
        perRollModifierBreakdowns,
        chipValues:
          perDieBonus !== 0 ||
          resolvedPerDieModifiers.length > 0 ||
          groupPerDieModifierTotals.length > 0 ||
          hasCriticalGroups
            ? chipMetadata.map((chip) => chip.value)
            : undefined,
        chipLabels: chipMetadata.map((chip) => chip.label),
        chipTones: hasCriticalGroups
          ? chipMetadata.map((chip) => chip.tone)
          : undefined,
        selectedRollIndex: initialSelectedRollIndex,
      });
    },
    [rollDice],
  );

  const handleExport = () => {
    const dataStr = JSON.stringify(character, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${character.name || "personaje"}-dnd35.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        setCharacter(
          sanitizeCharacterData({ ...DEFAULT_CHARACTER, ...parsed }),
        );
      } catch {
        alert("No se pudo interpretar el archivo del personaje");
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (
      confirm(
        "¿Seguro que quieres reiniciar la hoja de personaje? Esta accion no se puede deshacer.",
      )
    ) {
      setCharacter(DEFAULT_CHARACTER);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-5 md:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-24 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -right-20 top-32 h-72 w-72 rounded-full bg-blood-red/10 blur-3xl" />
        <div className="absolute bottom-12 left-1/3 h-56 w-56 rounded-full bg-parchment/6 blur-3xl" />
      </div>

      <div className="relative z-10">
        <Header
          saveStatus={saveStatus}
          onExport={handleExport}
          onImport={handleImport}
          onReset={handleReset}
        />

        <main className="max-w-7xl mx-auto">
          <div>
            <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]">
              <PanelSection
                eyebrow="Hoja principal"
                title="Identidad, combate y equipo"
                caption="Datos base del personaje"
              >
                <BasicInfo
                  character={character}
                  onChange={handleChange}
                  isOpen={visibleSections.basicInfo}
                  onToggle={() => toggleSection("basicInfo")}
                />

                <AbilityScores
                  character={character}
                  equipmentBonuses={equipmentBonuses}
                  onChange={handleChange}
                  onRollAbility={handleAbilityRoll}
                  onRollInitiative={handleInitiativeRoll}
                  onRollAttack={handleSimpleAttackRoll}
                  isOpen={visibleSections.abilities}
                  onToggle={() => toggleSection("abilities")}
                />

                <SavingThrows
                  character={character}
                  equipmentBonuses={equipmentBonuses}
                  onChange={handleChange}
                  onRollSave={handleNamedRollSimple}
                  isOpen={visibleSections.saves}
                  onToggle={() => toggleSection("saves")}
                />

                <EquippedGear
                  character={character}
                  onChange={handleChange}
                  isOpen={visibleSections.equippedGear}
                  onToggle={() => toggleSection("equippedGear")}
                />

                <Attacks
                  character={character}
                  onChange={handleChange}
                  onRollAttack={handleNamedRoll}
                  onRollDamage={handleDamageRoll}
                  weaponCriticalStates={weaponCriticalStates}
                  onResetWeaponCriticalState={handleResetWeaponCriticalState}
                  isOpen={visibleSections.attacks}
                  onToggle={() => toggleSection("attacks")}
                />
              </PanelSection>

              <PanelSection
                eyebrow="Apoyo de partida"
                title="Tiradas, inventario, habilidades y dotes"
                caption="Utilidades de sesion"
                sticky
              >
                <DiceRoller
                  onRoll={handleRoll}
                  isOpen={visibleSections.dice}
                  onToggle={() => toggleSection("dice")}
                />

                <Skills
                  character={character}
                  equipmentBonuses={equipmentBonuses}
                  onChange={handleChange}
                  onRollSkill={handleNamedRollSimple}
                  isOpen={visibleSections.skills}
                  onToggle={() => toggleSection("skills")}
                />

                <Feats
                  character={character}
                  equipmentBonuses={equipmentBonuses}
                  onChange={handleChange}
                  isOpen={visibleSections.feats}
                  onToggle={() => toggleSection("feats")}
                />

                <Equipment
                  character={character}
                  onChange={handleChange}
                  isOpen={visibleSections.equipment}
                  onToggle={() => toggleSection("equipment")}
                />
              </PanelSection>
            </div>
          </div>
        </main>

        <Footer />
      </div>

      {/* Dice Roll Modal */}
      <DiceRollModal
        isRolling={isRolling}
        result={result}
        showResult={showResult}
        onClose={closeResult}
        rollLabel={rollLabel}
        onAttackCriticalStateChange={handleAttackCriticalStateChange}
      />
    </div>
  );
}
