"use client";

// Keep existing imports like React, lucide-react, next/navigation, cn, ui components, types etc.
import { Filter, Save } from "lucide-react"; // Added Save icon
import { useState, useEffect, useCallback } from "react";
import posthog from "posthog-js";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react"; // Import tRPC API client
import { toast } from "sonner"; // Import toast from sonner
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"; // Import Dialog components

import { cn } from "../lib/utils"; // Adjust path
import { Button } from "@/components/ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label"; // Keep Label if needed elsewhere, FilterDropdown includes one
import { getModels as fetchModelsApi } from "@/app/actions/marcasModelos"; // Renamed to avoid conflict

// --- Import the new component ---
import { FilterDropdown, type FilterOption } from "@/components/FilterDropdown"; // Adjust path

// --- Keep existing Types (Marca, Modelo, Props) ---
type Marca = {
  label: string;
  cochesNetId: number;
  milanunciosId: string | null;
  wallapopId: string | null;
  cochesComId: string | null;
};

type Modelo = {
  // Assuming structure, add label if missing, or adapt FilterDropdown if needed
  label: string; // Needs a display label
  cochesNetMarcaId: number;
  cochesNetModeloId: number;
  milanunciosMarcaId: string | null;
  milanunciosModeloId: string | null;
  wallapopMarcaId: string | null;
  wallapopModeloId: string | null; // Will use this as label for now
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
  // getBrands: () => Promise<Marca[]>; // Included via initialBrands
  getModels: (brandId: string) => Promise<Modelo[]>; // Prop for fetching models remains
  brandIdProp: string | null;
  modelIdProp: string | null; // Renamed for clarity
  yearFrom: string | null;
  yearTo: string | null;
  priceFrom: string | null;
  priceTo: string | null;
  kmFrom: string | null;
  kmTo: string | null;
  searchTextProp: string | undefined;
  brandProp: string | null; // Renamed for clarity (wallapopId or similar)
  modelProp: string | null; // Renamed for clarity (wallapopModeloId or similar)
  initialBrands: Marca[];
  initialModels: Modelo[];
  transmission: string | null;
  fuel: string | null;
  orderBy: string | null;
};

// --- Constants ---
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
  },
);

