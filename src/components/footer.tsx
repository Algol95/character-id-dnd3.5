const PAYPAL_DONATION_URL =
  "https://www.paypal.com/donate/?hosted_button_id=QJN5GC68D6S2C";

/**
 * Renderiza el icono de PayPal usado en el bloque de donacion del pie.
 */
function PaypalIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M7.4 4.5h6.35c2.53 0 4.37.55 5.12 1.95.43.8.5 1.82.17 3-.62 2.3-2.4 3.5-5.14 3.5H11.9c-.54 0-.92.18-1.03.78l-1.15 6.77H5.9l1.95-11.58c.08-.54.47-.82.98-.82h.95l.2-1.22c.08-.52.4-.8.96-.8h.46Z"
      />
      <path
        fill="currentColor"
        opacity="0.7"
        d="M10.78 6.95h4.18c1.74 0 2.95.32 3.47 1.08.35.5.4 1.2.16 2.05-.46 1.7-1.78 2.6-3.95 2.6h-1.46c-.43 0-.7.14-.8.62l-.98 5.75H8.46l1.45-8.58c.08-.48.36-.73.87-.73h.52l.13-.8c.08-.46.34-.7.82-.7h.53Z"
      />
    </svg>
  );
}

/**
 * Dibuja un icono de corazon de apoyo para reforzar el mensaje de donacion.
 */
function HeartOutline({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 20.5s-6.5-4.14-8.53-8.01C1.97 9.62 3.02 6.5 6.4 6.5c2.07 0 3.16 1.13 3.83 2.26.67-1.13 1.76-2.26 3.83-2.26 3.38 0 4.43 3.12 2.93 5.99C18.5 16.36 12 20.5 12 20.5Z" />
    </svg>
  );
}

/**
 * Cierra la aplicacion con informacion resumida de la herramienta y el bloque
 * de donacion por PayPal.
 */
export function Footer() {
  const hasPaypalLink = PAYPAL_DONATION_URL.trim().length > 0;

  return (
    <footer className="max-w-7xl mx-auto mt-12 border-t border-gold/15 pt-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
        <section className="rounded-2xl border border-border/80 bg-card/70 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
              <span className="text-sm font-bold tracking-[0.2em]">D20</span>
            </div>

            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.28em] text-gold/80">
                Hoja interactiva
              </p>
              <h3 className="mt-1 text-lg font-semibold text-foreground sm:text-xl">
                Personaje de D&amp;D 3.5 listo para jugar
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Tu ficha, ataques, habilidades y tiradas se gestionan desde una
                sola pantalla. Los cambios se guardan en este navegador y puedes
                exportarlos cuando quieras.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-border bg-background/60 px-4 py-2 text-sm text-foreground">
              Guardado automatico
            </span>
            <span className="inline-flex items-center rounded-full border border-border bg-background/60 px-4 py-2 text-sm text-foreground">
              Exportacion JSON
            </span>
            <span className="inline-flex items-center rounded-full border border-border bg-background/60 px-4 py-2 text-sm text-foreground">
              Tiradas integradas
            </span>
          </div>

          <div className="mt-6 border-t border-border/80 pt-5 text-sm leading-6 text-muted-foreground">
            Los datos se almacenan localmente en el navegador hasta que los
            exportes, los reemplaces con una importacion o reinicies la ficha.
          </div>
        </section>

        <aside className="rounded-[22px] border border-[#285286] bg-[#13355a] p-6 text-white shadow-[0_14px_45px_rgba(0,0,0,0.25)]">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#7db9f5]">
              <PaypalIcon className="h-5 w-5" />
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9fcbff]">
                Paypal
              </p>
              <h3 className="mt-1 text-[1.65rem] leading-none font-semibold sm:text-[1.75rem]">
                Apoya el proyecto
              </h3>
            </div>
          </div>

          <p className="mt-5 text-[15px] leading-8 text-slate-100">
            Si esta hoja te resulta util en tus partidas, puedes ayudar a
            mantener y mejorar la aplicacion con una donacion por PayPal.
          </p>

          <div className="mt-5 flex items-start gap-3 text-[15px] leading-7 text-slate-100">
            <HeartOutline className="mt-1 h-4 w-4 shrink-0 text-[#9fcbff]" />
            <p>
              Tu apoyo ayuda a seguir iterando la herramienta, pulir detalles y
              mantenerla online.
            </p>
          </div>

          {hasPaypalLink ? (
            <a
              href={PAYPAL_DONATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ffc439] px-4 py-3.5 text-sm font-semibold text-[#111827] transition hover:bg-[#ffcf5a]"
            >
              <PaypalIcon className="h-4 w-4" />
              Donar con PayPal
            </a>
          ) : (
            <div className="mt-7 rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-sm text-slate-200">
              La donacion por PayPal no esta disponible ahora mismo.
            </div>
          )}
        </aside>
      </div>
    </footer>
  );
}
