import type { CharacterData } from "@/lib/character-types";
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
    <SectionShell title="EQUIPO Y DINERO" isOpen={isOpen} onToggle={onToggle}>
      {/* Money */}
      <div className="mb-4">
        <div className="text-xs text-muted-foreground mb-2">Dinero</div>
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <input
              type="number"
              value={character.money.platinum}
              onChange={(e) =>
                onChange({
                  money: {
                    ...character.money,
                    platinum: parseInt(e.target.value) || 0,
                  },
                })
              }
              className="w-full text-center rounded bg-input border border-border py-1"
              min={0}
            />
            <span className="text-xs text-muted-foreground">PP</span>
          </div>
          <div className="text-center">
            <input
              type="number"
              value={character.money.gold}
              onChange={(e) =>
                onChange({
                  money: {
                    ...character.money,
                    gold: parseInt(e.target.value) || 0,
                  },
                })
              }
              className="w-full text-center rounded bg-input border border-border py-1 text-gold"
              min={0}
            />
            <span className="text-xs text-gold">GP</span>
          </div>
          <div className="text-center">
            <input
              type="number"
              value={character.money.silver}
              onChange={(e) =>
                onChange({
                  money: {
                    ...character.money,
                    silver: parseInt(e.target.value) || 0,
                  },
                })
              }
              className="w-full text-center rounded bg-input border border-border py-1"
              min={0}
            />
            <span className="text-xs text-muted-foreground">SP</span>
          </div>
          <div className="text-center">
            <input
              type="number"
              value={character.money.copper}
              onChange={(e) =>
                onChange({
                  money: {
                    ...character.money,
                    copper: parseInt(e.target.value) || 0,
                  },
                })
              }
              className="w-full text-center rounded bg-input border border-border py-1"
              min={0}
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
