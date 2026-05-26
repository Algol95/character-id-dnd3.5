export interface Attack {
  name: string;
  attackBonus: number;
  damage: string;
  critical: string;
  range: string;
  type: string;
  notes: string;
}

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
  speed: number;
  attacks: Attack[];
  skills: Skill[];
  money: Money;
  equipment: string;
  feats: string;
  specialAbilities: string;
  notes: string;
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
  speed: 30,
  attacks: [],
  skills: DEFAULT_SKILLS,
  money: {
    platinum: 0,
    gold: 0,
    silver: 0,
    copper: 0,
  },
  equipment: "",
  feats: "",
  specialAbilities: "",
  notes: "",
};

export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatModifier(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}
