"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Filter, Save, X, Search, RotateCcw } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

export type FilterOption = {
  value: string;
  label: string;
};

// Import the same types from your sidebar
type Marca = {
  label: string;
  cochesNetId: number;
  milanunciosId: string | null;
  wallapopId: string | null;
  cochesComId: string | null;
};

type Modelo = {
  label: string;
  cochesNetMarcaId: number;
  cochesNetModeloId: number;
  milanunciosMarcaId: string | null;
  milanunciosModeloId: string | null;
  wallapopMarcaId: string | null;
  wallapopModeloId: string | null;
  cochesComMarcaId: string | null;
  cochesComModeloId: string | null;
};

const INVALID_SOURCE_VALUES = new Set([
  "",
  "none",
  "null",
  "undefined",
  "nan",
  "n/a",
]);

const normalizeNullableValue = (value: string | null | undefined) => {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (INVALID_SOURCE_VALUES.has(trimmed.toLowerCase())) return null;

  return trimmed;
};

const getModelDisplayLabel = (model: Modelo) => {
  return (
    normalizeNullableValue(model.label) ??
    normalizeNullableValue(model.wallapopModeloId) ??
    normalizeNullableValue(model.milanunciosModeloId) ??
    `Model ${model.cochesNetModeloId}`
  );
};

type Props = {
  getModels: (brandId: string) => Promise<Modelo[]>;
  brandIdProp: string | null;
  modelIdProp: string | null;
  yearFrom: string | null;
  yearTo: string | null;
  priceFrom: string | null;
  priceTo: string | null;
  kmFrom: string | null;
  kmTo: string | null;
  searchTextProp: string | undefined;
  brandProp: string | null;
  modelProp: string | null;
  initialBrands: Marca[];
  initialModels: Modelo[];
  transmission: string | null;
};

// Same constants as in Sidebar
const kmRange = [
  2500, 5000, 7500, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000,
  50000, 60000, 70000, 80000, 90000, 100000, 120000, 140000, 160000, 180000,
  200000,
];

const currentYear = new Date().getFullYear();
const yearOptions: FilterOption[] = Array.from(
  { length: currentYear - 1949 + 1 },
  (_, i) => {
    const year = currentYear - i;
    return { value: year.toString(), label: year.toString() };
  }
);

const priceRange = [
  ...Array.from({ length: 4 }, (_, i) => (i + 1) * 250),
  ...Array.from({ length: 9 }, (_, i) => (i + 1) * 1000 + 1000),
  ...Array.from({ length: 9 }, (_, i) => (i + 1) * 10000 + 10000),
  150000,
  200000,
];

const priceOptions: FilterOption[] = priceRange.map((p) => ({
  value: p.toString(),
  label: p.toLocaleString() + " €",
}));

const kmOptions: FilterOption[] = kmRange.map((km) => ({
  value: km.toString(),
  label: km.toLocaleString() + " km",
}));

const transmissionOptions: FilterOption[] = [
  { value: "manual", label: "Manual" },
  { value: "automatic", label: "Automático" },
];

