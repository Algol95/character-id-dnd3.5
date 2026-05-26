import { DiceButton } from "./diceButton";
import { SectionShell } from "./sectionShell";
import {
  formatModifier,
  getAbilityModifier,
  type CharacterData,
} from "@/lib/character-types";

/**
 * Propiedades de la seccion de tiradas de salvacion.
 */
interface SavingThrowsProps {
  character: CharacterData;
  onChange: (updates: Partial<CharacterData>) => void;
  onRollSave: (
    saveName: string,
    modifiers: { label: string; value: number }[],
  ) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

/**
 * Muestra Fortaleza, Reflejos y Voluntad con sus modificadores y permite
 * lanzar cada salvacion desde la propia tarjeta.
 */
export function SavingThrows({
  character,
  onChange,
  onRollSave,
  isOpen,
  onToggle,
}: SavingThrowsProps) {
  const saves = [
    {
      name: "Fortaleza",
      subtitle: "Venenos, enfermedades y agotamiento",
      ability: "CON",
      abilityKey: "constitution" as const,
      baseKey: "fortitudeBase" as const,
      magicKey: "fortitudeMagic" as const,
      miscKey: "fortitudeMisc" as const,
    },
    {
      name: "Reflejos",
      subtitle: "Trampas, areas y explosiones",
      ability: "DEX",
      abilityKey: "dexterity" as const,
      baseKey: "reflexBase" as const,
      magicKey: "reflexMagic" as const,
      miscKey: "reflexMisc" as const,
    },
    {
      name: "Voluntad",
      subtitle: "Control mental y espiritual",
      ability: "WIS",
      abilityKey: "wisdom" as const,
      baseKey: "willBase" as const,
      magicKey: "willMagic" as const,
      miscKey: "willMisc" as const,
    },
  ];

  return (
    <SectionShell
      title="TIRADAS DE SALVACION"
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="space-y-4">
        {saves.map((save) => {
          const abilityMod = getAbilityModifier(character[save.abilityKey]);
          const baseSave = character[save.baseKey];
          const magicMod = character[save.magicKey];
          const miscMod = character[save.miscKey];
          const total = baseSave + abilityMod + magicMod + miscMod;

          const modifiers = [
            { label: "Base", value: baseSave },
            { label: save.ability, value: abilityMod },
            ...(magicMod !== 0 ? [{ label: "Magia", value: magicMod }] : []),
            ...(miscMod !== 0 ? [{ label: "Varios", value: miscMod }] : []),
          ];

          return (
            <div
              key={save.name}
              className="rounded-2xl border border-border/60 bg-secondary/25 p-4 shadow-[0_10px_24px_rgba(0,0,0,0.12)]"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <DiceButton
                    size="sm"
                    onClick={() =>
                      onRollSave(`Salvacion de ${save.name}`, modifiers)
                    }
                  />

                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-foreground">
                      {save.name}
                    </h3>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      {save.subtitle}
                    </p>
                  </div>
                </div>

                <div className="self-start rounded-xl border border-gold/15 bg-background/35 px-4 py-2.5 text-right lg:min-w-24">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Total
                  </p>
                  <p className="mt-1 text-2xl font-bold leading-none text-gold sm:text-3xl">
                    {formatModifier(total)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
                <label className="block">
                  <span className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Base
                  </span>
                  <input
                    type="number"
                    value={baseSave}
                    onChange={(e) =>
                      onChange({
                        [save.baseKey]: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl px-3 py-2 text-center text-base font-semibold"
                    title="Salvacion base"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {save.ability}
                  </span>
                  <div className="flex h-10.5 w-full items-center justify-center rounded-xl border border-border bg-input px-3 py-2 text-center text-base font-semibold text-foreground">
                    {formatModifier(abilityMod)}
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Magia
                  </span>
                  <input
                    type="number"
                    value={magicMod}
                    onChange={(e) =>
                      onChange({
                        [save.magicKey]: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl px-3 py-2 text-center text-base font-semibold"
                    title="Modificador de magia"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Varios
                  </span>
                  <input
                    type="number"
                    value={miscMod}
                    onChange={(e) =>
                      onChange({
                        [save.miscKey]: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl px-3 py-2 text-center text-base font-semibold"
                    title="Modificador variado"
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}
