import { useMemo, useState } from "react";
import type { CharacterData, InventoryItem } from "@/lib/character-types";
import { FormNumberInput } from "@/components/formNumberInput";
import { SectionShell } from "./sectionShell";

const COINS_PER_POUND = 50;
type CarryingCapacityFieldKey = keyof CharacterData["carryingCapacity"];

interface CarryingCapacityFieldConfig {
  key: CarryingCapacityFieldKey;
  label: string;
  hint?: string;
}

const CARRYING_CAPACITY_FIELDS: CarryingCapacityFieldConfig[] = [
  {
    key: "lightLoad",
    label: "Carga ligera",
  },
  {
    key: "mediumLoad",
    label: "Carga media",
  },
  {
    key: "heavyLoad",
    label: "Carga pesada",
  },
  {
    key: "liftOverHead",
    label: "Levantar sobre la cabeza",
    hint: "Igual a carga max.",
  },
  {
    key: "liftOffGround",
    label: "Levantar del suelo",
    hint: "2 x carga max.",
  },
  {
    key: "pushOrDrag",
    label: "Empujar o arrastrar",
    hint: "5 x carga max.",
  },
] as const;

/**
 * Propiedades de la seccion de equipo y dinero.
 */
interface EquipmentProps {
  character: CharacterData;
  onChange: (updates: Partial<CharacterData>) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

function createInventoryItem(): InventoryItem {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return {
      id: `inventory-${crypto.randomUUID()}`,
      name: "",
      quantity: 1,
      weight: 0,
    };
  }

