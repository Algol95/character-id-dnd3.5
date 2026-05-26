import {
  useState,
  useEffect,
  useCallback,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useDiceRoller, type DiceRollMode } from "@/hooks/use-dice-roller";
import { DiceRollModal } from "./diceRollModal";
import { BasicInfo } from "./basicInfo";
import { AbilityScores } from "./abilityScores";
import { SavingThrows } from "./savingThrows";
import { Combat } from "./combat";
import { Attacks } from "./attacks";
import { Skills } from "./skills";
import { Equipment } from "./equipment";
import { Feats } from "./feats";
import { DiceRoller } from "./diceRoller";
import { Header } from "./header";
import { Footer } from "./footer";
import { DEFAULT_CHARACTER, type CharacterData } from "@/lib/character-types";

const STORAGE_KEY = "dnd35-character-sheet";
const SECTION_VISIBILITY_KEY = "dnd35-section-visibility";

type SaveStatus = "saved" | "saving" | "error";
type RollModifier = { label: string; value: number };

type SectionKey =
  | "basicInfo"
  | "abilities"
  | "saves"
  | "combat"
  | "attacks"
  | "equipment"
  | "dice"
  | "skills"
  | "feats";

const DEFAULT_SECTION_VISIBILITY: Record<SectionKey, boolean> = {
  basicInfo: true,
  abilities: true,
  saves: true,
  combat: true,
  attacks: true,
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
    readStoredState(
      STORAGE_KEY,
      DEFAULT_CHARACTER,
      "[v0] Failed to load character:",
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
    setCharacter((prev) => ({ ...prev, ...updates }));
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
    (label: string, modifiers: RollModifier[]) => {
      handleRoll(label, modifiers);
    },
    [handleRoll],
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
    (attackName: string, damageString: string) => {
      const parsedDamageRoll = parseDamageRoll(damageString);

      if (!parsedDamageRoll) {
        setRollLabel(`${attackName} Dano`);
        rollDice(6, []);
        return;
      }

      const { numDice, diceType, modifier } = parsedDamageRoll;

      let total = 0;
      for (let i = 0; i < numDice; i++) {
        const roll = Math.floor(Math.random() * diceType) + 1;
        total += roll;
      }

      setRollLabel(`${attackName} Dano (${damageString})`);

      const modifiers = [
        { label: `${numDice}d${diceType}`, value: total },
        ...(modifier !== 0 ? [{ label: "Mod.", value: modifier }] : []),
      ];

      rollDice(
        1,
        modifiers.map((m, i) => (i === 0 ? { ...m, value: m.value - 1 } : m)),
        { highlightOutcome: false },
      );
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
        setCharacter({ ...DEFAULT_CHARACTER, ...parsed });
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
                  onChange={handleChange}
                  onRollAbility={handleAbilityRoll}
                  isOpen={visibleSections.abilities}
                  onToggle={() => toggleSection("abilities")}
                />

                <SavingThrows
                  character={character}
                  onChange={handleChange}
                  onRollSave={handleNamedRoll}
                  isOpen={visibleSections.saves}
                  onToggle={() => toggleSection("saves")}
                />

                <Combat
                  character={character}
                  onChange={handleChange}
                  onRollInitiative={handleInitiativeRoll}
                  onRollAttack={handleNamedRoll}
                  isOpen={visibleSections.combat}
                  onToggle={() => toggleSection("combat")}
                />

                <Attacks
                  character={character}
                  onChange={handleChange}
                  onRollAttack={handleNamedRoll}
                  onRollDamage={handleDamageRoll}
                  isOpen={visibleSections.attacks}
                  onToggle={() => toggleSection("attacks")}
                />

                <Equipment
                  character={character}
                  onChange={handleChange}
                  isOpen={visibleSections.equipment}
                  onToggle={() => toggleSection("equipment")}
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
                  onChange={handleChange}
                  onRollSkill={handleNamedRoll}
                  isOpen={visibleSections.skills}
                  onToggle={() => toggleSection("skills")}
                />

                <Feats
                  character={character}
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
