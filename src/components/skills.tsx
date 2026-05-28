import { DiceButton } from "./diceButton";
import { FormCheckbox } from "@/components/formCheckbox";
import { FormNumberInput } from "@/components/formNumberInput";
import { Popover } from "./popover";
import { SectionShell } from "./sectionShell";
import {
  formatModifier,
  getCharacterAbilityModifier,
  type AbilityScoreField,
  type CharacterData,
  type Skill,
} from "@/lib/character-types";
import type { EquipmentBonuses } from "@/lib/equipment-effects";

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
  equipmentBonuses: EquipmentBonuses;
  onChange: (updates: Partial<CharacterData>) => void;
  onRollSkill: (
    skillName: string,
    modifiers: { label: string; value: number }[],
  ) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

const ABILITY_KEYS: Record<string, AbilityScoreField> = {
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
  equipmentBonuses,
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
          <FormNumberInput
            value={character.skillPointsToInvest}
            onChange={handleSkillPointsToInvestChange}
            className="w-full"
            inputClassName="border border-border bg-input px-3 py-2"
            min={spentSkillPoints}
            ariaLabel="Puntos a invertir"
          />
        </label>

        <label className="space-y-2">
          <span className="block text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Maximo por rango
          </span>
          <FormNumberInput
            value={character.maxSkillRank}
            onChange={handleMaxSkillRankChange}
            className="w-full"
            inputClassName="border border-border bg-input px-3 py-2"
            min={highestAssignedRank}
            ariaLabel="Maximo por rango"
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
            const abilityMod = getCharacterAbilityModifier(
              character,
              abilityKey,
              equipmentBonuses.abilityBonuses[abilityKey] ?? 0,
            );
            const equipmentSkillBonus =
              equipmentBonuses.skillBonuses[skill.name] ?? 0;
            const total =
              skill.ranks + abilityMod + skill.miscMod + equipmentSkillBonus;
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
              ...(equipmentSkillBonus !== 0
                ? [{ label: "Equipo", value: equipmentSkillBonus }]
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
                  <Popover
                    content={<div>{skill.name}</div>}
                    side="top"
                    align="start"
                    anchorClassName="min-w-0"
                  >
                    <div className="min-w-0">
                      <span className="text-sm truncate block">
                        {skill.name}
                      </span>
                      {equipmentSkillBonus !== 0 ? (
                        <span className="text-[10px] uppercase tracking-[0.14em] text-gold/75">
                          Equipo {formatModifier(equipmentSkillBonus)}
                        </span>
                      ) : null}
                    </div>
                  </Popover>
                </div>

                <span className="text-xs text-center w-10 text-muted-foreground">
                  {skill.ability}
                </span>

                <span className="text-center w-12 font-bold text-gold">
                  {formatModifier(total)}
                </span>

                <FormNumberInput
                  value={skill.ranks}
                  onChange={(value) => updateSkillRanks(index, value)}
                  className="w-12"
                  inputClassName="rounded bg-input py-0.5 text-center text-sm"
                  min={0}
                  max={maxAllowedRanks}
                  title={`Cada rango cuesta ${pointCost} punto${pointCost > 1 ? "s" : ""}`}
                  ariaLabel={`Rangos de ${skill.name}`}
                  compact
                />

                <FormNumberInput
                  value={skill.miscMod}
                  onChange={(value) =>
                    updateSkill(index, {
                      miscMod: parseInt(value, 10) || 0,
                    })
                  }
                  className="w-12"
                  inputClassName="rounded bg-input py-0.5 text-center text-sm"
                  ariaLabel={`Modificador varios de ${skill.name}`}
                  compact
                />

                <div className="flex justify-center w-8">
                  <FormCheckbox
                    checked={skill.classSkill}
                    onChange={(checked: boolean) =>
                      updateSkill(index, { classSkill: checked })
                    }
                    ariaLabel={`Marcar ${skill.name} como habilidad de clase`}
                  />
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
