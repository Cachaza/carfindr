// carfindr/src/app/search/Search.tsx
"use client";

import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { getBrands, getModels } from "@/app/actions/marcasModelos";
import CochesNetCars from "@/components/cochesNetCars";
import { useEffect, useState } from "react";
import WallapopCars from "@/components/wallapopCars";
import MilanunciosCars from "@/components/milanunciosCars";
import MobileFilterDrawer from "@/components/mobileMenu";
import PlatformBanner from "@/components/PlatformBanner"; // Import the new component

// ... (keep existing type definitions: Car, Modelo, SearchProps) ...
type Car = {
  label: string;
  cochesNetId: number;
  milanunciosId: string | null;
  wallapopId: string | null;
  cochesComId: string | null;
};

type Modelo = {
  cochesNetMarcaId: number;
  cochesNetModeloId: number;
  milanunciosMarcaId: string | null;
  milanunciosModeloId: string | null;
  wallapopMarcaId: string | null;
  wallapopModeloId: string | null;
  cochesComMarcaId: string | null;
  cochesComModeloId: string | null;
  label: string;
};

type SearchProps = {
  initialBrands: Car[];
};

async function getModelsInitial(brandId: string | null) {
  if (!brandId || brandId === 'All') return [];
  return await getModels(brandId);
}

export default function Search({ initialBrands }: SearchProps) {
  const searchParams = useSearchParams();

  const priceFrom = searchParams.get("priceFrom") ?? null;
  const priceTo = searchParams.get("priceTo") ?? null;
  const yearFrom = searchParams.get("yearFrom") ?? null;
  const yearTo = searchParams.get("yearTo") ?? null;
  const kmFrom = searchParams.get("kmFrom") ?? null;
  const kmTo = searchParams.get("kmTo") ?? null;
  const model = searchParams.get("model") ?? null;
  const brand = searchParams.get("brand") ?? null;
  const searchText = searchParams.get("searchText") ?? "";
  const brandId = searchParams.get("brandId") ?? null;
  const transmision = searchParams.get("transmision") ?? null;

  const [initialModels, setInitialModels] = useState<Modelo[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Start as true

  var cochesNetTransmissionTypeId: number | null = null;
  if (transmision === "automatic") {
    cochesNetTransmissionTypeId = 1;
  } else if (transmision === "manual") {
    cochesNetTransmissionTypeId = 2;
  } else {
    // Assuming 0 means 'any' or is handled correctly by the API if null isn't intended
    cochesNetTransmissionTypeId = 0; // Or null if the API expects null for 'any'
  }

  useEffect(() => {
    async function fetchInitialModels() {
      // Only set loading to true if brandId actually changes and requires fetching
      if(brandId && brandId !== 'All') {
          setIsLoading(true);
          const models = await getModelsInitial(brandId);
          setInitialModels(models);
          setIsLoading(false); // Set loading false after fetch completes
      } else {
          setInitialModels([]); // Clear models if no brand or 'All'
          setIsLoading(false); // Set loading false immediately if no fetch needed
      }
    }

    // Keep initial loading state until first check
    if(isLoading) {
        fetchInitialModels();
    } else {
        // Handle subsequent changes
        fetchInitialModels();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId]); // Dependency array

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      {/* Fixed position sidebar for desktop */}
      <div className="hide-scrollbar z-20 hidden md:fixed md:left-6 md:top-32 md:block md:h-[calc(100vh-9rem)] md:w-80 md:overflow-y-auto">
        <Sidebar
          brandIdProp={brandId}
          modelIdProp={searchParams.get("modelId") ?? null}
          priceFrom={priceFrom}
          priceTo={priceTo}
          yearFrom={yearFrom}
          yearTo={yearTo}
          kmFrom={kmFrom}
          kmTo={kmTo}
          searchTextProp={searchText}
          //getBrands={getBrands}
          getModels={getModels}
          brandProp={brand}
          modelProp={model}
          initialBrands={initialBrands}
          initialModels={initialModels}
          transmission={transmision}
        />
      </div>

      {/* Main content with left margin to accommodate sidebar on desktop */}
      <div className="mt-2 w-full flex-grow md:ml-[22rem] md:px-3">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-cyan-600"></div>
            <span className="ml-3 text-slate-700">Cargando resultados...</span>
          </div>
        ) : (
          <>
            {/* --- Platform Banner --- */}
            <PlatformBanner />

            {/* --- Results Container --- */}
            <div className="mx-auto mt-4 flex w-full max-w-5xl flex-col items-center justify-start gap-6">

              {/* --- Coches.net Results --- */}
              <div
                id="cochesnet-results" // <<< ADDED ID
                className="panel-glass w-full scroll-mt-24 border-white/80 p-4 md:p-6"
              >
                <h2 className="mb-4 flex items-center text-2xl text-slate-900">
                  Resultados de Coches.net
                </h2>
                <CochesNetCars
                  brandIdProp={searchParams.get("brandId") ?? null}
                  modelId={searchParams.get("modelId") ?? null}
                  priceFrom={priceFrom}
                  priceTo={priceTo}
                  yearFrom={yearFrom}
                  yearTo={yearTo}
                  kmFrom={kmFrom}
                  kmTo={kmTo}
                  searchTextProp={searchText}
                  transmissionTypeId={cochesNetTransmissionTypeId}
                />
              </div>

              {/* --- Wallapop Results --- */}
              <div
                id="wallapop-results" // <<< ADDED ID
                className="panel-glass w-full scroll-mt-24 border-white/80 p-4 md:p-6"
              >
                <h2 className="mb-4 flex items-center text-2xl text-slate-900">
                  Resultados de Wallapop
                </h2>
                <WallapopCars
                  yearFrom={yearFrom}
                  yearTo={yearTo}
                  priceFrom={priceFrom}
                  priceTo={priceTo}
                  kmFrom={kmFrom}
                  kmTo={kmTo}
                  searchTextProp={searchText}
                  model={model}
                  brand={brand}
                  gearbox={transmision}
                />
              </div>

              {/* --- Milanuncios Results --- */}
              <div
                id="milanuncios-results" // <<< ADDED ID
                className="panel-glass w-full scroll-mt-24 border-white/80 p-4 md:p-6"
              >
                <h2 className="mb-4 flex items-center text-2xl text-slate-900">
                  Resultados de Milanuncios
                </h2>
                <MilanunciosCars
                  yearFrom={yearFrom}
                  yearTo={yearTo}
                  priceFrom={priceFrom}
                  priceTo={priceTo}
                  kmFrom={kmFrom}
                  kmTo={kmTo}
                  searchTextProp={searchText}
                  model={model}
                  brand={brand}
                  transmission={transmision}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile menu, displayed only on mobile */}
       {/* Conditionally render MobileMenu outside the main content flow, maybe fixed at bottom? */}
       <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/60 bg-white/85 p-2 shadow-lg backdrop-blur-md md:hidden">
        <MobileFilterDrawer
          brandIdProp={brandId}
          modelIdProp={searchParams.get("modelId") ?? null}
          priceFrom={priceFrom}
          priceTo={priceTo}
          yearFrom={yearFrom}
          yearTo={yearTo}
          kmFrom={kmFrom}
          kmTo={kmTo}
          searchTextProp={searchText}
          getModels={getModels}
          brandProp={brand}
          modelProp={model}
          initialBrands={initialBrands}
          initialModels={initialModels}
          transmission={transmision}
        />
       </div>
    </div>
  );
}
