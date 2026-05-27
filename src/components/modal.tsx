import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  overlayClassName?: string;
  panelClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
}

/**
 * Componente de modal reutilizable con estilo de fantasia oscura, que incluye opciones para cerrar al hacer clic fuera o presionar Escape, y permite personalizar el contenido del encabezado, cuerpo y pie de página.
 * @param open Indica si el modal está abierto o cerrado
 * @param onClose Función que se llama para cerrar el modal
 * @param children Contenido principal del modal
 * @param header Contenido opcional para el encabezado del modal
 * @param footer Contenido opcional para el pie de página del modal
 * @param closeOnBackdrop Si es true, el modal se cerrará al hacer clic en el fondo (default: true)
 * @param closeOnEscape Si es true, el modal se cerrará al presionar la tecla Escape (default: true)
 * @param overlayClassName Clases adicionales para el fondo del modal
 * @param panelClassName Clases adicionales para el panel del modal
 * @param headerClassName Clases adicionales para el encabezado del modal
 * @param bodyClassName Clases adicionales para el cuerpo del modal
 * @param footerClassName Clases adicionales para el pie de página del modal
 * @returns Un modal estilizado que se muestra sobre el contenido principal, con opciones de personalización y comportamiento de cierre configurables.
 */
export function Modal({
  open,
  onClose,
  children,
  header,
  footer,
  closeOnBackdrop = true,
  closeOnEscape = true,
  overlayClassName,
  panelClassName,
  headerClassName,
  bodyClassName,
  footerClassName,
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEscape) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [closeOnEscape, onClose, open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        className={cn(
          "absolute inset-0 bg-black/78 backdrop-blur-sm",
          overlayClassName,
        )}
      />

      <div
        className={cn(
          "gold-border parchment-bg relative z-10 flex max-h-[calc(100vh-3rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[30px]",
          panelClassName,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {header ? (
          <div
            className={cn(
              "shrink-0 border-b border-border/50 px-6 py-6 md:px-7 md:py-7",
              headerClassName,
            )}
          >
            {header}
          </div>
        ) : null}

        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto px-6 py-5 md:px-7 md:py-6",
            bodyClassName,
          )}
        >
          {children}
        </div>

        {footer ? (
          <div
            className={cn(
              "shrink-0 border-t border-border/50 px-6 py-4 md:px-7",
              footerClassName,
            )}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
