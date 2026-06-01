import { useMemo, useState } from "react";
import { FormCheckbox } from "@/components/formCheckbox";
import { FormNumberInput } from "@/components/formNumberInput";
import { FormSelect, type FormSelectOption } from "@/components/formSelect";
import {
  DAMAGE_DICE_TYPES,
  isOfficialDamageDiceType,
} from "../lib/damage-dice";
import { Modal } from "./modal";
import { DiceIcon } from "./diceIcon";
import {
  type EquipmentEffectTarget,
  type EquipmentSlot,
  type EquippedItem,
  type EquippedItemEffect,
  type WeaponProfile,
} from "@/lib/character-types";
import {
  ABILITY_SCORE_FIELDS,
  EQUIPMENT_CATEGORY_LABELS,
  EQUIPMENT_EFFECT_LABELS,
  EQUIPMENT_SLOT_LABELS,
  getAllowedEquipmentCategories,
  getDefaultEquipmentCategory,
} from "@/lib/equipment-effects";

/**
 * Propiedades del modal de equipamiento equipado.
 *
 */
interface EquippedItemModalProps {
  slot: EquipmentSlot;
  item: EquippedItem | null;
  skillNames: string[];
  twoHandedDisabled?: boolean;
  twoHandedDisabledReason?: string;
  onClose: () => void;
  onSave: (item: EquippedItem) => void;
  onDelete: (slot: EquipmentSlot) => void;
}

const EFFECT_TARGET_OPTIONS: EquipmentEffectTarget[] = [
  ...ABILITY_SCORE_FIELDS,
  "initiative",
  "armorClass",
  "touchAC",
  "flatFootedAC",
  "fortitude",
  "reflex",
  "will",
  "speed",
  "skill",
  "specialAbility",
];

