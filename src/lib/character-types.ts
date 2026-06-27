export interface Skill {
  name: string;
  ability: "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";
  ranks: number;
  miscMod: number;
  classSkill: boolean;
}

export interface Money {
  platinum: number;
  gold: number;
  silver: number;
  copper: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  weight: number;
}

export interface DailySpellEntry {
  id: string;
  name: string;
  totalUses: number;
  remainingUses: number;
}

export interface SpellLevelData {
  level: number;
  knownSpells: number;
  saveDC: number;
  dailySpells: number;
  additionalSpells: number;
  dailyEntries: DailySpellEntry[];
}

export interface SpellcastingData {
  specializations: string;
  conditionalModifiers: string;
  arcaneFailureChance: number;
  spellLevels: SpellLevelData[];
}

export interface CarryingCapacity {
  lightLoad: number;
  mediumLoad: number;
  heavyLoad: number;
  liftOverHead: number;
  liftOffGround: number;
  pushOrDrag: number;
}

export type AbilityScoreField =
  | "strength"
  | "dexterity"
  | "constitution"
  | "intelligence"
  | "wisdom"
  | "charisma";

export type EquipmentSlot =
  | "head"
  | "eyes"
  | "throat"
  | "shoulders"
  | "torso"
  | "body"
  | "arms"
  | "hands"
  | "waist"
  | "feet"
  | "ringLeft"
  | "ringRight"
  | "armor"
  | "shield"
  | "mainHand"
  | "offHand"
  | "ranged"
  | "ammunition";

export type EquippedItemCategory =
  | "armor"
  | "shield"
  | "weapon"
  | "accessory"
  | "wondrous";

export type EquipmentEffectTarget =
  | AbilityScoreField
  | "initiative"
  | "armorClass"
  | "touchAC"
  | "flatFootedAC"
  | "fortitude"
  | "reflex"
  | "will"
  | "speed"
  | "skill"
  | "specialAbility";

export interface EquippedItemEffect {
  id: string;
  target: EquipmentEffectTarget;
  value: number;
  skillName?: string;
  description: string;
}

export interface WeaponProfile {
  damageDiceCount: number;
  damageDiceType: number;
  criticalRangeStart: number;
  criticalMultiplier: number;
}

export const DAMAGE_TYPE_OPTIONS = [
  { value: "bludgeoning", label: "Contundente" },
  { value: "slashing", label: "Cortante" },
  { value: "piercing", label: "Perforante" },
  { value: "acid", label: "Acido" },
  { value: "cold", label: "Frio" },
  { value: "electricity", label: "Electricidad" },
  { value: "fire", label: "Fuego" },
  { value: "sonic", label: "Sonico" },
  { value: "force", label: "Fuerza" },
  { value: "positive", label: "Energia positiva" },
  { value: "negative", label: "Energia negativa" },
  { value: "sacred", label: "Sagrado" },
  { value: "profane", label: "Profano" },
  { value: "divine", label: "Divino" },
  { value: "necrotic", label: "Necrotico" },
] as const;

export type DamageType = (typeof DAMAGE_TYPE_OPTIONS)[number]["value"];

export const DAMAGE_TYPE_LABELS: Record<DamageType, string> = {
  bludgeoning: "Contundente",
  slashing: "Cortante",
  piercing: "Perforante",
  acid: "Acido",
  cold: "Frio",
  electricity: "Electricidad",
  fire: "Fuego",
  sonic: "Sonico",
  force: "Fuerza",
  positive: "Energia positiva",
  negative: "Energia negativa",
  sacred: "Sagrado",
  profane: "Profano",
  divine: "Divino",
  necrotic: "Necrotico",
};

const OFFICIAL_DAMAGE_DICE_TYPE_SET = new Set([4, 6, 8, 10, 12]);

export function normalizeDamageDiceType(diceType?: number): number {
  return diceType && OFFICIAL_DAMAGE_DICE_TYPE_SET.has(diceType) ? diceType : 6;
}

export function getFullAttackBonuses(attackBonus: number): number[] {
  const normalizedAttackBonus = Number.isFinite(attackBonus)
    ? Math.trunc(attackBonus)
    : 0;
  const bonuses = [normalizedAttackBonus];
  let currentBonus = normalizedAttackBonus;

  while (currentBonus > 5) {
    currentBonus -= 5;

    if (currentBonus < 1) {
      break;
    }

    bonuses.push(currentBonus);
  }

  return bonuses;
}