  return {
    id: `inventory-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    quantity: 1,
    weight: 0,
  };
}

function formatEditableWeight(weight: number) {
  return weight === 0 ? "0" : String(weight);
}

function formatWeight(weight: number) {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(weight);
}

function buildWeightDrafts(
  items: InventoryItem[],
  currentDrafts: Record<string, string> = {},
) {
  const nextDrafts: Record<string, string> = {};

  for (const item of items) {
    nextDrafts[item.id] =
      currentDrafts[item.id] ?? formatEditableWeight(item.weight);
  }

  return nextDrafts;
}

/**
 * Centraliza la economia del personaje y el listado de equipo editable.
 */
export function Equipment({
  character,
  onChange,
  isOpen,
  onToggle,
}: EquipmentProps) {
  const [weightDrafts, setWeightDrafts] = useState<Record<string, string>>(() =>
    buildWeightDrafts(character.equipment),
  );

  const equipmentWeight = useMemo(
    () =>
      character.equipment.reduce(
        (total, item) => total + item.quantity * item.weight,
        0,
      ),
    [character.equipment],
  );

  const moneyWeight = useMemo(() => {
    const totalCoins =
      character.money.platinum +
      character.money.gold +
      character.money.silver +
      character.money.copper;

    return totalCoins / COINS_PER_POUND;
  }, [character.money]);

  const totalWeight = useMemo(
    () => equipmentWeight + moneyWeight,
    [equipmentWeight, moneyWeight],
  );

  const updateInventory = (nextItems: InventoryItem[]) => {
    setWeightDrafts((current) => buildWeightDrafts(nextItems, current));
    onChange({ equipment: nextItems });
  };

  const updateCarryingCapacity = (
    key: CarryingCapacityFieldKey,
    value: string,
  ) => {
    onChange({
      carryingCapacity: {
        ...character.carryingCapacity,
        [key]: Math.max(0, Number.parseInt(value, 10) || 0),
      },
    });
  };

  const updateItem = (itemId: string, updates: Partial<InventoryItem>) => {
    updateInventory(
      character.equipment.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item,
      ),
    );
  };

  const handleWeightChange = (itemId: string, nextValue: string) => {
    if (!/^\d*([.,]\d{0,2})?$/.test(nextValue)) {
      return;
    }

    setWeightDrafts((current) => ({
      ...current,
      [itemId]: nextValue,
    }));

    const parsedWeight = Number.parseFloat(nextValue.replace(",", "."));
    updateItem(itemId, {
      weight: Number.isNaN(parsedWeight) ? 0 : Math.max(0, parsedWeight),
    });
  };

  const handleWeightBlur = (item: InventoryItem) => {
    setWeightDrafts((current) => ({
      ...current,
      [item.id]: formatEditableWeight(item.weight),
    }));
  };

  return (
    <SectionShell
      title="INVENTARIO Y DINERO"
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="mb-4">
        <div className="text-xs text-muted-foreground mb-2">Dinero</div>
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <FormNumberInput
              value={character.money.platinum}
              onChange={(value) =>
                onChange({
                  money: {
                    ...character.money,
                    platinum: parseInt(value, 10) || 0,
                  },
                })
              }
              className="w-full"
              inputClassName="rounded py-1 text-center"
              min={0}
              ariaLabel="Piezas de platino"
              compact
            />
            <span className="text-xs text-muted-foreground">PP</span>
          </div>
          <div className="text-center">
            <FormNumberInput
              value={character.money.gold}
              onChange={(value) =>
                onChange({
                  money: {
                    ...character.money,
                    gold: parseInt(value, 10) || 0,
                  },
                })
              }
              className="w-full"
              inputClassName="rounded py-1 text-center text-gold"
              min={0}
              ariaLabel="Piezas de oro"
              compact
            />
            <span className="text-xs text-gold">GP</span>
          </div>
          <div className="text-center">
            <FormNumberInput
              value={character.money.silver}
              onChange={(value) =>
                onChange({
                  money: {
                    ...character.money,
                    silver: parseInt(value, 10) || 0,
                  },
                })
              }
              className="w-full"
              inputClassName="rounded py-1 text-center"
              min={0}
              ariaLabel="Piezas de plata"
              compact
            />
            <span className="text-xs text-muted-foreground">SP</span>
          </div>
          <div className="text-center">
            <FormNumberInput
              value={character.money.copper}
              onChange={(value) =>
                onChange({
                  money: {
                    ...character.money,
                    copper: parseInt(value, 10) || 0,
                  },
                })
              }
              className="w-full"
              inputClassName="rounded py-1 text-center"
              min={0}
              ariaLabel="Piezas de cobre"
              compact
            />
            <span className="text-xs text-muted-foreground">CP</span>
          </div>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          Peso de monedas: {formatWeight(moneyWeight)} lb (50 monedas = 1 lb)
        </p>
      </div>

      {/* Equipment List */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">Equipo</div>
          <button
            type="button"
            onClick={() =>
              updateInventory([...character.equipment, createInventoryItem()])
            }
            className="rounded-lg border border-gold/35 bg-gold/10 px-3 py-1 text-xs font-medium text-gold transition-colors hover:bg-gold/18"
          >
            Anadir objeto
          </button>
        </div>

        <div className="mb-2 grid grid-cols-[minmax(0,1fr)_78px_92px_40px] gap-2 px-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
          <span>Objeto</span>
          <span className="text-center">Unid.</span>
          <span className="text-center">Peso/u</span>
          <span className="text-center">Quitar</span>
        </div>

        <div className="space-y-2">
          {character.equipment.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-background/25 px-4 py-5 text-sm text-muted-foreground">
              No hay objetos en el inventario todavia.
            </div>
          ) : (
            character.equipment.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[minmax(0,1fr)_78px_92px_40px] gap-2 rounded-2xl border border-border/70 bg-background/30 p-2"
              >
                <input
                  type="text"
                  value={item.name}
                  onChange={(event) =>
                    updateItem(item.id, { name: event.target.value })
                  }
                  placeholder="Nombre del objeto"
                  className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm"
                />

                <FormNumberInput
                  value={item.quantity}
                  onChange={(value) =>
                    updateItem(item.id, {
                      quantity: Math.max(0, Number.parseInt(value, 10) || 0),
                    })
                  }
                  min={0}
                  className="w-full"
                  inputClassName="rounded-xl py-2 text-center"
                  ariaLabel={`Unidades de ${item.name || "objeto"}`}
                  compact
                />

                <input
                  type="text"
                  inputMode="decimal"
                  value={
                    weightDrafts[item.id] ?? formatEditableWeight(item.weight)
                  }
                  onChange={(event) =>
                    handleWeightChange(item.id, event.target.value)
                  }
                  onBlur={() => handleWeightBlur(item)}
                  placeholder="0"
                  className="w-full rounded-xl border border-border bg-input px-3 py-2 text-center text-sm"
                  aria-label={`Peso unitario de ${item.name || "objeto"}`}
                />

                <button
                  type="button"
                  onClick={() =>
                    updateInventory(
                      character.equipment.filter(
                        (entry) => entry.id !== item.id,
                      ),
                    )
                  }
                  className="rounded-xl border border-blood-red/35 bg-blood-red/10 text-sm font-semibold text-blood-red transition-colors hover:bg-blood-red/18"
                  aria-label={`Quitar ${item.name || "objeto"}`}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-3 flex items-center justify-between rounded-2xl border border-border/70 bg-background/30 px-4 py-3">
          <div>
            <span className="text-sm font-medium text-foreground">
              Peso total
            </span>
            <p className="text-xs text-muted-foreground">
              Equipo {formatWeight(equipmentWeight)} lb + dinero{" "}
              {formatWeight(moneyWeight)} lb
            </p>
          </div>
          <span className="text-sm font-semibold text-gold">
            {formatWeight(totalWeight)} lb
          </span>
        </div>

        <div className="mt-4">
          <div className="mb-2 text-xs text-muted-foreground">
            Capacidad de carga
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {CARRYING_CAPACITY_FIELDS.map((field) => (
              <div
                key={field.key}
                className="flex flex-col rounded-2xl border border-border/70 bg-background/30 px-3 py-3"
              >
                <div className="min-h-10 text-center text-[11px] font-semibold uppercase leading-tight tracking-[0.08em] text-foreground">
                  {field.label}
                </div>
                {field.hint ? (
                  <div className="mt-1 text-center text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                    {field.hint}
                  </div>
                ) : null}
                <FormNumberInput
                  value={character.carryingCapacity[field.key]}
                  onChange={(value) => updateCarryingCapacity(field.key, value)}
                  min={0}
                  className={`w-full ${field.hint ? "mt-2" : "mt-3"}`}
                  inputClassName="rounded-xl py-2 text-center"
                  ariaLabel={field.label}
                  compact
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
