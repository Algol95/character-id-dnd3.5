import { DiceButton } from "./diceButton";
import { SectionShell } from "./sectionShell";
import {
  formatModifier,
  getAbilityModifier,
  type CharacterData,
  type Skill,
} from "@/lib/character-types";

/**
 * Propiedades de la seccion de habilidades.
 * @param character - Datos completos del personaje.
 * @param onChange - Funcion para actualizar los datos del personaje.
 * @param onRollSkill - Funcion para manejar el lanzamiento de una tirada de habilidad.
 * @param isOpen - Indica si la seccion esta expandida o colapsada.
 * @param onToggle - Funcion para alternar el estado de expansion de la seccion.
 * @return Un componente que muestra la tabla de habilidades del personaje, permite editar rangos, modificadores y marcar como clase, ademas de controlar los puntos disponibles para invertir en habilidades.
 */
interface SkillsProps {
  character: CharacterData;
  onChange: (updates: Partial<CharacterData>) => void;
  onRollSkill: (
    skillName: string,
    modifiers: { label: string; value: number }[],
  ) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

const ABILITY_KEYS: Record<string, keyof CharacterData> = {
  STR: "strength",
  DEX: "dexterity",
  CON: "constitution",
  INT: "intelligence",
  WIS: "wisdom",
  CHA: "charisma",
};

const UNTRAINED_SKILL_NAMES = new Set([
  "Artesania",
  "Averiguar intenciones",
  "Avistar",
  "Buscar",
  "Concentracion",
  "Diplomacia",
  "Disfrazarse",
  "Enganar",
  "Equilibrio",
  "Escapismo",
  "Esconderse",
  "Escuchar",
  "Falsificacion",
  "Interpretacion",
  "Intimidar",
  "Montar",
  "Nadar",
  "Reunir informacion",
  "Saltar",
  "Sanar",
  "Supervivencia",
  "Tasacion",
  "Uso de cuerdas",
]);

function getSkillPointCost(classSkill: boolean) {
  return classSkill ? 1 : 2;
}

/**
 * Muestra la tabla completa de habilidades con sus rangos, modificadores y
 * tiradas individuales.
 * Permite editar rangos, modificadores varios, marcar como clase y ajustar
 * puntos a invertir y maximo por rango. Controla que no se asignen mas rangos  de los disponibles segun los puntos a invertir y el coste de cada habilidad.
 */
export function Skills({
  character,
  onChange,
  onRollSkill,
  isOpen,
  onToggle,
}: SkillsProps) {
  const spentSkillPoints = character.skills.reduce(
    (total, skill) => total + skill.ranks * getSkillPointCost(skill.classSkill),
    0,
  );
  const remainingSkillPoints = Math.max(
    0,
    character.skillPointsToInvest - spentSkillPoints,
  );
  const highestAssignedRank = character.skills.reduce(
    (highest, skill) => Math.max(highest, skill.ranks),
    0,
  );

  const updateSkill = (index: number, updates: Partial<Skill>) => {
    const newSkills = [...character.skills];
    newSkills[index] = { ...newSkills[index], ...updates };
    onChange({ skills: newSkills });
  };

  const updateSkillRanks = (index: number, nextValue: string) => {
    const parsedRanks = Math.max(0, Number.parseInt(nextValue, 10) || 0);
    const currentSkill = character.skills[index];
    const currentRanks = currentSkill.ranks;
    const pointCost = getSkillPointCost(currentSkill.classSkill);
    const maxAllowedRanks = Math.min(
      character.maxSkillRank,
      currentRanks + Math.floor(remainingSkillPoints / pointCost),
    );

    updateSkill(index, {
      ranks: Math.min(parsedRanks, maxAllowedRanks),
    });
  };

  const handleSkillPointsToInvestChange = (nextValue: string) => {
    const parsedValue = Math.max(0, Number.parseInt(nextValue, 10) || 0);

    onChange({
      skillPointsToInvest: Math.max(parsedValue, spentSkillPoints),
    });
  };

  const handleMaxSkillRankChange = (nextValue: string) => {
    const parsedValue = Math.max(0, Number.parseInt(nextValue, 10) || 0);

    onChange({
      maxSkillRank: Math.max(parsedValue, highestAssignedRank),
    });
  };

  return (
    <SectionShell title="HABILIDADES" isOpen={isOpen} onToggle={onToggle}>
      <div className="mb-4 grid gap-3 rounded-2xl border border-border/70 bg-secondary/20 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
        <label className="space-y-2">
          <span className="block text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Puntos a invertir
          </span>
          <input
            type="number"
            value={character.skillPointsToInvest}
            onChange={(e) => handleSkillPointsToInvestChange(e.target.value)}
            className="w-full rounded border border-border bg-input px-3 py-2 text-sm"
            min={spentSkillPoints}
          />
        </label>

        <label className="space-y-2">
          <span className="block text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Maximo por rango
          </span>
          <input
            type="number"
            value={character.maxSkillRank}
            onChange={(e) => handleMaxSkillRankChange(e.target.value)}
            className="w-full rounded border border-border bg-input px-3 py-2 text-sm"
            min={highestAssignedRank}
          />
        </label>

        <div className="rounded-xl border border-gold/25 bg-gold/10 px-4 py-2 text-center md:min-w-32">
          <div className="text-[11px] uppercase tracking-[0.2em] text-gold/80">
            Restantes
          </div>
          <div className="mt-1 text-2xl font-bold text-gold">
            {remainingSkillPoints}
          </div>
        </div>
      </div>

      <div className="max-h-125 overflow-y-auto pr-1">
        <div className="gold-border parchment-bg sticky top-0 z-10 mb-3 grid grid-cols-[1.75rem_minmax(0,1fr)_3.5rem_3.25rem_3.5rem_3.5rem_2.75rem] items-center gap-2 rounded-xl px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-gold/70 shadow-[0_10px_16px_rgba(12,8,4,0.16)]">
          <div></div>
          <div className="whitespace-nowrap">Nombre</div>
          <div className="text-center whitespace-nowrap">Clave</div>
          <div className="text-center whitespace-nowrap">Total</div>
          <div className="text-center whitespace-nowrap">Rangos</div>
          <div className="text-center whitespace-nowrap">Varios</div>
          <div className="text-center whitespace-nowrap">Clase</div>
        </div>

        <div className="space-y-1">
          {character.skills.map((skill, index) => {
            const abilityKey = ABILITY_KEYS[skill.ability];
            const abilityMod = getAbilityModifier(
              character[abilityKey] as number,
            );
            const total = skill.ranks + abilityMod + skill.miscMod;
            const isUsableUntrained = UNTRAINED_SKILL_NAMES.has(skill.name);
            const pointCost = getSkillPointCost(skill.classSkill);
            const maxAllowedRanks = Math.min(
              character.maxSkillRank,
              skill.ranks + Math.floor(remainingSkillPoints / pointCost),
            );

            const modifiers = [
              { label: skill.ability, value: abilityMod },
              ...(skill.ranks > 0
                ? [{ label: "Rangos", value: skill.ranks }]
                : []),
              ...(skill.miscMod !== 0
                ? [{ label: "Varios", value: skill.miscMod }]
                : []),
            ];

            return (
              <div
                key={skill.name}
                className="grid grid-cols-[1.75rem_minmax(0,1fr)_3.5rem_3.25rem_3.5rem_3.5rem_2.75rem] items-center gap-2 rounded px-1 py-1 transition-colors group hover:bg-secondary/30"
              >
                <DiceButton
                  onClick={() => onRollSkill(skill.name, modifiers)}
                />

                <div className="flex min-w-0 items-center gap-2">
                  {isUsableUntrained ? (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full bg-gold shadow-[0_0_10px_rgba(212,175,55,0.45)]"
                      title="Se puede usar sin entrenamiento"
                      aria-label="Se puede usar sin entrenamiento"
                    />
                  ) : null}
                  <span className="text-sm truncate" title={skill.name}>
                    {skill.name}
                  </span>
                </div>

                <span className="text-xs text-center w-10 text-muted-foreground">
                  {skill.ability}
                </span>

                <span className="text-center w-12 font-bold text-gold">
                  {formatModifier(total)}
                </span>

                <input
                  type="number"
                  value={skill.ranks}
                  onChange={(e) => updateSkillRanks(index, e.target.value)}
                  className="w-10 text-center text-sm rounded bg-input border border-border py-0.5"
                  min={0}
                  max={maxAllowedRanks}
                  title={`Cada rango cuesta ${pointCost} punto${pointCost > 1 ? "s" : ""}`}
                />

                <input
                  type="number"
                  value={skill.miscMod}
                  onChange={(e) =>
                    updateSkill(index, {
                      miscMod: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-10 text-center text-sm rounded bg-input border border-border py-0.5"
                />

                <div className="flex justify-center w-8">
                  <label className="relative inline-flex cursor-pointer items-center justify-center">
                    <input
                      type="checkbox"
                      checked={skill.classSkill}
                      onChange={(e) =>
                        updateSkill(index, { classSkill: e.target.checked })
                      }
                      className="peer sr-only"
                      aria-label={`Marcar ${skill.name} como habilidad de clase`}
                    />
                    <span className="flex h-5 w-5 items-center justify-center rounded-md border border-border/80 bg-input/90 text-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-200 peer-checked:border-gold/60 peer-checked:bg-gold/15 peer-checked:text-gold peer-checked:shadow-[0_0_12px_rgba(212,175,55,0.18)] peer-focus-visible:ring-2 peer-focus-visible:ring-gold/60 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background group-hover:border-gold/30">
                      <svg
                        viewBox="0 0 16 16"
                        aria-hidden="true"
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                      >
                        <path
                          d="M3.5 8.5 6.5 11.5 12.5 4.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 border-t border-border/70 pt-3">
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className="h-2 w-2 shrink-0 rounded-full bg-gold shadow-[0_0_10px_rgba(212,175,55,0.45)]"
            aria-hidden="true"
          />
          Las habilidades con este símbolo pueden usarlas todos los personajes.
        </span>
      </div>
    </SectionShell>
  );
}
