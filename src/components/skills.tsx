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

      <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-1 text-xs text-muted-foreground mb-2 px-1">
        <div></div>
        <div>Nombre</div>
        <div className="text-center w-10">Clave</div>
        <div className="text-center w-12">Total</div>
        <div className="text-center w-10">Rangos</div>
        <div className="text-center w-10">Varios</div>
        <div className="text-center w-8">Clase</div>
      </div>

      <div className="space-y-1 max-h-125 overflow-y-auto pr-1">
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
              className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-1 items-center 
                py-1 px-1 rounded hover:bg-secondary/30 transition-colors group"
            >
              <DiceButton onClick={() => onRollSkill(skill.name, modifiers)} />

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
                  updateSkill(index, { miscMod: parseInt(e.target.value) || 0 })
                }
                className="w-10 text-center text-sm rounded bg-input border border-border py-0.5"
              />

              <div className="flex justify-center w-8">
                <input
                  type="checkbox"
                  checked={skill.classSkill}
                  onChange={(e) =>
                    updateSkill(index, { classSkill: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-border bg-input accent-gold cursor-pointer"
                />
              </div>
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}
