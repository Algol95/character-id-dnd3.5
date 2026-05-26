import type { ChangeEventHandler } from "react";

/**
 * Propiedades del encabezado principal de la aplicacion.
 */
interface HeaderProps {
  saveStatus: "saved" | "saving" | "error";
  onExport: () => void;
  onImport: ChangeEventHandler<HTMLInputElement>;
  onReset: () => void;
}

/**
 * Presenta el encabezado de la hoja con el estado de guardado y las acciones
 * principales de exportacion, importacion y reinicio.
 */
export function Header({
  saveStatus,
  onExport,
  onImport,
  onReset,
}: HeaderProps) {
  const statusStyles =
    saveStatus === "saved"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : saveStatus === "saving"
        ? "border-gold/30 bg-gold/10 text-gold"
        : "border-blood-red/30 bg-blood-red/10 text-blood-red";

  const statusLabel =
    saveStatus === "saved"
      ? "Guardado"
      : saveStatus === "saving"
        ? "Guardando..."
        : "Error";

  return (
    <header className="sticky top-0 z-40 mb-6">
      <div className="max-w-7xl mx-auto rounded-2xl border border-border/80 bg-card/92 shadow-[0_12px_35px_rgba(0,0,0,0.22)] backdrop-blur-sm">
        <div className="px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3 min-w-0">
              <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-sm font-bold tracking-[0.2em] text-gold shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                D20
              </div>

              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.28em] text-gold/80">
                  D&amp;D 3.5
                </p>
                <h1 className="mt-1 text-xl sm:text-2xl font-bold text-foreground tracking-wide">
                  Hoja de personaje
                </h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Haz clic en los iconos de dado para tirar, editar tus datos y
                  guardar todo automaticamente en el navegador.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusStyles}`}
                >
                  Estado: {statusLabel}
                </span>
                <span className="inline-flex items-center rounded-full border border-border/70 bg-background/55 px-3 py-1 text-xs text-muted-foreground">
                  Formato JSON
                </span>
                <span className="inline-flex items-center rounded-full border border-border/70 bg-background/55 px-3 py-1 text-xs text-muted-foreground">
                  Guardado local
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:min-w-[440px]">
                <button
                  onClick={onExport}
                  className="inline-flex items-center justify-center rounded-xl border border-border bg-background/70 px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-gold/40 hover:text-gold"
                >
                  Exportar ficha
                </button>

                <label className="inline-flex items-center justify-center rounded-xl border border-border bg-background/70 px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-gold/40 hover:text-gold cursor-pointer">
                  Importar ficha
                  <input
                    type="file"
                    accept=".json"
                    onChange={onImport}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={onReset}
                  className="inline-flex items-center justify-center rounded-xl border border-blood-red/30 bg-blood-red/10 px-4 py-2.5 text-sm font-medium text-blood-red transition hover:border-blood-red hover:bg-blood-red/15"
                >
                  Reiniciar ficha
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
