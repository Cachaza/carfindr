import { Suspense } from 'react';
import SearchCard from "@/components/searchCard";
import { getBrands, getModels } from "./actions/marcasModelos";

export default async function HomePage() {
  const carsIdData = await getBrands();

  return (
    <main className="flex min-h-[calc(100vh-8rem)] items-start justify-center py-8 md:py-12">
      <section className="w-full max-w-4xl">
        <Suspense fallback={<div className="panel-glass p-8 text-center text-slate-600">Cargando opciones de busqueda...</div>}>
          <SearchCard brands={carsIdData} getModels={getModels} />
        </Suspense>
      </section>
    </main>
  );
}
