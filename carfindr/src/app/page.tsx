import { Suspense } from 'react';
import SearchCard from "@/components/searchCard";
import { getBrands, getModels } from "./actions/marcasModelos";

export default async function HomePage() {
  const carsIdData = await getBrands();

  return (
    <main className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-start py-8 px-4 sm:px-6 md:py-12 lg:px-8 bg-gray-50/50">
      <div className="mb-8 text-center max-w-2xl mx-auto space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Busca tu próximo coche</h1>
        <p className="text-lg text-slate-600">Encuentra los mejores precios en todas las plataformas a la vez.</p>
      </div>
      <section className="w-full max-w-5xl rounded-3xl shadow-sm border border-slate-200 bg-white p-4 sm:p-6 md:p-8">
        <Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse">Cargando opciones de búsqueda...</div>}>
          <SearchCard brands={carsIdData} getModels={getModels} />
        </Suspense>
      </section>
    </main>
  );
}
