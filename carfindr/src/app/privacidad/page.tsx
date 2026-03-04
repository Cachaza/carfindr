import { type Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politica de Privacidad | MotorFindr",
  description: "Informacion sobre el tratamiento de datos personales en MotorFindr.",
};

export default function PrivacyPage() {
  return (
    <section className="mx-auto w-full max-w-3xl space-y-8 py-8 text-slate-800">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-slate-900">Politica de Privacidad</h1>
        <p className="text-sm text-slate-600">Ultima actualizacion: 04/03/2026</p>
      </header>

      <div className="space-y-6 text-sm leading-6 sm:text-base">
        <section className="space-y-2">
          <h2 className="text-xl font-medium text-slate-900">1. Responsable del tratamiento</h2>
          <p>
            El responsable del tratamiento de los datos personales recabados en MotorFindr es la entidad gestora
            del servicio MotorFindr (dominio operativo: motorfindr.app). Para cuestiones relacionadas con
            privacidad puedes contactar en <strong>send@motorfindr.cachaza.cc</strong>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-medium text-slate-900">2. Datos que tratamos</h2>
          <p>Podemos tratar las siguientes categorias de datos:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Datos de cuenta (email, nombre de usuario y credenciales de acceso).</li>
            <li>Datos funcionales de uso (busquedas guardadas y configuracion de alertas).</li>
            <li>Datos de analitica de uso (eventos, interacciones y datos tecnicos del dispositivo).</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-medium text-slate-900">3. Finalidades y base legal</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Prestar el servicio solicitado por el usuario (ejecucion del contrato).</li>
            <li>Gestionar la seguridad de la cuenta y prevenir abusos (interes legitimo).</li>
            <li>
              Medir uso y mejorar producto mediante cookies de analitica (consentimiento del usuario).
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-medium text-slate-900">4. Proveedores y transferencias</h2>
          <p>
            Para la analitica utilizamos PostHog (servicio de terceros). El tratamiento puede implicar acceso a
            datos tecnicos e identificadores de sesion. Se prioriza la configuracion en region UE cuando esta
            disponible. Puedes consultar mas detalle en nuestra {" "}
            <Link href="/cookies" className="underline underline-offset-2">
              Politica de Cookies
            </Link>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-medium text-slate-900">5. Conservacion de datos</h2>
          <p>
            Conservamos los datos durante el tiempo necesario para prestar el servicio y cumplir obligaciones
            legales. Los datos de analitica se conservan por el periodo configurado en la herramienta de
            analitica.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-medium text-slate-900">6. Derechos de las personas usuarias</h2>
          <p>
            Puedes ejercer tus derechos de acceso, rectificacion, supresion, oposicion, limitacion y portabilidad,
            asi como retirar el consentimiento para cookies de analitica en cualquier momento desde el boton
            "Cambiar cookies" disponible en el pie de pagina.
          </p>
        </section>
      </div>
    </section>
  );
}
