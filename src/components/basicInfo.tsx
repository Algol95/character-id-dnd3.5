import type { CharacterData } from "@/lib/character-types";
import { SectionShell } from "./sectionShell";

/**
 * Propiedades de la seccion de informacion general del personaje.
 */
interface BasicInfoProps {
  character: CharacterData;
  onChange: (updates: Partial<CharacterData>) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

/**
 * Presenta y edita los datos base del personaje, como identidad, clase,
 * raza y rasgos descriptivos.
 */
export function BasicInfo({
  character,
  onChange,
  isOpen,
  onToggle,
}: BasicInfoProps) {
  return (
    <SectionShell
      title="INFORMACION DEL PERSONAJE"
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* Character Name */}
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground block mb-1">
            Nombre del personaje
          </label>
          <input
            type="text"
            value={character.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="w-full text-lg font-semibold rounded bg-input border border-border px-3 py-2"
            placeholder="Introduce el nombre..."
          />
        </div>

        {/* Player Name */}
        <div className="col-span-2 md:col-span-1">
          <label className="text-xs text-muted-foreground block mb-1">
            Jugador
          </label>
          <input
            type="text"
            value={character.player}
            onChange={(e) => onChange({ player: e.target.value })}
            className="w-full rounded bg-input border border-border px-2 py-2"
            placeholder="Nombre del jugador"
          />
        </div>

        {/* Class */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1">
            Clase
          </label>
          <input
            type="text"
            value={character.class}
            onChange={(e) => onChange({ class: e.target.value })}
            className="w-full rounded bg-input border border-border px-2 py-2"
            placeholder="Guerrero"
          />
        </div>

        {/* Level */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1">
            Nivel
          </label>
          <input
            type="number"
            value={character.level}
            onChange={(e) => onChange({ level: parseInt(e.target.value) || 1 })}
            className="w-full rounded bg-input border border-border px-2 py-2"
            min={1}
          />
        </div>

        {/* Race */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1">
            Raza
          </label>
          <input
            type="text"
            value={character.race}
            onChange={(e) => onChange({ race: e.target.value })}
            className="w-full rounded bg-input border border-border px-2 py-2"
            placeholder="Humano"
          />
        </div>

        {/* Alignment */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1">
            Alineamiento
          </label>
          <select
            value={character.alignment}
            onChange={(e) => onChange({ alignment: e.target.value })}
            className="w-full rounded bg-input border border-border px-2 py-2"
          >
            <option value="">Selecciona...</option>
            <option value="LG">Legal bueno</option>
            <option value="NG">Neutral bueno</option>
            <option value="CG">Caotico bueno</option>
            <option value="LN">Legal neutral</option>
            <option value="N">Neutral verdadero</option>
            <option value="CN">Caotico neutral</option>
            <option value="LE">Legal maligno</option>
            <option value="NE">Neutral maligno</option>
            <option value="CE">Caotico maligno</option>
          </select>
        </div>

        {/* Deity */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1">
            Deidad
          </label>
          <input
            type="text"
            value={character.deity}
            onChange={(e) => onChange({ deity: e.target.value })}
            className="w-full rounded bg-input border border-border px-2 py-2"
            placeholder="Ninguna"
          />
        </div>

        {/* Size */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1">
            Tamano
          </label>
          <select
            value={character.size}
            onChange={(e) => onChange({ size: e.target.value })}
            className="w-full rounded bg-input border border-border px-2 py-2"
          >
            <option value="Fine">Diminuto</option>
            <option value="Diminutive">Minimo</option>
            <option value="Tiny">Muy pequeno</option>
            <option value="Small">Pequeno</option>
            <option value="Medium">Mediano</option>
            <option value="Large">Grande</option>
            <option value="Huge">Enorme</option>
            <option value="Gargantuan">Gargantuesco</option>
            <option value="Colossal">Colosal</option>
          </select>
        </div>

        {/* Age */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1">
            Edad
          </label>
          <input
            type="number"
            value={character.age || ""}
            onChange={(e) => onChange({ age: parseInt(e.target.value) || 0 })}
            className="w-full rounded bg-input border border-border px-2 py-2"
            placeholder="25"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1">
            Genero
          </label>
          <input
            type="text"
            value={character.gender}
            onChange={(e) => onChange({ gender: e.target.value })}
            className="w-full rounded bg-input border border-border px-2 py-2"
            placeholder="Masculino"
          />
        </div>

        {/* Height */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1">
            Altura
          </label>
          <input
            type="text"
            value={character.height}
            onChange={(e) => onChange({ height: e.target.value })}
            className="w-full rounded bg-input border border-border px-2 py-2"
            placeholder={`5'10"`}
          />
        </div>

        {/* Weight */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1">
            Peso
          </label>
          <input
            type="text"
            value={character.weight}
            onChange={(e) => onChange({ weight: e.target.value })}
            className="w-full rounded bg-input border border-border px-2 py-2"
            placeholder="180 lb"
          />
        </div>

        {/* Eyes */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1">
            Ojos
          </label>
          <input
            type="text"
            value={character.eyes}
            onChange={(e) => onChange({ eyes: e.target.value })}
            className="w-full rounded bg-input border border-border px-2 py-2"
            placeholder="Marrones"
          />
        </div>

        {/* Hair */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1">
            Pelo
          </label>
          <input
            type="text"
            value={character.hair}
            onChange={(e) => onChange({ hair: e.target.value })}
            className="w-full rounded bg-input border border-border px-2 py-2"
            placeholder="Negro"
          />
        </div>

        {/* Skin */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1">
            Piel
          </label>
          <input
            type="text"
            value={character.skin}
            onChange={(e) => onChange({ skin: e.target.value })}
            className="w-full rounded bg-input border border-border px-2 py-2"
            placeholder="Morena"
          />
        </div>
      </div>
    </SectionShell>
  );
}
