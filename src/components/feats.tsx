import type { CharacterData } from "@/lib/character-types";
import { SectionShell } from "./sectionShell";

/**
 * Propiedades de la seccion de dotes, habilidades especiales y notas.
 */
interface FeatsProps {
  character: CharacterData;
  onChange: (updates: Partial<CharacterData>) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

/**
 * Reune los textos libres del personaje, como dotes, rasgos especiales y
 * anotaciones de campana.
 */
export function Feats({ character, onChange, isOpen, onToggle }: FeatsProps) {
  return (
    <SectionShell
      title="DOTES Y HABILIDADES ESPECIALES"
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="space-y-4">
        {/* Feats */}
        <div>
          <div className="text-xs text-muted-foreground mb-2">Dotes</div>
          <textarea
            value={character.feats}
            onChange={(e) => onChange({ feats: e.target.value })}
            className="w-full h-32 rounded bg-input border border-border px-3 py-2 text-sm resize-none"
            placeholder="Escribe aqui tus dotes...&#10;&#10;- Ataque poderoso&#10;- Hendedura&#10;- Iniciativa mejorada"
          />
        </div>

        {/* Special Abilities */}
        <div>
          <div className="text-xs text-muted-foreground mb-2">
            Habilidades especiales
          </div>
          <textarea
            value={character.specialAbilities}
            onChange={(e) => onChange({ specialAbilities: e.target.value })}
            className="w-full h-32 rounded bg-input border border-border px-3 py-2 text-sm resize-none"
            placeholder="Escribe habilidades especiales, rasgos de clase y raciales...&#10;&#10;- Vision en la oscuridad 60 pies&#10;- Ira 1/dia&#10;- Movimiento rapido"
          />
        </div>

        {/* Notes */}
        <div>
          <div className="text-xs text-muted-foreground mb-2">Notas</div>
          <textarea
            value={character.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            className="w-full h-32 rounded bg-input border border-border px-3 py-2 text-sm resize-none"
            placeholder="Notas adicionales, trasfondo e informacion de campana..."
          />
        </div>
      </div>
    </SectionShell>
  );
}
