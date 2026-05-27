import { useMemo, useState } from "react";
import { SectionShell } from "./sectionShell";
import { EquippedItemModal } from "./equippedItemModal";
import {
  type CharacterData,
  type EquipmentSlot,
  type EquippedItem,
} from "@/lib/character-types";
import {
  computeEquipmentBonuses,
  EQUIPMENT_SLOT_LABELS,
  doesItemOccupyOffHand,
  getEffectiveEquipmentSlot,
} from "@/lib/equipment-effects";

/**
 * Propiedades de la seccion de equipamiento equipado.
 */
interface EquippedGearProps {
  character: CharacterData;
  onChange: (updates: Partial<CharacterData>) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

interface SlotPlacement {
  slot: EquipmentSlot;
  className: string;
}

const BODY_SLOT_PLACEMENTS: SlotPlacement[] = [
  { slot: "head", className: "left-1/2 top-3 -translate-x-1/2" },
  { slot: "eyes", className: "left-1/2 top-18 -translate-x-1/2" },
  { slot: "throat", className: "left-1/2 top-31 -translate-x-1/2" },
  { slot: "shoulders", className: "left-1/2 top-43 -translate-x-1/2" },
  { slot: "torso", className: "left-1/2 top-57 -translate-x-1/2" },
  { slot: "body", className: "left-1/2 top-73 -translate-x-1/2" },
  { slot: "arms", className: "left-1 top-[10.75rem]" },
  { slot: "hands", className: "right-1 top-[10.75rem]" },
  { slot: "ringLeft", className: "left-2 top-[17.8rem]" },
  { slot: "ringRight", className: "right-2 top-[17.8rem]" },
  { slot: "waist", className: "left-1/2 top-[21.1rem] -translate-x-1/2" },
  { slot: "feet", className: "left-1/2 top-[24.25rem] -translate-x-1/2" },
];

const LEFT_SIDE_SLOTS: EquipmentSlot[] = ["armor", "offHand"];

const RIGHT_SIDE_SLOTS: EquipmentSlot[] = ["mainHand", "ranged", "ammunition"];

function SlotButton({
  slot,
  item,
  onClick,
  compact = false,
}: {
  slot: EquipmentSlot;
  item?: EquippedItem;
  onClick: () => void;
  compact?: boolean;
}) {
  const hasItem = Boolean(item);
  const slotLabel = EQUIPMENT_SLOT_LABELS[slot];
  const itemLabel = item?.name.trim();
  const squareClass = `flex items-center justify-center rounded-xl border transition-colors ${hasItem ? "border-gold/55 bg-gold/12 text-gold" : "border-border/70 bg-input/85 text-muted-foreground group-hover:border-gold/45 group-hover:text-gold"}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group transition-all duration-200 ${compact ? "w-14 bg-transparent p-0 text-center hover:shadow-none" : "w-full rounded-xl border border-border/60 bg-background/20 px-2 py-2 text-center hover:border-gold/45 hover:bg-gold/8 hover:shadow-[0_0_18px_rgba(212,175,55,0.08)]"}`}
      title={item ? item.name : `Anadir en ${slotLabel}`}
    >
      {compact ? (
        <div className="flex flex-col items-center gap-0.5 text-center">
          <div className="max-w-full text-[7px] uppercase leading-3 tracking-widest text-muted-foreground">
            {slotLabel}
          </div>

          <span className={`${squareClass} h-7.5 w-7.5`}>
            {hasItem ? (
              <svg
                viewBox="0 0 20 20"
                aria-hidden="true"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  d="M4.5 10.5 8 14l7.5-8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <span className="text-xl leading-none">+</span>
            )}
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-full text-center text-[8px] uppercase tracking-[0.12em] text-muted-foreground">
            {slotLabel}
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <span className={`${squareClass} h-9 w-9 shrink-0`}>
              {hasItem ? (
                <svg
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    d="M4.5 10.5 8 14l7.5-8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <span className="text-xl leading-none">+</span>
              )}
            </span>

            {itemLabel ? (
              <div className="max-w-full text-center truncate text-[12px] leading-4 text-foreground">
                {itemLabel}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </button>
  );
}

/**
 * Representa el equipamiento actualmente llevado por el personaje y permite
 * editar cada ranura con un modal contextual.
 */
export function EquippedGear({
  character,
  onChange,
  isOpen,
  onToggle,
}: EquippedGearProps) {
  const [activeSlot, setActiveSlot] = useState<EquipmentSlot | null>(null);
  const bonuses = useMemo(
    () => computeEquipmentBonuses(character),
    [character],
  );

  const skillNames = useMemo(
    () => character.skills.map((skill) => skill.name),
    [character.skills],
  );

  const explicitOffHandItem = useMemo(
    () =>
      character.equippedItems.find(
        (item) => getEffectiveEquipmentSlot(item.slot) === "offHand",
      ) ?? null,
    [character.equippedItems],
  );

  const offHandOccupier = useMemo(
    () => character.equippedItems.find(doesItemOccupyOffHand) ?? null,
    [character.equippedItems],
  );

  const resolveSlotEditor = (slot: EquipmentSlot) => {
    if (slot !== "offHand") {
      return slot;
    }

    if (explicitOffHandItem) {
      return "offHand";
    }

    if (offHandOccupier) {
      return offHandOccupier.slot;
    }

    return "offHand";
  };

  const handleSaveItem = (item: EquippedItem) => {
    const effectiveSlot = getEffectiveEquipmentSlot(item.slot);
    const normalizedItem =
      effectiveSlot === item.slot ? item : { ...item, slot: effectiveSlot };

    let remainingItems = character.equippedItems
      .filter(
        (currentItem) =>
          getEffectiveEquipmentSlot(currentItem.slot) !== effectiveSlot,
      )
      .map((currentItem) =>
        effectiveSlot === "offHand" && doesItemOccupyOffHand(currentItem)
          ? { ...currentItem, isTwoHanded: false }
          : currentItem,
      );

    if (doesItemOccupyOffHand(normalizedItem)) {
      remainingItems = remainingItems
        .filter(
          (currentItem) =>
            getEffectiveEquipmentSlot(currentItem.slot) !== "offHand",
        )
        .map((currentItem) =>
          currentItem.slot !== normalizedItem.slot &&
          doesItemOccupyOffHand(currentItem)
            ? { ...currentItem, isTwoHanded: false }
            : currentItem,
        );
    }

    onChange({ equippedItems: [...remainingItems, normalizedItem] });
    setActiveSlot(null);
  };

  const handleDeleteItem = (slot: EquipmentSlot) => {
    onChange({
      equippedItems: character.equippedItems.filter(
        (item) => getEffectiveEquipmentSlot(item.slot) !== slot,
      ),
    });
    setActiveSlot(null);
  };

  const activeItem = activeSlot
    ? (bonuses.equippedBySlot[activeSlot] ?? null)
    : null;
  const mainHandOccupiesOffHand = Boolean(
    bonuses.equippedBySlot.mainHand?.isTwoHanded,
  );
  const rangedOccupiesOffHand = Boolean(
    bonuses.equippedBySlot.ranged?.isTwoHanded,
  );

  const isTwoHandedDisabled =
    activeSlot === "mainHand"
      ? rangedOccupiesOffHand
      : activeSlot === "ranged"
        ? mainHandOccupiesOffHand
        : false;

  const twoHandedDisabledReason =
    activeSlot === "mainHand" && rangedOccupiesOffHand
      ? "No disponible mientras el arma a distancia este marcada como a dos manos."
      : activeSlot === "ranged" && mainHandOccupiesOffHand
        ? "No disponible mientras la mano principal este marcada como a dos manos."
        : undefined;

  return (
    <>
      <SectionShell title="EQUIPAMIENTO" isOpen={isOpen} onToggle={onToggle}>
        <div className="grid gap-3 lg:grid-cols-[minmax(78px,0.4fr)_minmax(360px,1.9fr)_minmax(78px,0.4fr)]">
          <div className="space-y-3">
            {LEFT_SIDE_SLOTS.map((slot) => (
              <SlotButton
                key={slot}
                slot={slot}
                item={bonuses.equippedBySlot[slot]}
                onClick={() => setActiveSlot(resolveSlotEditor(slot))}
              />
            ))}
          </div>

          <div className="relative mx-auto flex h-116 w-full max-w-82 items-center justify-center overflow-hidden rounded-[28px] border border-gold/12 bg-background/20 px-1.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <img
              src="/vitruvian-man.svg"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-28"
            />
            <div className="pointer-events-none absolute inset-0 bg-radial-[circle_at_center] from-gold/10 via-transparent to-transparent" />

            {BODY_SLOT_PLACEMENTS.map(({ slot, className }) => (
              <div key={slot} className={`absolute ${className}`}>
                <SlotButton
                  slot={slot}
                  item={bonuses.equippedBySlot[slot]}
                  onClick={() => setActiveSlot(resolveSlotEditor(slot))}
                  compact
                />
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {RIGHT_SIDE_SLOTS.map((slot) => (
              <SlotButton
                key={slot}
                slot={slot}
                item={bonuses.equippedBySlot[slot]}
                onClick={() => setActiveSlot(resolveSlotEditor(slot))}
              />
            ))}
          </div>
        </div>
      </SectionShell>

      {activeSlot ? (
        <EquippedItemModal
          key={`${activeSlot}-${activeItem?.id ?? "new"}`}
          slot={activeSlot}
          item={activeItem}
          skillNames={skillNames}
          twoHandedDisabled={isTwoHandedDisabled}
          twoHandedDisabledReason={twoHandedDisabledReason}
          onClose={() => setActiveSlot(null)}
          onSave={handleSaveItem}
          onDelete={handleDeleteItem}
        />
      ) : null}
    </>
  );
}