export const SIZE_GRAPPLE_MODIFIERS: Record<string, number> = {
  Fine: -16,
  Diminutive: -12,
  Tiny: -8,
  Small: -4,
  Medium: 0,
  Large: 4,
  Huge: 8,
  Gargantuan: 12,
  Colossal: 16,
};

export function getSizeGrappleModifier(size?: string): number {
  return SIZE_GRAPPLE_MODIFIERS[size ?? "Medium"] ?? 0;
}

export type BattleActionType = "weapon" | "spell";

export type BattleActionModifierSource =
  | AbilityScoreField
  | "baseAttackBonus"
  | "initiative"
  | "custom";

export type BattleActionModifierApplication = "total" | "perDie" | "perGroup";

export interface BattleActionModifier {
  id: string;
  source: BattleActionModifierSource;
  application?: BattleActionModifierApplication;
  spellDamageGroupId?: string;
  customLabel?: string;
  customValue?: number;
}

export interface BattleActionWeaponSnapshot extends WeaponProfile {
  name: string;
}

export interface WeaponAttackConfig {
  source: "equipped" | "improvised";
  selectedWeaponId?: string;
  weaponSnapshot: BattleActionWeaponSnapshot;
  damageType?: DamageType;
  isFullAttack?: boolean;
  useCustomWeaponProfile?: boolean;
  disableTwoHandedDamageMultiplier?: boolean;
  extraDamageDiceCount?: number;
  attackModifiers: BattleActionModifier[];
  damageModifiers: BattleActionModifier[];
}

export type SpellTouchAttackType = "melee" | "ranged";

export interface SpellAttackConfig {
  damageDiceCount: number;
  damageDiceType: number;
  damageDiceGroups?: SpellDamageGroup[];
  damageType?: DamageType;
  requiresTouchAttack?: boolean;
  touchAttackType?: SpellTouchAttackType;
  effectModifiers: BattleActionModifier[];
}

export interface SpellDamageGroup {
  id?: string;
  diceCount: number;
  diceType: number;
  damageType?: DamageType;
}

export function getSpellDamageGroups(
  spellConfig?: Partial<SpellAttackConfig> | null,
): SpellDamageGroup[] {
  const damageDiceGroups =
    spellConfig?.damageDiceGroups && spellConfig.damageDiceGroups.length > 0
      ? spellConfig.damageDiceGroups
      : [
          {
            diceCount: spellConfig?.damageDiceCount ?? 1,
            diceType: spellConfig?.damageDiceType ?? 6,
          },
        ];

  return damageDiceGroups.map((group, index) => ({
    id: group.id ?? `spell-dice-${index}`,
    diceCount: Math.max(1, Math.trunc(group.diceCount ?? 1) || 1),
    diceType: normalizeDamageDiceType(group.diceType),
    damageType: group.damageType ?? spellConfig?.damageType,
  }));
}

export function getSpellTotalDiceCount(
  spellConfig?: Partial<SpellAttackConfig> | null,
): number {
  return getSpellDamageGroups(spellConfig).reduce(
    (total, group) => total + group.diceCount,
    0,
  );
}

export interface Attack {
  id: string;
  name: string;
  actionType: BattleActionType;
  notes: string;
  weaponConfig?: WeaponAttackConfig;
  spellConfig?: SpellAttackConfig;
}

export interface EquippedItem {
  id: string;
  slot: EquipmentSlot;
  category: EquippedItemCategory;
  name: string;
  description: string;
  isTwoHanded?: boolean;
  weaponProfile?: WeaponProfile;
  effects: EquippedItemEffect[];
}

export interface CharacterData {
  name: string;
  player: string;
  class: string;
  level: number;
  race: string;
  alignment: string;
  deity: string;
  size: string;
  age: number;
  gender: string;
  height: string;
  weight: string;
  eyes: string;
  hair: string;
  skin: string;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  tempStrength: number | null;
  tempDexterity: number | null;
  tempConstitution: number | null;
  tempIntelligence: number | null;
  tempWisdom: number | null;
  tempCharisma: number | null;
  fortitudeBase: number;
  fortitudeMagic: number;
  fortitudeMisc: number;
  reflexBase: number;
  reflexMagic: number;
  reflexMisc: number;
  willBase: number;
  willMagic: number;
  willMisc: number;
  initiative: number;
  currentHp: number;
  hp: number;
  nonlethalDamage: number;
  armorClass: number;
  touchAC: number;
  flatFootedAC: number;
  baseAttackBonus: number;
  grappleMisc: number;
  speed: number;
  attacks: Attack[];
  skills: Skill[];
  skillPointsToInvest: number;
  maxSkillRank: number;
  equippedItems: EquippedItem[];
  money: Money;
  equipment: InventoryItem[];
  carryingCapacity: CarryingCapacity;
  spellcasting: SpellcastingData;
  feats: string;
  languages: string;
  specialAbilities: string;
  notes: string;
}

