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

/**
 * Muestra la tabla completa de habilidades con sus rangos, modificadores y
 * tiradas individuales.
 */
export function Skills({
  character,
  onChange,
  onRollSkill,
  isOpen,
  onToggle,
}: SkillsProps) {
  const updateSkill = (index: number, updates: Partial<Skill>) => {
    const newSkills = [...character.skills];
    newSkills[index] = { ...newSkills[index], ...updates };
    onChange({ skills: newSkills });
  };

  return (
    <SectionShell title="HABILIDADES" isOpen={isOpen} onToggle={onToggle}>
      {/* Header */}
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
          const classBonus = skill.classSkill && skill.ranks > 0 ? 3 : 0;
          const total = skill.ranks + abilityMod + skill.miscMod + classBonus;

          const modifiers = [
            { label: skill.ability, value: abilityMod },
            ...(skill.ranks > 0
              ? [{ label: "Rangos", value: skill.ranks }]
              : []),
            ...(classBonus > 0 ? [{ label: "Clase", value: classBonus }] : []),
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
              {/* Dice Button */}
              <DiceButton onClick={() => onRollSkill(skill.name, modifiers)} />

              {/* Skill Name */}
              <span className="text-sm truncate" title={skill.name}>
                {skill.name}
              </span>

              {/* Key Ability */}
              <span className="text-xs text-center w-10 text-muted-foreground">
                {skill.ability}
              </span>

              {/* Total */}
              <span className="text-center w-12 font-bold text-gold">
                {formatModifier(total)}
              </span>

              {/* Ranks */}
              <input
                type="number"
                value={skill.ranks}
                onChange={(e) =>
                  updateSkill(index, {
                    ranks: Math.max(0, parseInt(e.target.value) || 0),
                  })
                }
                className="w-10 text-center text-sm rounded bg-input border border-border py-0.5"
                min={0}
              />

              {/* Misc Mod */}
              <input
                type="number"
                value={skill.miscMod}
                onChange={(e) =>
                  updateSkill(index, { miscMod: parseInt(e.target.value) || 0 })
                }
                className="w-10 text-center text-sm rounded bg-input border border-border py-0.5"
              />

              {/* Class Skill */}
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
