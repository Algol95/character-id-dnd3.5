import type { CharacterData } from "@/lib/character-types";
import { FormNumberInput } from "@/components/formNumberInput";
import { FormSelect, type FormSelectOption } from "@/components/formSelect";
import { SectionShell } from "./sectionShell";

const ALIGNMENT_OPTIONS: FormSelectOption[] = [
  { value: "", label: "Selecciona..." },
  { value: "LG", label: "Legal bueno" },
  { value: "NG", label: "Neutral bueno" },
  { value: "CG", label: "Caotico bueno" },
  { value: "LN", label: "Legal neutral" },
  { value: "N", label: "Neutral verdadero" },
  { value: "CN", label: "Caotico neutral" },
  { value: "LE", label: "Legal maligno" },
  { value: "NE", label: "Neutral maligno" },
  { value: "CE", label: "Caotico maligno" },
];

const SIZE_OPTIONS: FormSelectOption[] = [
  { value: "Fine", label: "Diminuto" },
  { value: "Diminutive", label: "Minimo" },
  { value: "Tiny", label: "Muy pequeno" },
  { value: "Small", label: "Pequeno" },
  { value: "Medium", label: "Mediano" },
  { value: "Large", label: "Grande" },
  { value: "Huge", label: "Enorme" },
  { value: "Gargantuan", label: "Gargantuesco" },
  { value: "Colossal", label: "Colosal" },
];

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
          <FormNumberInput
            value={character.level}
            onChange={(value) => onChange({ level: parseInt(value, 10) || 1 })}
            className="w-full"
            inputClassName="rounded px-2 py-2"
            min={1}
            ariaLabel="Nivel"
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
          <FormSelect
            value={character.alignment}
            onChange={(value: string) => onChange({ alignment: value })}
            options={ALIGNMENT_OPTIONS}
            ariaLabel="Seleccionar alineamiento"
          />
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
          <FormSelect
            value={character.size}
            onChange={(value: string) => onChange({ size: value })}
            options={SIZE_OPTIONS}
            ariaLabel="Seleccionar tamano"
          />
        </div>

        {/* Age */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1">
            Edad
          </label>
          <FormNumberInput
            value={character.age || ""}
            onChange={(value) => onChange({ age: parseInt(value, 10) || 0 })}
            className="w-full"
            inputClassName="rounded px-2 py-2"
            placeholder="25"
            ariaLabel="Edad"
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
