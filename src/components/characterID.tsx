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
  formatModifier,
  type Attack,
  type CharacterData,
  type EquippedItem,
  type WeaponProfile,
} from "@/lib/character-types";
import { computeEquipmentBonuses } from "@/lib/equipment-effects";

const STORAGE_KEY = "dnd35-character-sheet";
const SECTION_VISIBILITY_KEY = "dnd35-section-visibility";

type SaveStatus = "saved" | "saving" | "error";
type RollModifier = { label: string; value: number };

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
        ? {
            damageDiceCount:
              parseDamageRoll(legacySpellExpression)?.numDice ?? 1,
            damageDiceType:
              parseDamageRoll(legacySpellExpression)?.diceType ?? 6,
            effectModifiers: storedAttack.spellConfig.effectModifiers ?? [],
          }
        : {
            damageDiceCount: Math.max(
              1,
              storedAttack.spellConfig.damageDiceCount ?? 1,
            ),
            damageDiceType: storedAttack.spellConfig.damageDiceType ?? 6,
            effectModifiers: storedAttack.spellConfig.effectModifiers ?? [],
          }
      : undefined;

    return {
      ...storedAttack,
      id: storedAttack.id || createBattleActionId(),
      weaponConfig: storedAttack.weaponConfig
        ? {
            ...storedAttack.weaponConfig,
            extraDamageDiceCount:
              Math.max(0, storedAttack.weaponConfig.extraDamageDiceCount ?? 0),
          }
        : undefined,
      spellConfig: normalizedSpellConfig,
    };
  }

  return migrateLegacyAttack(storedAttack);
}

function normalizeStoredEquippedItem(item: StoredEquippedItem): EquippedItem {
  const shouldTreatAsWeapon =
    Boolean(item.weaponProfile) || item.category === "weapon" || item.slot === "ranged";
  const legacyWeaponProfile = item.weaponProfile ??
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
          damageDiceCount: Math.max(1, legacyWeaponProfile?.damageDiceCount ?? 1),
          damageDiceType: normalizedDamageDiceType,
          criticalRangeStart: Math.min(
            20,
            Math.max(1, legacyWeaponProfile?.criticalRangeStart ?? 20),
          ),
          criticalMultiplier: Math.max(2, legacyWeaponProfile?.criticalMultiplier ?? 2),
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
    (label: string, modifiers: RollModifier[], diceCount = 1) => {
      if (diceCount <= 1) {
        handleRoll(label, modifiers);
        return;
      }

      const attackRolls = Array.from(
        { length: diceCount },
        () => Math.floor(Math.random() * 20) + 1,
      );

      setRollLabel(`${label} (${diceCount} ataques)`);
      rollDice(20, modifiers, {
        highlightOutcome: false,
        presetRolls: attackRolls,
        selectedRollIndex: 0,
      });
    },
    [handleRoll, rollDice],
  );

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

  const handleDamageRoll = useCallback(
    (
      attackName: string,
      damageConfig: {
        diceCount: number;
        diceType: number;
        totalBonus: number;
        perDieBonus: number;
        baseMultiplier?: number;
      },
    ) => {
      const {
        diceCount,
        diceType,
        totalBonus,
        perDieBonus,
        baseMultiplier = 1,
      } = damageConfig;

      const baseRolls = Array.from(
        { length: diceCount },
        () => Math.floor(Math.random() * diceType) + 1,
      );
      const selectedRollIndex = 0;
      const baseTotal = baseRolls.reduce((sum, roll) => sum + roll, 0);
      const remainingBaseRolls =
        baseTotal - (baseRolls[selectedRollIndex] ?? 0);
      const criticalExtra =
        baseMultiplier > 1 ? baseTotal * (baseMultiplier - 1) : 0;
      const perDieExtra = perDieBonus * diceCount;
      const expression = `${diceCount}d${diceType}`;

      setRollLabel(
        `${attackName} Dano (${expression}${baseMultiplier > 1 ? `, crit x${baseMultiplier}` : ""})`,
      );

      const modifiers = [
        ...(remainingBaseRolls !== 0
          ? [
              {
                label: `${diceCount - 1}d${diceType}`,
                value: remainingBaseRolls,
              },
            ]
          : []),
        ...(criticalExtra !== 0
          ? [{ label: `Critico x${baseMultiplier}`, value: criticalExtra }]
          : []),
        ...(perDieExtra !== 0
          ? [
              {
                label: `${formatModifier(perDieBonus)} por dado`,
                value: perDieExtra,
              },
            ]
          : []),
        ...(totalBonus !== 0
          ? [{ label: "Bono total", value: totalBonus }]
          : []),
      ];

      rollDice(diceType, modifiers, {
        highlightOutcome: false,
        presetRolls: baseRolls,
        selectedRollIndex,
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
                  isOpen={visibleSections.abilities}
                  onToggle={() => toggleSection("abilities")}
                />

                <SavingThrows
                  character={character}
                  equipmentBonuses={equipmentBonuses}
                  onChange={handleChange}
                  onRollSave={handleNamedRoll}
                  isOpen={visibleSections.saves}
                  onToggle={() => toggleSection("saves")}
                />

                <EquippedGear
                  character={character}
                  onChange={handleChange}
                  isOpen={visibleSections.equippedGear}
                  onToggle={() => toggleSection("equippedGear")}
                />

                <Equipment
                  character={character}
                  onChange={handleChange}
                  isOpen={visibleSections.equipment}
                  onToggle={() => toggleSection("equipment")}
                />

                <Attacks
                  character={character}
                  onChange={handleChange}
                  onRollAttack={handleNamedRoll}
                  onRollDamage={handleDamageRoll}
                  isOpen={visibleSections.attacks}
                  onToggle={() => toggleSection("attacks")}
                />
              </PanelSection>

              <PanelSection
                eyebrow="Apoyo de partida"
                title="Tiradas, habilidades y dotes"
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
                  onRollSkill={handleNamedRoll}
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
      />
    </div>
  );
}
