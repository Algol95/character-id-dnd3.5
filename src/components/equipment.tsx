import type { CharacterData } from "@/lib/character-types";
import { FormNumberInput } from "@/components/formNumberInput";
import { SectionShell } from "./sectionShell";

/**
 * Propiedades de la seccion de equipo y dinero.
 */
interface EquipmentProps {
  character: CharacterData;
  onChange: (updates: Partial<CharacterData>) => void;
  isOpen?: boolean;
  onToggle?: () => void;
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
      </div>

      {/* Equipment List */}
      <div>
        <div className="text-xs text-muted-foreground mb-2">Equipo</div>
        <textarea
          value={character.equipment}
          onChange={(e) => onChange({ equipment: e.target.value })}
          className="w-full h-40 rounded bg-input border border-border px-3 py-2 text-sm resize-none"
          placeholder="Escribe aqui tu equipo...&#10;&#10;- Espada larga&#10;- Cota de mallas&#10;- Mochila&#10;- Cuerda (50 pies)&#10;- Antorchas (10)"
        />
      </div>
    </SectionShell>
  );
}
