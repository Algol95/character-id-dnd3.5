import { useState } from "react";
import { DiceButton } from "./diceButton";
import { SectionShell } from "./sectionShell";
import { type CharacterData, type Attack } from "@/lib/character-types";

/**
 * Propiedades de la seccion de ataques personalizados.
 */
interface AttacksProps {
  character: CharacterData;
  onChange: (updates: Partial<CharacterData>) => void;
  onRollAttack: (
    attackName: string,
    modifiers: { label: string; value: number }[],
  ) => void;
  onRollDamage: (attackName: string, damage: string) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

/**
 * Permite administrar la lista de ataques del personaje y lanzar sus tiradas.
 */
export function Attacks({
  character,
  onChange,
  onRollAttack,
  onRollDamage,
  isOpen,
  onToggle,
}: AttacksProps) {
  const [newAttack, setNewAttack] = useState<Partial<Attack>>({
    name: "",
    attackBonus: 0,
    damage: "",
    critical: "x2",
    range: "",
    type: "",
    notes: "",
  });

  const addAttack = () => {
    if (!newAttack.name) return;

    const attack: Attack = {
      name: newAttack.name || "",
      attackBonus: newAttack.attackBonus || 0,
      damage: newAttack.damage || "",
      critical: newAttack.critical || "x2",
      range: newAttack.range || "",
      type: newAttack.type || "",
      notes: newAttack.notes || "",
    };

    onChange({ attacks: [...character.attacks, attack] });
    setNewAttack({
      name: "",
      attackBonus: 0,
      damage: "",
      critical: "x2",
      range: "",
      type: "",
      notes: "",
    });
  };

  const removeAttack = (index: number) => {
    const newAttacks = character.attacks.filter((_, i) => i !== index);
    onChange({ attacks: newAttacks });
  };

  const updateAttack = (index: number, updates: Partial<Attack>) => {
    const newAttacks = [...character.attacks];
    newAttacks[index] = { ...newAttacks[index], ...updates };
    onChange({ attacks: newAttacks });
  };

  return (
    <SectionShell title="ATAQUES" isOpen={isOpen} onToggle={onToggle}>
      {/* Attacks List */}
      <div className="space-y-2 mb-4">
        {character.attacks.map((attack, index) => (
          <div
            key={index}
            className="p-3 rounded bg-secondary/30 border border-border/50"
          >
            <div className="flex items-start gap-2">
              {/* Attack Roll */}
              <div className="flex flex-col items-center gap-1">
                <DiceButton
                  onClick={() =>
                    onRollAttack(attack.name, [
                      { label: "Ataque", value: attack.attackBonus },
                    ])
                  }
                  size="md"
                />
                <span className="text-xs text-muted-foreground">Atq</span>
              </div>

              {/* Damage Roll */}
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => onRollDamage(attack.name, attack.damage)}
                  className="w-8 h-8 flex items-center justify-center rounded transition-all duration-200 
                    bg-accent/20 hover:bg-accent/40 border border-accent/50 hover:border-accent
                    text-accent hover:shadow-[0_0_10px_var(--accent)] active:scale-95"
                  title="Tirar dano"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                    fill="currentColor"
                  >
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0-6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
                  </svg>
                </button>
                <span className="text-xs text-muted-foreground">Dano</span>
              </div>

              {/* Attack Details */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                <input
                  type="text"
                  value={attack.name}
                  onChange={(e) =>
                    updateAttack(index, { name: e.target.value })
                  }
                  className="col-span-2 md:col-span-1 text-sm rounded bg-input border border-border px-2 py-1"
                  placeholder="Nombre del arma"
                />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">+</span>
                  <input
                    type="number"
                    value={attack.attackBonus}
                    onChange={(e) =>
                      updateAttack(index, {
                        attackBonus: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-12 text-center text-sm rounded bg-input border border-border py-1"
                  />
                </div>
                <input
                  type="text"
                  value={attack.damage}
                  onChange={(e) =>
                    updateAttack(index, { damage: e.target.value })
                  }
                  className="text-sm rounded bg-input border border-border px-2 py-1"
                  placeholder="1d8+3"
                />
                <input
                  type="text"
                  value={attack.critical}
                  onChange={(e) =>
                    updateAttack(index, { critical: e.target.value })
                  }
                  className="text-sm rounded bg-input border border-border px-2 py-1"
                  placeholder="19-20/x2"
                />
              </div>

              {/* Remove button */}
              <button
                onClick={() => removeAttack(index)}
                className="text-muted-foreground hover:text-blood-red transition-colors p-1"
                title="Eliminar ataque"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Extra fields */}
            <div className="mt-2 grid grid-cols-3 gap-2">
              <input
                type="text"
                value={attack.range}
                onChange={(e) => updateAttack(index, { range: e.target.value })}
                className="text-xs rounded bg-input/50 border border-border/50 px-2 py-1"
                placeholder="Alcance"
              />
              <input
                type="text"
                value={attack.type}
                onChange={(e) => updateAttack(index, { type: e.target.value })}
                className="text-xs rounded bg-input/50 border border-border/50 px-2 py-1"
                placeholder="Tipo (P/S/B)"
              />
              <input
                type="text"
                value={attack.notes}
                onChange={(e) => updateAttack(index, { notes: e.target.value })}
                className="text-xs rounded bg-input/50 border border-border/50 px-2 py-1"
                placeholder="Notas"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Add New Attack */}
      <div className="p-3 rounded bg-secondary/20 border border-dashed border-border/50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
          <input
            type="text"
            value={newAttack.name}
            onChange={(e) =>
              setNewAttack({ ...newAttack, name: e.target.value })
            }
            className="col-span-2 md:col-span-1 text-sm rounded bg-input border border-border px-2 py-1"
            placeholder="Nueva arma..."
          />
          <input
            type="number"
            value={newAttack.attackBonus}
            onChange={(e) =>
              setNewAttack({
                ...newAttack,
                attackBonus: parseInt(e.target.value) || 0,
              })
            }
            className="text-sm rounded bg-input border border-border px-2 py-1"
            placeholder="Ataque +X"
          />
          <input
            type="text"
            value={newAttack.damage}
            onChange={(e) =>
              setNewAttack({ ...newAttack, damage: e.target.value })
            }
            className="text-sm rounded bg-input border border-border px-2 py-1"
            placeholder="Dano"
          />
          <button
            onClick={addAttack}
            disabled={!newAttack.name}
            className="text-sm rounded bg-gold/20 border border-gold/50 hover:bg-gold/30 
              text-gold disabled:opacity-50 disabled:cursor-not-allowed transition-colors py-1"
          >
            + Anadir ataque
          </button>
        </div>
      </div>
    </SectionShell>
  );
}