function createEquipmentId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `gear-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createEmptyEffect(): EquippedItemEffect {
  return {
    id: createEquipmentId(),
    target: "armorClass",
    value: 0,
    description: "",
  };
}

function createDefaultWeaponProfile(): WeaponProfile {
  return {
    damageDiceCount: 1,
    damageDiceType: 8,
    criticalRangeStart: 20,
    criticalMultiplier: 2,
  };
}

function normalizeWeaponProfile(
  weaponProfile?: Partial<WeaponProfile>,
): WeaponProfile {
  const damageDiceType = weaponProfile?.damageDiceType ?? 8;

  return {
    damageDiceCount: Math.max(1, weaponProfile?.damageDiceCount ?? 1),
    damageDiceType: isOfficialDamageDiceType(damageDiceType)
      ? damageDiceType
      : 8,
    criticalRangeStart: Math.min(
      20,
      Math.max(1, weaponProfile?.criticalRangeStart ?? 20),
    ),
    criticalMultiplier: Math.max(2, weaponProfile?.criticalMultiplier ?? 2),
  };
}

function formatWeaponProfile(weaponProfile: WeaponProfile): string {
  const criticalRange =
    weaponProfile.criticalRangeStart >= 20
      ? "20"
      : `${weaponProfile.criticalRangeStart}-20`;

  return `${weaponProfile.damageDiceCount}d${weaponProfile.damageDiceType} | Critico ${criticalRange}/x${weaponProfile.criticalMultiplier}`;
}

function createEmptyItem(slot: EquipmentSlot): EquippedItem {
  const category = getDefaultEquipmentCategory(slot);

  return {
    id: createEquipmentId(),
    slot,
    category,
    name: "",
    description: "",
    isTwoHanded: false,
    weaponProfile:
      category === "weapon" ? createDefaultWeaponProfile() : undefined,
    effects: [],
  };
}

/**
 * Modal para editar el objeto equipado de una ranura concreta.
 */
export function EquippedItemModal({
  slot,
  item,
  skillNames,
  twoHandedDisabled = false,
  twoHandedDisabledReason,
  onClose,
  onSave,
  onDelete,
}: EquippedItemModalProps) {
  const [draft, setDraft] = useState<EquippedItem>(() => {
    const baseItem = item ?? createEmptyItem(slot);

    return {
      ...baseItem,
      weaponProfile:
        baseItem.category === "weapon"
          ? normalizeWeaponProfile(baseItem.weaponProfile)
          : undefined,
    };
  });
  const allowedCategories = useMemo(
    () => getAllowedEquipmentCategories(slot),
    [slot],
  );
  const categoryOptions = useMemo<FormSelectOption[]>(
    () =>
      allowedCategories.map((category) => ({
        value: category,
        label: EQUIPMENT_CATEGORY_LABELS[category],
      })),
    [allowedCategories],
  );
  const effectTargetOptions = useMemo<FormSelectOption[]>(
    () =>
      EFFECT_TARGET_OPTIONS.map((target) => ({
        value: target,
        label: EQUIPMENT_EFFECT_LABELS[target],
      })),
    [],
  );
  const skillOptions = useMemo<FormSelectOption[]>(
    () =>
      skillNames.map((skillName) => ({ value: skillName, label: skillName })),
    [skillNames],
  );
  const damageDiceOptions = useMemo<FormSelectOption[]>(
    () =>
      DAMAGE_DICE_TYPES.map((dice) => ({
        value: String(dice.sides),
        label: dice.label,
        icon: (
          <span
            className={`flex items-center justify-center ${dice.colorClass}`}
          >
            <DiceIcon sides={dice.sides} className="h-5 w-5" />
          </span>
        ),
      })),
    [],
  );
  const supportsTwoHanded = slot === "mainHand" || slot === "ranged";
  const isWeapon = draft.category === "weapon";
  const weaponProfile = isWeapon
    ? normalizeWeaponProfile(draft.weaponProfile)
    : null;

  const updateEffect = (
    effectId: string,
    updates: Partial<EquippedItemEffect>,
  ) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      effects: currentDraft.effects.map((effect) =>
        effect.id === effectId ? { ...effect, ...updates } : effect,
      ),
    }));
  };

  const addEffect = () => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      effects: [...currentDraft.effects, createEmptyEffect()],
    }));
  };

  const removeEffect = (effectId: string) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      effects: currentDraft.effects.filter((effect) => effect.id !== effectId),
    }));
  };

  const handleSave = () => {
    if (!draft.name.trim()) {
      return;
    }

    const category = allowedCategories.includes(draft.category)
      ? draft.category
      : allowedCategories[0];

    onSave({
      ...draft,
      slot,
      category,
      name: draft.name.trim(),
      description: draft.description.trim(),
      isTwoHanded:
        supportsTwoHanded && !twoHandedDisabled
          ? Boolean(draft.isTwoHanded)
          : false,
      weaponProfile:
        category === "weapon"
          ? normalizeWeaponProfile(draft.weaponProfile)
          : undefined,
      effects: draft.effects.map((effect) => ({
        ...effect,
        description: effect.description.trim(),
      })),
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      header={
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-gold/75">
              {EQUIPMENT_SLOT_LABELS[slot]}
            </div>
            <h3 className="mt-1 text-2xl font-semibold text-foreground">
              {item ? "Editar pieza equipada" : "Equipar una nueva pieza"}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Puedes registrar bonos numericos, marcar si un arma se usa a dos
              manos y anotar capacidades especiales del objeto.
            </p>
          </div>

          <div className="rounded-full border border-gold/25 bg-gold/10 px-4 py-2 text-sm text-gold">
            Categoria: {EQUIPMENT_CATEGORY_LABELS[draft.category]}
          </div>
        </div>
      }
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {item ? (
              <button
                type="button"
                onClick={() => onDelete(slot)}
                className="rounded-2xl border border-blood-red/35 bg-blood-red/10 px-4 py-2 text-sm text-blood-red transition-colors hover:bg-blood-red/15"
              >
                Quitar de la ranura
              </button>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-border/60 bg-background/20 px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancelar
            </button>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={!draft.name.trim()}
            className="rounded-2xl border border-gold/45 bg-gold/14 px-5 py-2.5 text-sm font-semibold text-gold transition-colors hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Guardar pieza equipada
          </button>
        </div>
      }
    >
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Nombre del objeto
            </span>
            <input
              type="text"
              value={draft.name}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  name: event.target.value,
                }))
              }
              className="w-full rounded-2xl px-4 py-3 text-sm"
              placeholder="Ej. Capa de resistencia +1"
            />
          </label>

          {allowedCategories.length > 1 ? (
            <label className="block">
              <span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Tipo de pieza
              </span>
              <FormSelect
                value={draft.category}
                onChange={(value: string) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    category: value as typeof currentDraft.category,
                    weaponProfile:
                      value === "weapon"
                        ? normalizeWeaponProfile(currentDraft.weaponProfile)
                        : undefined,
                  }))
                }
                options={categoryOptions}
                ariaLabel="Seleccionar tipo de pieza"
                uppercase
              />
            </label>
          ) : null}

          {supportsTwoHanded ? (
            <FormCheckbox
              checked={twoHandedDisabled ? false : Boolean(draft.isTwoHanded)}
              disabled={twoHandedDisabled}
              onChange={(checked: boolean) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  isTwoHanded: checked,
                }))
              }
              label="Se usa a dos manos"
              description={
                twoHandedDisabledReason ??
                "Si lo marcas, esta pieza ocupara tambien la mano secundaria."
              }
              className="rounded-2xl border border-gold/18 bg-gold/6 p-4"
            />
          ) : null}

          {isWeapon && weaponProfile ? (
            <div className="rounded-2xl border border-gold/18 bg-gold/6 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-gold/80">
                Perfil de arma
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Define el dano base y la amenaza de critico de esta arma.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Cantidad de dados
                  </span>
                  <FormNumberInput
                    value={weaponProfile.damageDiceCount}
                    onChange={(value) =>
                      setDraft((currentDraft) => ({
                        ...currentDraft,
                        weaponProfile: normalizeWeaponProfile({
                          ...currentDraft.weaponProfile,
                          damageDiceCount: parseInt(value, 10) || 1,
                        }),
                      }))
                    }
                    min={1}
                    className="w-full"
                    inputClassName="rounded-xl px-3 py-2 text-center text-sm"
                    ariaLabel="Cantidad de dados de dano"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Dado de dano
                  </span>
                  <FormSelect
                    value={String(weaponProfile.damageDiceType)}
                    onChange={(value) =>
                      setDraft((currentDraft) => ({
                        ...currentDraft,
                        weaponProfile: normalizeWeaponProfile({
                          ...currentDraft.weaponProfile,
                          damageDiceType: Number.parseInt(value, 10) || 8,
                        }),
                      }))
                    }
                    options={damageDiceOptions}
                    ariaLabel="Tipo de dado de dano"
                    triggerClassName="rounded-xl px-3 py-2"
                    menuClassName="rounded-xl"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Rango de critico
                  </span>
                  <FormNumberInput
                    value={weaponProfile.criticalRangeStart}
                    onChange={(value) =>
                      setDraft((currentDraft) => ({
                        ...currentDraft,
                        weaponProfile: normalizeWeaponProfile({
                          ...currentDraft.weaponProfile,
                          criticalRangeStart: parseInt(value, 10) || 20,
                        }),
                      }))
                    }
                    min={1}
                    max={20}
                    className="w-full"
                    inputClassName="rounded-xl px-3 py-2 text-center text-sm"
                    ariaLabel="Rango minimo de critico"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Multiplicador critico
                  </span>
                  <FormNumberInput
                    value={weaponProfile.criticalMultiplier}
                    onChange={(value) =>
                      setDraft((currentDraft) => ({
                        ...currentDraft,
                        weaponProfile: normalizeWeaponProfile({
                          ...currentDraft.weaponProfile,
                          criticalMultiplier: parseInt(value, 10) || 2,
                        }),
                      }))
                    }
                    min={2}
                    className="w-full"
                    inputClassName="rounded-xl px-3 py-2 text-center text-sm"
                    ariaLabel="Multiplicador de critico"
                  />
                </label>
              </div>

              <div className="mt-3 rounded-xl border border-border/50 bg-background/18 px-3 py-2 text-sm text-foreground">
                {formatWeaponProfile(weaponProfile)}
              </div>
            </div>
          ) : null}

          <label className="block">
            <span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Descripcion o notas
            </span>
            <textarea
              value={draft.description}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  description: event.target.value,
                }))
              }
              className="h-32 w-full resize-none rounded-2xl px-4 py-3 text-sm"
              placeholder="Describe el objeto, sus limitaciones, cargas o cualquier detalle narrativo relevante."
            />
          </label>

          <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-gold/80">
              Aplicacion automatica
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Los bonos de caracteristicas, iniciativa, CA, salvaciones,
              velocidad y habilidades se reflejan automaticamente en la hoja.
              Las habilidades especiales se listan como efecto activo del
              equipo.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-gold/80">
              Efectos del objeto
            </h4>
            <button
              type="button"
              onClick={addEffect}
              className="rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-xs text-gold transition-colors hover:bg-gold/15"
            >
              + Anadir efecto
            </button>
          </div>

          {draft.effects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-background/12 p-5 text-sm leading-6 text-muted-foreground">
              Este objeto no tiene efectos hasta que agregues uno nuevo.
            </div>
          ) : (
            <div className="space-y-3 pr-1">
              {draft.effects.map((effect) => (
                <div
                  key={effect.id}
                  className="rounded-2xl border border-border/60 bg-background/20 p-4"
                >
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        Que mejora
                      </span>
                      <FormSelect
                        value={effect.target}
                        onChange={(value: string) =>
                          updateEffect(effect.id, {
                            target: value as EquipmentEffectTarget,
                            skillName:
                              value === "skill"
                                ? (skillNames[0] ?? "")
                                : undefined,
                            value:
                              value === "specialAbility" ? 0 : effect.value,
                            description:
                              value === "specialAbility"
                                ? effect.description
                                : effect.description,
                          })
                        }
                        options={effectTargetOptions}
                        ariaLabel="Seleccionar efecto del objeto"
                        uppercase
                        triggerClassName="rounded-xl px-3 py-2"
                        menuClassName="rounded-xl"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => removeEffect(effect.id)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-background/30 text-muted-foreground transition-colors hover:border-blood-red/40 hover:text-blood-red"
                      title="Quitar efecto"
                      aria-label="Quitar efecto"
                    >
                      <svg
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      >
                        <path d="M4.5 6h11" strokeLinecap="round" />
                        <path
                          d="M8 6V4.75A1.25 1.25 0 0 1 9.25 3.5h1.5A1.25 1.25 0 0 1 12 4.75V6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M6.25 6.75v7.5A1.75 1.75 0 0 0 8 16h4a1.75 1.75 0 0 0 1.75-1.75v-7.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path d="M8.5 9.25v4" strokeLinecap="round" />
                        <path d="M11.5 9.25v4" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>

                  {effect.target === "skill" ? (
                    <label className="mt-3 block">
                      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        Habilidad afectada
                      </span>
                      <FormSelect
                        value={effect.skillName ?? ""}
                        onChange={(value: string) =>
                          updateEffect(effect.id, {
                            skillName: value,
                          })
                        }
                        options={skillOptions}
                        ariaLabel="Seleccionar habilidad afectada"
                        triggerClassName="rounded-xl px-3 py-2"
                        menuClassName="rounded-xl"
                      />
                    </label>
                  ) : null}

                  {effect.target === "specialAbility" ? (
                    <label className="mt-3 block">
                      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        Habilidad especial
                      </span>
                      <textarea
                        value={effect.description}
                        onChange={(event) =>
                          updateEffect(effect.id, {
                            description: event.target.value,
                          })
                        }
                        className="h-24 w-full resize-none rounded-xl px-3 py-2 text-sm"
                        placeholder="Ej. Libertad de movimiento 1/dia o vision en la oscuridad 18 m."
                      />
                    </label>
                  ) : (
                    <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
                      <label className="block">
                        <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                          Etiqueta del efecto
                        </span>
                        <input
                          type="text"
                          value={effect.description}
                          onChange={(event) =>
                            updateEffect(effect.id, {
                              description: event.target.value,
                            })
                          }
                          className="w-full rounded-xl px-3 py-2 text-sm"
                          placeholder="Ej. Mejora, competencia, racial..."
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                          Cantidad
                        </span>
                        <FormNumberInput
                          value={effect.value}
                          onChange={(value) =>
                            updateEffect(effect.id, {
                              value: parseInt(value, 10) || 0,
                            })
                          }
                          className="w-full"
                          inputClassName="rounded-xl px-3 py-2 text-center text-sm"
                          ariaLabel="Cantidad del efecto"
                        />
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
