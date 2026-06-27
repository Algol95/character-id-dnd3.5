import type { ReactNode } from "react";

/**
 * Propiedades compartidas por la carcasa visual que envuelve cada seccion.
 */
interface SectionShellProps {
  title: string;
  isOpen?: boolean;
  onToggle?: () => void;
  headerDivider?: boolean;
  children: ReactNode;
}

/**
 * Muestra el control de plegado y desplegado de una seccion reutilizable.
 */
function SectionToggleButton({
  title,
  isOpen,
  onToggle,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-label={`${isOpen ? "Ocultar" : "Desplegar"} ${title}`}
      title={`${isOpen ? "Ocultar" : "Desplegar"} ${title}`}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/30 text-muted-foreground transition-all duration-300 hover:border-gold/30 hover:bg-gold/10 hover:text-foreground"
    >
      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          d="M5 7.5 10 12.5 15 7.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

/**
 * Aporta una estructura visual comun a las secciones de la hoja y opcionalmente
 * permite plegarlas con animacion.
 */
export function SectionShell({
  title,
  isOpen = true,
  onToggle,
  headerDivider = false,
  children,
}: SectionShellProps) {
  const isCollapsible = typeof onToggle === "function";
  const isExpanded = isCollapsible ? isOpen : true;
  const headerSpacing = isExpanded
    ? headerDivider
      ? "mb-5 border-b border-border/60 pb-3"
      : "mb-5"
    : "";

  return (
    <div className="gold-border rounded-[22px] p-5 parchment-bg">
      <div
        className={`flex items-center justify-between gap-3 ${headerSpacing}`}
      >
        <h2 className="text-base font-semibold uppercase tracking-[0.26em] text-gold/90">
          {title}
        </h2>

        {isCollapsible ? (
          <SectionToggleButton
            title={title}
            isOpen={isExpanded}
            onToggle={onToggle}
          />
        ) : null}
      </div>

      <div
        aria-hidden={isCollapsible ? !isExpanded : undefined}
        className={`min-w-0 grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out ${isExpanded ? "grid-rows-[1fr] overflow-visible opacity-100" : "grid-rows-[0fr] overflow-hidden opacity-0"}`}
      >
        <div
          className={`min-h-0 min-w-0 ${isExpanded ? "overflow-visible" : "overflow-hidden"}`}
        >
          <div
            className={`min-w-0 transition-transform duration-300 ease-out ${isExpanded ? "translate-y-0" : "-translate-y-2"}`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
