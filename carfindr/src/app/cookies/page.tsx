import { type Metadata } from "next";
import { CookiePreferencesButton } from "@/components/CookiePreferencesButton";

export const metadata: Metadata = {
  title: "Politica de Cookies | MotorFindr",
  description: "Informacion sobre el uso de cookies y analitica en MotorFindr.",
};

export default function CookiesPage() {
  return (
    <section className="mx-auto w-full max-w-3xl space-y-8 py-8 text-slate-800">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-slate-900">Politica de Cookies</h1>
        <p className="text-sm text-slate-600">Ultima actualizacion: 04/03/2026</p>
      </header>

      <div className="space-y-6 text-sm leading-6 sm:text-base">
        <section className="space-y-2">
          <h2 className="text-xl font-medium text-slate-900">1. Que son las cookies</h2>
          <p>
            Las cookies son pequenos archivos que se almacenan en tu navegador para recordar informacion sobre
            tu visita.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-medium text-slate-900">2. Que cookies usamos</h2>
          <p>En MotorFindr (motorfindr.app) usamos:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Cookies tecnicas necesarias para autenticacion y funcionamiento de la aplicacion.</li>
            <li>
              Cookies de analitica para medir el uso del servicio y mejorar producto (PostHog), solo con
              consentimiento.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-medium text-slate-900">3. Base legal</h2>
          <p>
            Las cookies de analitica se activan unicamente cuando das tu consentimiento mediante el banner de
            cookies. Si rechazas, se desactiva la captura analitica.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-medium text-slate-900">4. Como cambiar tu preferencia</h2>
          <p>
            Puedes reabrir el panel de consentimiento desde el boton "Cambiar cookies" del pie de pagina.
            Tambien puedes hacerlo desde aqui:
          </p>
          <CookiePreferencesButton className="h-9 rounded-md border border-slate-200 px-3 text-sm text-slate-700 hover:bg-slate-100" />
        </section>
      </div>
    </section>
  );
}