// Simplified Price Range (adjust as needed)
const priceRange = [
  ...Array.from({ length: 4 }, (_, i) => (i + 1) * 250), // 250, 500, 750, 1000
  ...Array.from({ length: 9 }, (_, i) => (i + 1) * 1000 + 1000), // 2k -> 10k
  ...Array.from({ length: 9 }, (_, i) => (i + 1) * 10000 + 10000), // 20k -> 100k
  150000,
  200000, // Add higher values if needed
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

const fuelOptions: FilterOption[] = [
  { value: "diesel", label: "Diésel" },
  { value: "gasoline", label: "Gasolina" },
  { value: "hybrid", label: "Híbrido" },
  { value: "electric", label: "Eléctrico" },
  { value: "other", label: "Otros" },
];

const orderByOptions: FilterOption[] = [
  { value: "newest", label: "Mas reciente" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
];

export default function Sidebar({
  // getBrands, // No longer needed as prop if initialBrands covers it
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
  brandProp, // Wallapop Brand ID/Name from URL
  modelProp, // Wallapop Model ID/Name from URL
  initialBrands,
  initialModels,
  transmission,
  fuel,
  orderBy,
}: Props) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const saveSearchMutation = api.savedSearch.saveSearch.useMutation();

  // --- State ---
  const [isSaveSearchDialogOpen, setIsSaveSearchDialogOpen] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState("");
  // Keep state directly related to selected *values*
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(
    brandIdProp,
  );
  const [selectedModelId, setSelectedModelId] = useState<string | null>(
    modelIdProp,
  );
  const [selectedYearFrom, setSelectedYearFrom] = useState<string | null>(
    yearFrom,
  );
  const [selectedYearTo, setSelectedYearTo] = useState<string | null>(yearTo);
  const [selectedPriceFrom, setSelectedPriceFrom] = useState<string | null>(
    priceFrom,
  );
  const [selectedPriceTo, setSelectedPriceTo] = useState<string | null>(
    priceTo,
  );
  const [selectedKmFrom, setSelectedKmFrom] = useState<string | null>(kmFrom);
  const [selectedKmTo, setSelectedKmTo] = useState<string | null>(kmTo);
  const [selectedTransmission, setSelectedTransmission] = useState<
    string | null
  >(transmission);
  const [selectedFuel, setSelectedFuel] = useState<string | null>(fuel);
  const [selectedOrderBy, setSelectedOrderBy] = useState<string | null>(orderBy);
  const [searchText, setSearchText] = useState(searchTextProp ?? "");

  // State for fetched/dependent data
  const [brands] = useState<Marca[]>(initialBrands); // Initial brands are likely static per page load
  const [models, setModels] = useState<Modelo[]>([]); // Initialize as empty, will be populated by useEffect
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // State needed specifically for URL params (if different from IDs)
  // These might be derivable, but keeping for simplicity matching original params
  const [selectedBrandParam, setSelectedBrandParam] = useState<string | null>(
    brandProp,
  );
  const [selectedModelParam, setSelectedModelParam] = useState<string | null>(
    modelProp,
  );

  // --- Effects ---
  // Effect 1: Initialize or update local 'models' state when initialModels (from props) changes.
  // This ensures labels are correctly formatted for the dropdown.
  useEffect(() => {
    setIsLoadingModels(true);
    if (initialModels && initialModels.length > 0) {
      const modelsWithLabels = initialModels.map((m) => ({
        ...m,
        label: getModelDisplayLabel(m),
      }));
      setModels(modelsWithLabels);
    } else {
      setModels([]); // Clear local models if no initial models are provided
    }
    setIsLoadingModels(false);
  }, [initialModels]); // Dependency: re-run if the initialModels prop from parent changes.

  // Effect 2: Load models when the user changes the brand *within the sidebar*.
  const loadModelsForSelectedBrand = useCallback(
    async (currentBrandId: string) => {
      if (!currentBrandId || currentBrandId === "All") {
        setModels([]); // Clear models if brand is "All" or null
        setIsLoadingModels(false);
        return;
      }
      setIsLoadingModels(true);
      try {
        const fetchedModels = await getModels(currentBrandId); // Use the getModels prop
        const modelsWithLabels = fetchedModels.map((m) => ({
          ...m,
          label: getModelDisplayLabel(m),
        }));
        setModels(modelsWithLabels);
      } catch (error) {
        console.error("Failed to fetch models:", error);
        setModels([]); // Clear on error
      } finally {
        setIsLoadingModels(false);
      }
    },
    [getModels],
  );

  useEffect(() => {
    // This effect handles changes to selectedBrandId *after* the initial setup.
    // The initial state of 'models' is handled by the useEffect watching 'initialModels'.
    if (selectedBrandId && selectedBrandId !== brandIdProp) {
      loadModelsForSelectedBrand(selectedBrandId);
    } else if (!selectedBrandId && brandIdProp) {
      // User cleared brand selection in sidebar, and there was an initial brand from URL.
      // The first useEffect (watching initialModels) would have set models based on initial load.
      // If user clears brand, we need to clear models here.
      setModels([]);
    }
    // If selectedBrandId is null and brandIdProp was also null, models should be empty (handled by first useEffect).
  }, [selectedBrandId, brandIdProp, loadModelsForSelectedBrand]);

  // Update selectedModelId if modelIdProp changes (e.g. from URL navigation or parent re-render)
  useEffect(() => {
    setSelectedModelId(modelIdProp);
  }, [modelIdProp]);

  useEffect(() => {
    setSelectedTransmission(transmission);
    setSelectedFuel(fuel);
    setSelectedOrderBy(orderBy);
  }, [transmission, fuel, orderBy]);

  // --- Handlers ---
  const handleBrandSelect = (value: string | null) => {
    setSelectedBrandId(value);
    // Reset model when brand changes
    setSelectedModelId(null);
    setSelectedModelParam(null);
    // Find the corresponding brand object to get the wallapopId for the param
    const selectedBrandObject = brands.find(
      (b) => b.cochesNetId.toString() === value,
    );
    setSelectedBrandParam(normalizeNullableValue(selectedBrandObject?.wallapopId)); // Or label, depending on what `brandProp` was

    // Model loading is handled by the useEffect hook watching selectedBrandId
    if (!value) {
      setModels([]); // Explicitly clear models if brand is cleared
    }
  };

  const handleModelSelect = (value: string | null) => {
    setSelectedModelId(value);
    // Find the corresponding model object to get the wallapopModeloId for the param
    const selectedModelObject = models.find(
      (m) => m.cochesNetModeloId.toString() === value,
    );
    setSelectedModelParam(
      normalizeNullableValue(selectedModelObject?.wallapopModeloId),
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
    setSelectedFuel(null);
    setSelectedOrderBy(null);
    setSearchText("");
    setSelectedBrandParam(null);
    setSelectedModelParam(null);
    setModels([]); // Clear models list
  };

  const handleSearch = () => {
    const params = new URLSearchParams();

    // Use the state variables directly
    if (selectedBrandId) params.append("brandId", selectedBrandId);
    if (selectedModelId) params.append("modelId", selectedModelId);
    if (selectedYearFrom) params.append("yearFrom", selectedYearFrom);
    if (selectedYearTo) params.append("yearTo", selectedYearTo);
    if (selectedPriceFrom) params.append("priceFrom", selectedPriceFrom);
    if (selectedPriceTo) params.append("priceTo", selectedPriceTo);
    if (selectedKmFrom) params.append("kmFrom", selectedKmFrom);
    if (selectedKmTo) params.append("kmTo", selectedKmTo);
    if (selectedTransmission)
      params.append("transmision", selectedTransmission); // Ensure param name is correct
    if (selectedFuel) params.append("fuel", selectedFuel);
    if (selectedOrderBy) params.append("orderBy", selectedOrderBy);
    if (searchText) params.append("searchText", searchText);

    // Add the potentially different brand/model params if they exist
    if (selectedBrandParam) params.append("brand", selectedBrandParam);
    if (selectedModelParam) params.append("model", selectedModelParam);

    posthog.capture("search_filters_applied", {
      brand: selectedBrandParam || null,
      model: selectedModelParam || null,
      year_from: selectedYearFrom || null,
      year_to: selectedYearTo || null,
      price_from: selectedPriceFrom || null,
      price_to: selectedPriceTo || null,
      km_from: selectedKmFrom || null,
      km_to: selectedKmTo || null,
      transmission: selectedTransmission || null,
      fuel: selectedFuel || null,
      order_by: selectedOrderBy || null,
      search_text: searchText || null,
    });

    router.push("/search?" + params.toString());
    // router.refresh(); // Consider if refresh is truly needed - push often triggers layout reload
  };

  const handleOpenSaveSearchDialog = () => {
    if (!session) {
      toast.error("Necesitas iniciar sesión para guardar búsquedas.");
      return;
    }
    setIsSaveSearchDialogOpen(true);
  };

  const handleConfirmSaveSearch = async () => {
    if (!session) return; // Should be caught by the dialog opening logic

    try {
      await saveSearchMutation.mutateAsync({
        name: saveSearchName || undefined, // Pasar undefined si no se da nombre
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
      posthog.capture("search_saved", {
        name: saveSearchName || null,
        brand: selectedBrandParam || null,
        model: selectedModelParam || null,
        year_from: selectedYearFrom || null,
        year_to: selectedYearTo || null,
        price_from: selectedPriceFrom || null,
        price_to: selectedPriceTo || null,
        km_from: selectedKmFrom || null,
        km_to: selectedKmTo || null,
        transmission: selectedTransmission || null,
        fuel: selectedFuel || null,
        order_by: selectedOrderBy || null,
        search_text: searchText || null,
      });
      toast.success(
        `Búsqueda ${saveSearchName ? `"${saveSearchName}" ` : ""}guardada con éxito!`,
      );
      setIsSaveSearchDialogOpen(false);
      setSaveSearchName(""); // Restablecer nombre para la próxima vez
    } catch (error) {
      console.error("Error al guardar la búsqueda:", error);
      posthog.captureException(
        error instanceof Error ? error : new Error("Failed to save search"),
      );
      toast.error(
        "Error al guardar la búsqueda. Consulta la consola para más detalles.",
      );
      // Opcionalmente mantener el diálogo abierto en caso de error o cerrarlo
      // setIsSaveSearchDialogOpen(false);
    }
  };

  // --- Prepare Options for Dropdowns ---
  const brandOptions: FilterOption[] = brands.map((b) => ({
    value: b.cochesNetId.toString(),
    label: b.label,
  }));

  const modelOptions: FilterOption[] = models.map((m) => ({
    value: m.cochesNetModeloId.toString(), // Value for selection
    label: getModelDisplayLabel(m), // Display label, with source-aware fallback
  }));

  return (
    <div className="panel-glass space-y-6 rounded-2xl border-white/70 p-5 shadow-sm pb-8">
      <div className="flex items-center space-x-2">
        <Filter className="text-cyan-600 h-5 w-5" />
        <h2 className="text-xl font-bold text-slate-900">
          Filtros de busqueda
        </h2>
      </div>

      <div className="space-y-5">
        {/* Brand Dropdown */}
        <FilterDropdown
          label="Marca"
          triggerLabel="Seleccionar marca..."
          selectedValue={selectedBrandId}
          options={brandOptions}
          onSelect={handleBrandSelect}
          searchPlaceholder="Buscar marca..."
          allowClear={true}
          clearLabel="Todas las marcas"
        />

        {/* Model Dropdown */}
        <FilterDropdown
          label="Modelo"
          triggerLabel="Seleccionar modelo..."
          selectedValue={selectedModelId}
          options={modelOptions}
          onSelect={handleModelSelect}
          searchPlaceholder="Buscar modelo..."
          allowClear={true}
          clearLabel="Todos los modelos"
          disabled={!selectedBrandId || isLoadingModels} // Disable if no brand or models loading
        />

        {/* Year Dropdowns */}
        <div className="pt-2">
          <Label className="mb-2 block text-sm font-semibold text-slate-800">
            Antigüedad
          </Label>
          <div className="space-y-3 pt-1">
            <FilterDropdown
              label=""
              triggerLabel="Desde..."
              selectedValue={selectedYearFrom}
              options={yearOptions}
              onSelect={setSelectedYearFrom}
              allowClear={true}
              clearLabel="Cualquiera"
            />
            <FilterDropdown
              label=""
              triggerLabel="Hasta..."
              selectedValue={selectedYearTo}
              options={yearOptions}
              onSelect={setSelectedYearTo}
              allowClear={true}
              clearLabel="Cualquiera"
            />
          </div>
        </div>

        {/* Price Dropdowns */}
        <div className="pt-2">
          <Label className="mb-2 block text-sm font-semibold text-slate-800">
            Precio
          </Label>
          <div className="space-y-3 pt-1">
            <FilterDropdown
              label=""
              triggerLabel="Desde..."
              selectedValue={selectedPriceFrom}
              options={priceOptions}
              onSelect={setSelectedPriceFrom}
              allowClear={true}
              clearLabel="Cualquiera"
            />
            <FilterDropdown
              label=""
              triggerLabel="Hasta..."
              selectedValue={selectedPriceTo}
              options={priceOptions}
              onSelect={setSelectedPriceTo}
              allowClear={true}
              clearLabel="Cualquiera"
            />
          </div>
        </div>

        {/* Kilometer Dropdowns */}
        <div className="pt-2">
          <Label className="mb-2 block text-sm font-semibold text-slate-800">
            Kilometraje
          </Label>
          <div className="space-y-3 pt-1">
            <FilterDropdown
              label=""
              triggerLabel="Desde..."
              selectedValue={selectedKmFrom}
              options={kmOptions}
              onSelect={setSelectedKmFrom}
              allowClear={true}
              clearLabel="Cualquiera"
            />
            <FilterDropdown
              label=""
              triggerLabel="Hasta..."
              selectedValue={selectedKmTo}
              options={kmOptions}
              onSelect={setSelectedKmTo}
              allowClear={true}
              clearLabel="Cualquiera"
            />
          </div>
        </div>

        {/* Transmission Dropdown */}
        <FilterDropdown
          label="Transmisión"
          triggerLabel="Seleccionar transmisión..."
          selectedValue={selectedTransmission}
          options={transmissionOptions}
          onSelect={setSelectedTransmission}
          allowClear={true}
          clearLabel="Todas" // Explicit label for the "clear" state
        />

        <FilterDropdown
          label="Combustible"
          triggerLabel="Seleccionar combustible..."
          selectedValue={selectedFuel}
          options={fuelOptions}
          onSelect={setSelectedFuel}
          allowClear={true}
          clearLabel="Todos"
        />

        <FilterDropdown
          label="Ordenar por"
          triggerLabel="Seleccionar orden..."
          selectedValue={selectedOrderBy}
          options={orderByOptions}
          onSelect={setSelectedOrderBy}
          allowClear={true}
          clearLabel="Por relevancia"
        />

        {/* Search Text Input */}
        <div className="w-full max-w-sm items-center pt-3">
          <Label
            className="mb-1 block text-sm font-medium text-slate-700"
            htmlFor="searchText"
          >
            Palabras clave
          </Label>
          <Input
            id="searchText"
            placeholder="Ej: 'techo solar', 'garantia'..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="mt-1.5 h-11 rounded-xl border-slate-300/80 bg-white/80 shadow-sm"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6">
        <Button
          onClick={handleSearch}
          className="h-12 w-full rounded-xl bg-cyan-600 font-semibold text-white shadow-md shadow-cyan-900/20 hover:bg-cyan-500 transition-all active:scale-[0.98]"
        >
          Buscar vehículos
        </Button>
        {session && (
          <Button
            onClick={handleOpenSaveSearchDialog}
            className="mt-3 h-11 w-full rounded-xl border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
            variant="outline"
          >
            <Save className="mr-2 h-4 w-4" />
            Guardar Búsqueda
          </Button>
        )}
        <Button
          onClick={clearAll}
          className="mt-3 h-11 w-full rounded-xl"
          variant="secondary"
        >
          Limpiar filtros
        </Button>
      </div>

      {/* Save Search Dialog */}
      <Dialog
        open={isSaveSearchDialogOpen}
        onOpenChange={setIsSaveSearchDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar Búsqueda</DialogTitle>
            <DialogDescription>
              Introduce un nombre para esta búsqueda para encontrarla fácilmente
              más tarde. (Opcional)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="searchName" className="text-right">
                Nombre
              </Label>
              <Input
                id="searchName"
                value={saveSearchName}
                onChange={(e) => setSaveSearchName(e.target.value)}
                className="col-span-3"
                placeholder="Ej: Mi Audi Soñado"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleConfirmSaveSearch}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