export function createDefaultSpellLevel(level: number): SpellLevelData {
  return {
    level,
    knownSpells: 0,
    saveDC: 0,
    dailySpells: 0,
    additionalSpells: 0,
    dailyEntries: [],
  };
}

export function createDefaultSpellcasting(): SpellcastingData {
  return {
    specializations: "",
    conditionalModifiers: "",
    arcaneFailureChance: 0,
    spellLevels: Array.from({ length: 10 }, (_, level) =>
      createDefaultSpellLevel(level),
    ),
  };
}

const DEFAULT_SKILLS: Skill[] = [
  { name: "Tasacion", ability: "INT", ranks: 0, miscMod: 0, classSkill: false },
  {
    name: "Equilibrio",
    ability: "DEX",
    ranks: 0,
    miscMod: 0,
    classSkill: false,
  },
  { name: "Enganar", ability: "CHA", ranks: 0, miscMod: 0, classSkill: false },
  { name: "Trepar", ability: "STR", ranks: 0, miscMod: 0, classSkill: false },
  {
    name: "Concentracion",
    ability: "CON",
    ranks: 0,
    miscMod: 0,
    classSkill: false,
  },
  {
    name: "Artesania",
    ability: "INT",
    ranks: 0,
    miscMod: 0,
    classSkill: false,
  },
  {
    name: "Descifrar escritura",
    ability: "INT",
    ranks: 0,
    miscMod: 0,
    classSkill: false,
  },
  {
    name: "Diplomacia",
    ability: "CHA",
    ranks: 0,
    miscMod: 0,
    classSkill: false,
  },
  {
    name: "Inutilizar mecanismo",
    ability: "INT",
    ranks: 0,
    miscMod: 0,
    classSkill: false,
  },
  {
    name: "Disfrazarse",
    ability: "CHA",
    ranks: 0,
    miscMod: 0,
    classSkill: false,
  },
  {
    name: "Escapismo",
    ability: "DEX",
    ranks: 0,
    miscMod: 0,
    classSkill: false,
  },
  {
    name: "Falsificacion",
    ability: "INT",
    ranks: 0,
    miscMod: 0,
    classSkill: false,
  },
  {
    name: "Reunir informacion",
    ability: "CHA",
    ranks: 0,
    miscMod: 0,
    classSkill: false,
  },
  {
    name: "Trato con animales",
    ability: "CHA",
    ranks: 0,
    miscMod: 0,
    classSkill: false,
  },
  { name: "Sanar", ability: "WIS", ranks: 0, miscMod: 0, classSkill: false },
  {
    name: "Esconderse",
    ability: "DEX",
    ranks: 0,
    miscMod: 0,
    classSkill: false,
  },
  {
    name: "Intimidar",
    ability: "CHA",
    ranks: 0,
    miscMod: 0,
    classSkill: false,
  },
  { name: "Saltar", ability: "STR", ranks: 0, miscMod: 0, classSkill: false },
  {
    name: "Conocimiento (arcano)",
    ability: "INT",
    ranks: 0,
    miscMod: 0,
    classSkill: false,
  },
  {
    name: "Conocimiento (mazmorras)",
    ability: "INT",
    ranks: 0,
    miscMod: 0,
    classSkill: false,
  },
  {
    name: "Conocimiento (historia)",
    ability: "INT",
    ranks: 0,
    miscMod: 0,
    classSkill: false,
  },
  {
    name: "Conocimiento (local)",
    ability: "INT",
    ranks: 0,
    miscMod: 0,
    classSkill: false,
  },
  {
    name: "Conocimiento (naturaleza)",
    ability: "INT",
    ranks: 0,
    miscMod: 0,
    classSkill: false,
  },
  {
    name: "Conocimiento (religion)",
    ability: "INT",
    ranks: 0,
    miscMod: 0,
    classSkill: false,
  },
  { name: "Escuchar", ability: "WIS", ranks: 0, miscMod: 0, classSkill: false },
  {
    name: "Moverse sigilosamente",
    ability: "DEX",
    ranks: 0,
    miscMod: 0,
    classSkill: false,
  },
  {
    name: "Abrir cerraduras",
    ability: "DEX",
    ranks: 0,
    miscMod: 0,
    classSkill: false,
  },
  {
    name: "Interpretacion",
    ability: "CHA",
    ranks: 0,
    miscMod: 0,
    classSkill: false,
  },
  {
    name: "Profesion",
    ability: "WIS",
    ranks: 0,
    miscMod: 0,
    classSkill: false,
  },
  { name: "Montar", ability: "DEX", ranks: 0, miscMod: 0, classSkill: false },
  { name: "Buscar", ability: "INT", ranks: 0, miscMod: 0, classSkill: false },
  {
    name: "Averiguar intenciones",
    ability: "WIS",
    ranks: 0,
    miscMod: 0,
    classSkill: false,
  },
  {
    name: "Juego de manos",
    ability: "DEX",
    ranks: 0,
    miscMod: 0,
    classSkill: false,
  },
  {
    name: "Conocimiento de conjuros",
    ability: "INT",
    ranks: 0,
    miscMod: 0,
    classSkill: false,
  },
  { name: "Avistar", ability: "WIS", ranks: 0, miscMod: 0, classSkill: false },
  {
    name: "Supervivencia",
    ability: "WIS",
    ranks: 0,
    miscMod: 0,
    classSkill: false,
  },
  { name: "Nadar", ability: "STR", ranks: 0, miscMod: 0, classSkill: false },
  { name: "Piruetas", ability: "DEX", ranks: 0, miscMod: 0, classSkill: false },
  {
    name: "Usar objeto magico",
    ability: "CHA",
    ranks: 0,
    miscMod: 0,
    classSkill: false,
  },
  {
    name: "Uso de cuerdas",
    ability: "DEX",
    ranks: 0,
    miscMod: 0,
    classSkill: false,
  },
];

