import {
  type AbilityScoreField,
  type CharacterData,
  type EquipmentEffectTarget,
  type EquipmentSlot,
  type EquippedItem,
  type EquippedItemCategory,
} from "./character-types";

export const ABILITY_SCORE_FIELDS: AbilityScoreField[] = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
];

export const EQUIPMENT_SLOT_LABELS: Record<EquipmentSlot, string> = {
  head: "Cabeza",
  eyes: "Ojos",
  throat: "Cuello",
  shoulders: "Hombros",
  torso: "Torso",
  body: "Pecho",
  arms: "Brazos",
  hands: "Manos",
  waist: "Cintura",
  feet: "Pies",
  ringLeft: "Anillo izq.",
  ringRight: "Anillo dcho.",
  armor: "Armadura",
  shield: "Escudo",
  mainHand: "Mano principal",
  offHand: "Mano secundaria",
  ranged: "Arma a distancia",
  ammunition: "Municion",
};

export const EQUIPMENT_EFFECT_LABELS: Record<EquipmentEffectTarget, string> = {
  strength: "Fuerza",
  dexterity: "Destreza",
  constitution: "Constitucion",
  intelligence: "Inteligencia",
  wisdom: "Sabiduria",
  charisma: "Carisma",
  initiative: "Iniciativa",
  armorClass: "Clase de armadura",
  touchAC: "CA de toque",
  flatFootedAC: "CA desprevenido",
  fortitude: "Fortaleza",
  reflex: "Reflejos",
  will: "Voluntad",
  speed: "Velocidad",
  skill: "Habilidad",
  specialAbility: "Habilidad especial",
};

export const EQUIPMENT_CATEGORY_LABELS: Record<EquippedItemCategory, string> = {
  armor: "Armadura",
  shield: "Escudo",
  weapon: "Arma",
  accessory: "Accesorio",
  wondrous: "Objeto maravilloso",
};

export interface EquipmentBonuses {
  abilityBonuses: Record<AbilityScoreField, number>;
  skillBonuses: Record<string, number>;
  initiative: number;
  armorClass: number;
  touchAC: number;
  flatFootedAC: number;
  fortitude: number;
  reflex: number;
  will: number;
  speed: number;
  specialAbilities: Array<{
    itemId: string;
    itemName: string;
    description: string;
  }>;
  equippedBySlot: Partial<Record<EquipmentSlot, EquippedItem>>;
}

function createEmptyAbilityBonuses(): Record<AbilityScoreField, number> {
  return {
    strength: 0,
    dexterity: 0,
    constitution: 0,
    intelligence: 0,
    wisdom: 0,
    charisma: 0,
  };
}

export function getDefaultEquipmentCategory(
  slot: EquipmentSlot,
): EquippedItemCategory {
  if (slot === "armor") {
    return "armor";
  }

  if (slot === "shield") {
    return "shield";
  }

  if (
    slot === "mainHand" ||
    slot === "offHand" ||
    slot === "ranged" ||
    slot === "ammunition"
  ) {
    return "weapon";
  }

  if (slot === "body" || slot === "torso" || slot === "shoulders") {
    return "wondrous";
  }

  return "accessory";
}

export function getAllowedEquipmentCategories(
  slot: EquipmentSlot,
): EquippedItemCategory[] {
  if (slot === "offHand") {
    return ["weapon", "shield"];
  }

  if (slot === "shield") {
    return ["shield"];
  }

  return [getDefaultEquipmentCategory(slot)];
}

export function getEffectiveEquipmentSlot(slot: EquipmentSlot): EquipmentSlot {
  return slot === "shield" ? "offHand" : slot;
}

export function doesItemOccupyOffHand(item: EquippedItem): boolean {
  return (
    (item.slot === "mainHand" || item.slot === "ranged") &&
    Boolean(item.isTwoHanded)
  );
}

export function isEquippedWeaponCandidate(item: EquippedItem): boolean {
  return (
    Boolean(item.weaponProfile) ||
    item.category === "weapon" ||
    item.slot === "mainHand" ||
    item.slot === "ranged"
  );
}

export function computeEquipmentBonuses(
  character: CharacterData,
): EquipmentBonuses {
  const bonuses: EquipmentBonuses = {
    abilityBonuses: createEmptyAbilityBonuses(),
    skillBonuses: {},
    initiative: 0,
    armorClass: 0,
    touchAC: 0,
    flatFootedAC: 0,
    fortitude: 0,
    reflex: 0,
    will: 0,
    speed: 0,
    specialAbilities: [],
    equippedBySlot: {},
  };

  for (const item of character.equippedItems) {
    const effectiveSlot = getEffectiveEquipmentSlot(item.slot);
    const normalizedItem =
      effectiveSlot === item.slot
        ? item
        : {
            ...item,
            slot: effectiveSlot,
            category: item.category === "weapon" ? "shield" : item.category,
          };

    bonuses.equippedBySlot[effectiveSlot] = normalizedItem;

    if (
      doesItemOccupyOffHand(normalizedItem) &&
      !bonuses.equippedBySlot.offHand
    ) {
      bonuses.equippedBySlot.offHand = normalizedItem;
    }

    for (const effect of item.effects) {
      switch (effect.target) {
        case "strength":
        case "dexterity":
        case "constitution":
        case "intelligence":
        case "wisdom":
        case "charisma":
          bonuses.abilityBonuses[effect.target] += effect.value;
          break;
        case "initiative":
          bonuses.initiative += effect.value;
          break;
        case "armorClass":
          bonuses.armorClass += effect.value;
          break;
        case "touchAC":
          bonuses.touchAC += effect.value;
          break;
        case "flatFootedAC":
          bonuses.flatFootedAC += effect.value;
          break;
        case "fortitude":
          bonuses.fortitude += effect.value;
          break;
        case "reflex":
          bonuses.reflex += effect.value;
          break;
        case "will":
          bonuses.will += effect.value;
          break;
        case "speed":
          bonuses.speed += effect.value;
          break;
        case "skill":
          if (effect.skillName) {
            bonuses.skillBonuses[effect.skillName] =
              (bonuses.skillBonuses[effect.skillName] ?? 0) + effect.value;
          }
          break;
        case "specialAbility":
          if (effect.description.trim()) {
            bonuses.specialAbilities.push({
              itemId: item.id,
              itemName: item.name,
              description: effect.description.trim(),
            });
          }
          break;
      }
    }
  }

  return bonuses;
}
