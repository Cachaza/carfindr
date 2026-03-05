"use client";

import { Filter, Save } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { toast } from "sonner";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilterDropdown, type FilterOption } from "@/components/FilterDropdown";

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

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSaveSearchDialogOpen, setIsSaveSearchDialogOpen] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState("");

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

  const handleOpenSaveSearchDialog = () => {
    if (!session) {
      toast.error("Necesitas iniciar sesión para guardar búsquedas.");
      return;
    }
    setIsSaveSearchDialogOpen(true);
  };

  const handleConfirmSaveSearch = async () => {
    if (!session) return;

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
      toast.success(
        `Búsqueda ${
          saveSearchName ? `"${saveSearchName}" ` : ""
        }guardada con éxito!`
      );
      setIsSaveSearchDialogOpen(false);
      setSaveSearchName("");
    } catch (error) {
      console.error("Error al guardar la búsqueda:", error);
      toast.error("Error al guardar la búsqueda. Consulta la consola para más detalles.");
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

  return (
    <>
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border-slate-300/80 bg-white/85 text-slate-700"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[90vh] rounded-t-2xl border-white/70 bg-slate-50/95">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <Filter className="text-cyan-600" />
              Filtros de búsqueda
            </DrawerTitle>
            <DrawerDescription>
              Personaliza tu búsqueda con los filtros disponibles
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-4 overflow-y-auto flex-1">
            <div className="space-y-4">
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
                disabled={!selectedBrandId || isLoadingModels}
              />

              {/* Year Dropdowns */}
              <div className="py-3">
                <Label className="mb-1 block text-sm font-medium text-slate-700">
                  Antigüedad
                </Label>
                <div className="pt-2 space-y-3">
                  <FilterDropdown
                    label=""
                    triggerLabel="Año desde..."
                    selectedValue={selectedYearFrom}
                    options={yearOptions}
                    onSelect={setSelectedYearFrom}
                    allowClear={true}
                    clearLabel="Año desde..."
                  />
                  <FilterDropdown
                    label=""
                    triggerLabel="Año hasta..."
                    selectedValue={selectedYearTo}
                    options={yearOptions}
                    onSelect={setSelectedYearTo}
                    allowClear={true}
                    clearLabel="Año hasta..."
                  />
                </div>
              </div>

              {/* Price Dropdowns */}
              <div className="py-3">
                <Label className="mb-1 block text-sm font-medium text-slate-700">
                  Precio
                </Label>
                <div className="pt-2 space-y-3">
                  <FilterDropdown
                    label=""
                    triggerLabel="Precio desde..."
                    selectedValue={selectedPriceFrom}
                    options={priceOptions}
                    onSelect={setSelectedPriceFrom}
                    allowClear={true}
                    clearLabel="Precio desde..."
                  />
                  <FilterDropdown
                    label=""
                    triggerLabel="Precio hasta..."
                    selectedValue={selectedPriceTo}
                    options={priceOptions}
                    onSelect={setSelectedPriceTo}
                    allowClear={true}
                    clearLabel="Precio hasta..."
                  />
                </div>
              </div>

              {/* Kilometer Dropdowns */}
              <div className="py-3">
                <Label className="mb-1 block text-sm font-medium text-slate-700">
                  Kilometraje
                </Label>
                <div className="pt-2 space-y-3">
                  <FilterDropdown
                    label=""
                    triggerLabel="Km desde..."
                    selectedValue={selectedKmFrom}
                    options={kmOptions}
                    onSelect={setSelectedKmFrom}
                    allowClear={true}
                    clearLabel="Km desde..."
                  />
                  <FilterDropdown
                    label=""
                    triggerLabel="Km hasta..."
                    selectedValue={selectedKmTo}
                    options={kmOptions}
                    onSelect={setSelectedKmTo}
                    allowClear={true}
                    clearLabel="Km hasta..."
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
                clearLabel="Todas"
              />

              {/* Search Text Input */}
              <div className="w-full items-center pt-3">
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
                  className="mt-1 h-11 rounded-xl border-slate-300/80 bg-white/80"
                />
              </div>
            </div>
          </div>

          <DrawerFooter className="pt-6">
            <Button onClick={handleSearch} className="h-11 w-full rounded-xl bg-cyan-600 text-white shadow-md shadow-cyan-900/20 hover:bg-cyan-500">
              Buscar
            </Button>
            {session && (
              <Button
                onClick={handleOpenSaveSearchDialog}
                className="h-11 w-full rounded-xl"
                variant="outline"
              >
                <Save className="mr-2 h-4 w-4" />
                Guardar Búsqueda
              </Button>
            )}
            <Button onClick={clearAll} className="h-11 w-full rounded-xl" variant="secondary">
              Limpiar filtros
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="h-11 w-full rounded-xl">
                Cerrar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Save Search Dialog */}
      <Dialog
        open={isSaveSearchDialogOpen}
        onOpenChange={setIsSaveSearchDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar Búsqueda</DialogTitle>
            <DialogDescription>
              Introduce un nombre para esta búsqueda para encontrarla fácilmente más tarde. (Opcional)
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
    </>
  );
}
