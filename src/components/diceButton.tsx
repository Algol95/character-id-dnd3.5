/**
 * Propiedades del boton reutilizable para lanzar dados rapidos.
 */
interface DiceButtonProps {
  onClick: () => void;
  size?: "sm" | "md";
  disabled?: boolean;
}

/**
 * Renderiza un boton compacto con icono de dado para lanzar tiradas desde
 * distintas secciones de la interfaz.
 */
export function DiceButton({
  onClick,
  size = "sm",
  disabled = false,
}: DiceButtonProps) {
  const sizeClasses = size === "sm" ? "w-6 h-6" : "w-8 h-8";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${sizeClasses} flex items-center justify-center rounded transition-all duration-200 
        bg-secondary hover:bg-gold/20 border border-gold-dim hover:border-gold
        text-gold-dim hover:text-gold disabled:opacity-50 disabled:cursor-not-allowed
        hover:shadow-[0_0_10px_var(--gold-dim)] active:scale-95`}
      title="Tirar dado"
      aria-label="Tirar dado"
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        {/* D20 icon */}
        <path d="M12 2L2 9l10 13 10-13L12 2zm0 3.84L18.26 9 12 18.54 5.74 9 12 5.84z" />
      </svg>
    </button>
  );
}