export default function MobileFilterDrawer({
  getModels,
  brandIdProp,
  modelIdProp,
  yearFrom,
  yearTo,
  priceFrom,
  priceTo,
  kmFrom,
  kmTo,
  searchTextProp,
  brandProp,
  modelProp,
  initialBrands,
  initialModels,
  transmission,
}: Props) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const saveSearchMutation = api.savedSearch.saveSearch.useMutation();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filter states (same as Sidebar)
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(
    brandIdProp
  );
  const [selectedModelId, setSelectedModelId] = useState<string | null>(
    modelIdProp
  );
  const [selectedYearFrom, setSelectedYearFrom] = useState<string | null>(
    yearFrom
  );
  const [selectedYearTo, setSelectedYearTo] = useState<string | null>(yearTo);
  const [selectedPriceFrom, setSelectedPriceFrom] = useState<string | null>(
    priceFrom
  );
  const [selectedPriceTo, setSelectedPriceTo] = useState<string | null>(
    priceTo
  );
  const [selectedKmFrom, setSelectedKmFrom] = useState<string | null>(kmFrom);
  const [selectedKmTo, setSelectedKmTo] = useState<string | null>(kmTo);
  const [selectedTransmission, setSelectedTransmission] = useState<
    string | null
  >(transmission);
  const [searchText, setSearchText] = useState(searchTextProp ?? "");

  const [brands] = useState<Marca[]>(initialBrands);
  const [models, setModels] = useState<Modelo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [selectedBrandParam, setSelectedBrandParam] = useState<string | null>(
    brandProp
  );
  const [selectedModelParam, setSelectedModelParam] = useState<string | null>(
    modelProp
  );

  // Same effects and handlers as Sidebar
  useEffect(() => {
    setIsLoadingModels(true);
    if (initialModels && initialModels.length > 0) {
      const modelsWithLabels = initialModels.map((m) => ({
        ...m,
        label: getModelDisplayLabel(m),
      }));
      setModels(modelsWithLabels);
    } else {
      setModels([]);
    }
    setIsLoadingModels(false);
  }, [initialModels]);

  const loadModelsForSelectedBrand = useCallback(
    async (currentBrandId: string) => {
      if (!currentBrandId || currentBrandId === "All") {
        setModels([]);
        setIsLoadingModels(false);
        return;
      }
      setIsLoadingModels(true);
      try {
        const fetchedModels = await getModels(currentBrandId);
        const modelsWithLabels = fetchedModels.map((m) => ({
          ...m,
          label: getModelDisplayLabel(m),
        }));
        setModels(modelsWithLabels);
      } catch (error) {
        console.error("Error al cargar modelos:", error);
        setModels([]);
      } finally {
        setIsLoadingModels(false);
      }
    },
    [getModels]
  );

  useEffect(() => {
    if (selectedBrandId && selectedBrandId !== brandIdProp) {
      loadModelsForSelectedBrand(selectedBrandId);
    } else if (!selectedBrandId && brandIdProp) {
      setModels([]);
    }
  }, [selectedBrandId, brandIdProp, loadModelsForSelectedBrand]);

  useEffect(() => {
    setSelectedModelId(modelIdProp);
  }, [modelIdProp]);

  const handleBrandSelect = (value: string | null) => {
    setSelectedBrandId(value);
    setSelectedModelId(null);
    setSelectedModelParam(null);
    const selectedBrandObject = brands.find(
      (b) => b.cochesNetId.toString() === value
    );
    setSelectedBrandParam(normalizeNullableValue(selectedBrandObject?.wallapopId));
    if (!value) {
      setModels([]);
    }
  };

  const handleModelSelect = (value: string | null) => {
    setSelectedModelId(value);
    const selectedModelObject = models.find(
      (m) => m.cochesNetModeloId.toString() === value
    );
    setSelectedModelParam(
      normalizeNullableValue(selectedModelObject?.wallapopModeloId)
    );
  };

  const clearAll = () => {
    setSelectedBrandId(null);
    setSelectedModelId(null);
    setSelectedYearFrom(null);
    setSelectedYearTo(null);
    setSelectedPriceFrom(null);
    setSelectedPriceTo(null);
    setSelectedKmFrom(null);
    setSelectedKmTo(null);
    setSelectedTransmission(null);
    setSearchText("");
    setSelectedBrandParam(null);
    setSelectedModelParam(null);
    setModels([]);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (selectedBrandId) params.append("brandId", selectedBrandId);
    if (selectedModelId) params.append("modelId", selectedModelId);
    if (selectedYearFrom) params.append("yearFrom", selectedYearFrom);
    if (selectedYearTo) params.append("yearTo", selectedYearTo);
    if (selectedPriceFrom) params.append("priceFrom", selectedPriceFrom);
    if (selectedPriceTo) params.append("priceTo", selectedPriceTo);
    if (selectedKmFrom) params.append("kmFrom", selectedKmFrom);
    if (selectedKmTo) params.append("kmTo", selectedKmTo);
    if (selectedTransmission)
      params.append("transmision", selectedTransmission);
    if (searchText) params.append("searchText", searchText);
    if (selectedBrandParam) params.append("brand", selectedBrandParam);
    if (selectedModelParam) params.append("model", selectedModelParam);

    setIsDrawerOpen(false); // Close drawer after search
    router.push("/search?" + params.toString());
  };

  const handleSaveSearch = async () => {
    if (!session) {
      toast.error("Necesitas iniciar sesión para guardar búsquedas.");
      return;
    }

    try {
      await saveSearchMutation.mutateAsync({
        name: undefined, // Let the backend handle naming automatically
        brandId: selectedBrandId,
        modelId: selectedModelId,
        yearFrom: selectedYearFrom ? parseInt(selectedYearFrom) : null,
        yearTo: selectedYearTo ? parseInt(selectedYearTo) : null,
        priceFrom: selectedPriceFrom ? parseInt(selectedPriceFrom) : null,
        priceTo: selectedPriceTo ? parseInt(selectedPriceTo) : null,
        kmFrom: selectedKmFrom ? parseInt(selectedKmFrom) : null,
        kmTo: selectedKmTo ? parseInt(selectedKmTo) : null,
        transmission: selectedTransmission,
        searchText: searchText,
        brandParam: selectedBrandParam,
        modelParam: selectedModelParam,
      });
      toast.success("Búsqueda guardada con éxito!");
      setIsDrawerOpen(false); // Close the menu when saved successfully
    } catch (error) {
      console.error("Error al guardar la búsqueda:", error);
      toast.error("Error al guardar la búsqueda.");
    }
  };

  const brandOptions: FilterOption[] = brands.map((b) => ({
    value: b.cochesNetId.toString(),
    label: b.label,
  }));

  const modelOptions: FilterOption[] = models.map((m) => ({
    value: m.cochesNetModeloId.toString(),
    label: getModelDisplayLabel(m),
  }));

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Toggle internal body scroll lock when filters overlay is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isDrawerOpen]);

  const overlayContent = (
    <AnimatePresence>
      {isDrawerOpen && (
        <motion.div 
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-0 z-[100] flex flex-col bg-slate-50 overscroll-contain"
        >
          {/* Header */}
          <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-4 pt-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-cyan-600" />
          <h2 className="text-xl font-bold text-slate-900">Filtros</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-slate-500 hover:bg-slate-100"
          onClick={() => setIsDrawerOpen(false)}
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Scrollable Filters Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
        <div className="space-y-6 pb-24">
          {/* Brand & Model Group */}
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold text-slate-800">
                Marca
              </Label>
              <NativeSelect 
                value={selectedBrandId || ""}
                onChange={(e) => handleBrandSelect(e.target.value === "" ? null : e.target.value)}
                className="w-full h-11"
              >
                <NativeSelectOption value="">Todas las marcas</NativeSelectOption>
                {brandOptions.map((opt) => (
                  <NativeSelectOption key={opt.value} value={opt.value}>
                    {opt.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold text-slate-800">
                Modelo
              </Label>
              <NativeSelect 
                value={selectedModelId || ""}
                onChange={(e) => handleModelSelect(e.target.value === "" ? null : e.target.value)}
                disabled={!selectedBrandId || isLoadingModels}
                className="w-full h-11"
              >
                <NativeSelectOption value="">
                  {isLoadingModels 
                    ? "Cargando..." 
                    : !selectedBrandId 
                      ? "Selecciona marca..." 
                      : "Todos los modelos"}
                </NativeSelectOption>
                {modelOptions.map((opt) => (
                  <NativeSelectOption key={opt.value} value={opt.value}>
                    {opt.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </div>

          {/* Time & Price Group */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <Label className="block text-sm font-semibold text-slate-800">
                Antigüedad
              </Label>
              <NativeSelect 
                value={selectedYearFrom || ""}
                onChange={(e) => setSelectedYearFrom(e.target.value === "" ? null : e.target.value)}
                className="w-full h-11"
              >
                <NativeSelectOption value="">Desde</NativeSelectOption>
                {yearOptions.map((opt) => (
                  <NativeSelectOption key={opt.value} value={opt.value}>
                    {opt.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <NativeSelect 
                value={selectedYearTo || ""}
                onChange={(e) => setSelectedYearTo(e.target.value === "" ? null : e.target.value)}
                className="w-full h-11"
              >
                <NativeSelectOption value="">Hasta</NativeSelectOption>
                {yearOptions.map((opt) => (
                  <NativeSelectOption key={opt.value} value={opt.value}>
                    {opt.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <Label className="block text-sm font-semibold text-slate-800">
                Precio
              </Label>
              <NativeSelect 
                value={selectedPriceFrom || ""}
                onChange={(e) => setSelectedPriceFrom(e.target.value === "" ? null : e.target.value)}
                className="w-full h-11"
              >
                <NativeSelectOption value="">Desde</NativeSelectOption>
                {priceOptions.map((opt) => (
                  <NativeSelectOption key={opt.value} value={opt.value}>
                    {opt.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <NativeSelect 
                value={selectedPriceTo || ""}
                onChange={(e) => setSelectedPriceTo(e.target.value === "" ? null : e.target.value)}
                className="w-full h-11"
              >
                <NativeSelectOption value="">Hasta</NativeSelectOption>
                {priceOptions.map((opt) => (
                  <NativeSelectOption key={opt.value} value={opt.value}>
                    {opt.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </div>

          {/* Features Group */}
          <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <Label className="mb-3 block text-sm font-semibold text-slate-800">
                Kilometraje
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <NativeSelect 
                  value={selectedKmFrom || ""}
                  onChange={(e) => setSelectedKmFrom(e.target.value === "" ? null : e.target.value)}
                  className="w-full h-11"
                >
                  <NativeSelectOption value="">Desde</NativeSelectOption>
                  {kmOptions.map((opt) => (
                    <NativeSelectOption key={opt.value} value={opt.value}>
                      {opt.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <NativeSelect 
                  value={selectedKmTo || ""}
                  onChange={(e) => setSelectedKmTo(e.target.value === "" ? null : e.target.value)}
                  className="w-full h-11"
                >
                  <NativeSelectOption value="">Hasta</NativeSelectOption>
                  {kmOptions.map((opt) => (
                    <NativeSelectOption key={opt.value} value={opt.value}>
                      {opt.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            </div>

            <div>
              <Label className="mb-2 block text-sm font-semibold text-slate-800">
                Transmisión
              </Label>
              <NativeSelect 
                value={selectedTransmission || ""}
                onChange={(e) => setSelectedTransmission(e.target.value === "" ? null : e.target.value)}
                className="w-full h-11"
              >
                <NativeSelectOption value="">Todas</NativeSelectOption>
                {transmissionOptions.map((opt) => (
                  <NativeSelectOption key={opt.value} value={opt.value}>
                    {opt.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            <div>
              <Label
                className="mb-2 block text-sm font-semibold text-slate-800"
                htmlFor="searchText"
              >
                Palabras clave
              </Label>
              <Input
                id="searchText"
                placeholder="Ej: 'techo solar', 'garantia'..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="h-11 rounded-xl border-slate-300 bg-slate-50 focus:border-cyan-500 focus:ring-cyan-500"
              />
            </div>
          </div>
            </div>
          </div>

          {/* Sticky Bottom Actions */}
          <div className="border-t border-slate-200 bg-white px-4 py-4 pb-8 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => {
                  handleSearch();
                  setIsDrawerOpen(false);
                }} 
                className="h-12 w-full rounded-xl bg-cyan-600 font-semibold text-white shadow-md shadow-cyan-900/20 transition-all hover:bg-cyan-500 active:scale-[0.98]"
              >
                <Search className="mr-2 h-5 w-5" />
                Aplicar filtros
              </Button>
              <div className="flex gap-3">
                {session && (
                  <Button
                    onClick={handleSaveSearch}
                    disabled={saveSearchMutation.isPending}
                    className="h-11 flex-1 rounded-xl border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-70"
                    variant="outline"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saveSearchMutation.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                )}
                <Button 
                  onClick={clearAll} 
                  className="h-11 flex-1 rounded-xl border-slate-200 text-slate-600" 
                  variant="outline"
                >
                  <RotateCcw className="mr-2 h-4 w-4 text-slate-400" />
                  Limpiar
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <Button
        onClick={() => setIsDrawerOpen(true)}
        variant="outline"
        size="sm"
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border-slate-300/80 bg-white text-slate-700 shadow-sm"
      >
        <Filter className="h-4 w-4" />
        Filtros de búsqueda
      </Button>

      {/* Render the Full Screen Overlay via Portal so it breaks out of any sticky/absolute containers */}
      {mounted && typeof document !== "undefined" && createPortal(overlayContent, document.body)}
    </>
  );
}