export const DEFAULT_CHARACTER: CharacterData = {
  name: "",
  player: "",
  class: "Guerrero",
  level: 1,
  race: "Humano",
  alignment: "",
  deity: "",
  size: "Medium",
  age: 0,
  gender: "",
  height: "",
  weight: "",
  eyes: "",
  hair: "",
  skin: "",
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
  tempStrength: null,
  tempDexterity: null,
  tempConstitution: null,
  tempIntelligence: null,
  tempWisdom: null,
  tempCharisma: null,
  fortitudeBase: 0,
  fortitudeMagic: 0,
  fortitudeMisc: 0,
  reflexBase: 0,
  reflexMagic: 0,
  reflexMisc: 0,
  willBase: 0,
  willMagic: 0,
  willMisc: 0,
  initiative: 0,
  currentHp: 10,
  hp: 10,
  nonlethalDamage: 0,
  armorClass: 10,
  touchAC: 10,
  flatFootedAC: 10,
  baseAttackBonus: 0,
  grappleMisc: 0,
  speed: 30,
  attacks: [],
  skills: DEFAULT_SKILLS,
  skillPointsToInvest: 0,
  maxSkillRank: 4,
  equippedItems: [],
  money: {
    platinum: 0,
    gold: 0,
    silver: 0,
    copper: 0,
  },
  equipment: [],
  carryingCapacity: {
    lightLoad: 0,
    mediumLoad: 0,
    heavyLoad: 0,
    liftOverHead: 0,
    liftOffGround: 0,
    pushOrDrag: 0,
  },
  spellcasting: createDefaultSpellcasting(),
  feats: "",
  languages: "",
  specialAbilities: "",
  notes: "",
};

const TEMP_ABILITY_SCORE_FIELDS: Record<
  AbilityScoreField,
  | "tempStrength"
  | "tempDexterity"
  | "tempConstitution"
  | "tempIntelligence"
  | "tempWisdom"
  | "tempCharisma"
> = {
  strength: "tempStrength",
  dexterity: "tempDexterity",
  constitution: "tempConstitution",
  intelligence: "tempIntelligence",
  wisdom: "tempWisdom",
  charisma: "tempCharisma",
};

export function getEffectiveAbilityScore(
  character: CharacterData,
  ability: AbilityScoreField,
): number {
  return character[TEMP_ABILITY_SCORE_FIELDS[ability]] ?? character[ability];
}

export function getCharacterAbilityModifier(
  character: CharacterData,
  ability: AbilityScoreField,
  bonus = 0,
): number {
  return getAbilityModifier(
    getEffectiveAbilityScore(character, ability) + bonus,
  );
}

export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatModifier(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}
