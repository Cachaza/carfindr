"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";

import { cn } from "../lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "./ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { type FilterOption } from "@/components/FilterDropdown"; // Import FilterOption

// Constants from sidebar.tsx
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
  // Add an option for "Ambos" or "Todas" if needed, matching sidebar's clearLabel logic
  // For ComboBox, "All" is often handled by a separate CommandItem or by allowing empty selection.
  // If a specific "Ambos" option is desired in the list:
  // { value: "", label: "Ambos" } // This matches the old `transmisiones` structure
];

const fuelOptions: FilterOption[] = [
  { value: "", label: "Cualquiera" },
  { value: "diesel", label: "Diésel" },
  { value: "gasoline", label: "Gasolina" },
  { value: "hybrid", label: "Híbrido" },
  { value: "electric", label: "Eléctrico" },
  { value: "other", label: "Otros" },
];

const orderByOptions: FilterOption[] = [
  { value: "", label: "Por relevancia" },
  { value: "newest", label: "Mas recientes (segun plataforma)" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
];

// Types
type Marca = {
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
  displayLabel?: string;
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
    normalizeNullableValue(model.wallapopModeloId) ??
    normalizeNullableValue(model.milanunciosModeloId) ??
    `Model ${model.cochesNetModeloId}`
  );
};

type Props = {
  brands: Marca[];
  getModels: (brandId: string) => Promise<Modelo[]>;
};

// Form field type for cleaner state management
type FormField =
  | "brand"
  | "model"
  | "yearFrom"
  | "yearTo"
  | "priceFrom"
  | "priceTo"
  | "kmFrom"
  | "kmTo"
  | "transmision"
  | "fuel"
  | "orderBy";

// `transmissionOptions` is now defined above, replacing `transmisiones`

const SearchCard: React.FC<Props> = ({ brands, getModels }) => {
  const router = useRouter();

  // Combined form state
  const [formState, setFormState] = React.useState({
    brandId: "",
    selectedBrand: "",
    selectedBrandW: "",
    selectedModel: "",
    selectedModelW: "",
    selectedModelId: "",
    selectedYearFrom: "",
    selectedYearTo: "",
    selectedPriceFrom: "",
    selectedPriceTo: "",
    selectedKmFrom: "",
    selectedKmTo: "",
    searchText: "",
    transmision: "",
    fuel: "",
    orderBy: "",
  });

  // Single state for managing dropdown open states
  const [openDropdown, setOpenDropdown] = React.useState<FormField | null>(
    null,
  );

  // Models state
  const [models, setModels] = React.useState<Modelo[]>([]);

  // Update a single form field
  const updateField = (field: string, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  // Handle brand selection and load models
  const handleBrandChange = React.useCallback(
    async (newBrandId: string, brandLabel: string, wallapopId: string) => {
      updateField("brandId", newBrandId);
      updateField("selectedBrand", brandLabel);
      updateField("selectedBrandW", normalizeNullableValue(wallapopId) || "");

      // Reset model selections
      updateField("selectedModel", "");
      updateField("selectedModelW", "");
      updateField("selectedModelId", "");

      // Load models for selected brand
      if (newBrandId && newBrandId !== "All") {
        try {
          const brandModels = await getModels(newBrandId);
          setModels(
            brandModels.map((model) => ({
              ...model,
              displayLabel: getModelDisplayLabel(model),
            })),
          );
        } catch (error) {
          console.error("Failed to load models:", error);
          setModels([]);
        }
      } else {
        setModels([]);
      }
    },
    [getModels],
  );

  // Reusable ComboBox component
  const ComboBox = React.useCallback(
    ({
      field,
      placeholder,
      items,
      displayValue,
      onSelect,
      valueKey = "value",
      labelKey = "label",
    }: {
      field: FormField;
      placeholder: string;
      items: any[];
      displayValue: string;
      onSelect: (value: any, item?: any) => void;
      valueKey?: string;
      labelKey?: string;
    }) => (
      <Popover
        open={openDropdown === field}
        onOpenChange={(open) => setOpenDropdown(open ? field : null)}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={openDropdown === field}
            className="h-11 w-full justify-between rounded-xl border-slate-300/80 bg-white/80 text-slate-700 shadow-sm hover:bg-slate-50"
          >
            {displayValue || placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] min-w-64 rounded-xl border-white/70 bg-white/95 p-0 shadow-xl shadow-slate-900/10">
          <Command>
            {field === "brand" || field === "model" ? (
              <CommandInput placeholder={`Buscar ${field}...`} />
            ) : null}
            <CommandList className="max-h-56 overflow-auto">
              <CommandEmpty>No se encontró {field}.</CommandEmpty>
              <CommandGroup>
                {field === "brand" || field === "model" ? (
                  <CommandItem
                    value="All"
                    onSelect={() => {
                      onSelect("All");
                      setOpenDropdown(null);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        displayValue === "" ? "opacity-100" : "opacity-0",
                      )}
                    />
                    Todos
                  </CommandItem>
                ) : null}

                {items.map((item) => (
                  <CommandItem
                    key={typeof item === "object" ? item[valueKey] : item}
                    value={typeof item === "object" ? item[valueKey] : item}
                    onSelect={() => {
                      onSelect(
                        typeof item === "object" ? item[valueKey] : item,
                        item,
                      );
                      setOpenDropdown(null);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        displayValue ===
                          (typeof item === "object" ? item[labelKey] : item)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {typeof item === "object" ? item[labelKey] : item}
                    {/* Suffix ' km' or ' €' is now part of the label in kmOptions and priceOptions */}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    ),
    [openDropdown],
  );

  // Handle search button click
  const handleSearch = React.useCallback(() => {
    const params = new URLSearchParams();

    // Add form values to query params
    if (formState.selectedBrand && formState.selectedBrand !== "All") {
      params.append("brandId", formState.brandId);
    }
    if (formState.selectedModel && formState.selectedModel !== "All") {
      params.append("modelId", formState.selectedModelId);
    }
    if (formState.selectedYearFrom) {
      params.append("yearFrom", formState.selectedYearFrom);
    }
    if (formState.selectedYearTo) {
      params.append("yearTo", formState.selectedYearTo);
    }
    if (formState.selectedPriceFrom) {
      params.append("priceFrom", formState.selectedPriceFrom);
    }
    if (formState.selectedPriceTo) {
      params.append("priceTo", formState.selectedPriceTo);
    }
    if (formState.selectedKmFrom) {
      params.append("kmFrom", formState.selectedKmFrom);
    }
    if (formState.selectedKmTo) {
      params.append("kmTo", formState.selectedKmTo);
    }
    if (formState.selectedModelW) {
      params.append("model", formState.selectedModelW);
    }
    if (formState.selectedBrandW) {
      params.append("brand", formState.selectedBrandW);
    }
    if (formState.searchText) {
      params.append("searchText", formState.searchText);
    }
    if (formState.transmision) {
      params.append("transmision", formState.transmision);
    }
    if (formState.fuel) {
      params.append("fuel", formState.fuel);
    }
    if (formState.orderBy) {
      params.append("orderBy", formState.orderBy);
    }

    posthog.capture("search_submitted", {
      brand: formState.selectedBrand || null,
      model: formState.selectedModel || null,
      year_from: formState.selectedYearFrom || null,
      year_to: formState.selectedYearTo || null,
      price_from: formState.selectedPriceFrom || null,
      price_to: formState.selectedPriceTo || null,
      km_from: formState.selectedKmFrom || null,
      km_to: formState.selectedKmTo || null,
      transmission: formState.transmision || null,
      fuel: formState.fuel || null,
      order_by: formState.orderBy || null,
      search_text: formState.searchText || null,
    });

    // Navigate to search page with query parameters
    router.push(`/search?${params.toString()}`);
  }, [formState, router]);

  return (
    <Card className="panel-glass w-full max-w-4xl border-white/70">
      <CardHeader>
        <CardTitle className="text-3xl text-slate-900">
          Empieza a buscar
        </CardTitle>
        <CardDescription className="text-slate-600">
          Filtra por marca, precio y detalles clave para encontrar antes la
          mejor oferta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4">
            {/* Brand Dropdown */}
            <div>
              <Label className="mb-1 block text-sm font-medium text-slate-700">Marca</Label>
              <ComboBox
                field="brand"
                placeholder="Cualquier marca"
                items={brands}
                displayValue={formState.selectedBrand}
                valueKey="cochesNetId"
                labelKey="label"
                onSelect={(_, item) => {
                  if (item === "All") {
                    handleBrandChange("All", "All", "");
                  } else {
                    handleBrandChange(
                      item.cochesNetId.toString(),
                      item.label,
                      normalizeNullableValue(item.wallapopId) || "",
                    );
                  }
                }}
              />
            </div>
            {/* Model Dropdown */}
            <div>
              <Label className="mb-1 block text-sm font-medium text-slate-700">Modelo</Label>
              <ComboBox
                field="model"
                placeholder="Cualquier modelo"
                items={models}
                displayValue={formState.selectedModel}
                valueKey="cochesNetModeloId"
                labelKey="displayLabel"
                onSelect={(value, item) => {
                  if (value === "All") {
                    updateField("selectedModel", "All");
                    updateField("selectedModelW", "");
                    updateField("selectedModelId", "");
                  } else {
                    updateField("selectedModel", getModelDisplayLabel(item));
                    updateField(
                      "selectedModelW",
                      normalizeNullableValue(item.wallapopModeloId) || "",
                    );
                    updateField(
                      "selectedModelId",
                      item.cochesNetModeloId?.toString() || "",
                    );
                  }
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
            {/* Year From Dropdown */}
            <div>
              <Label className="mb-1 block text-sm font-medium text-slate-700">Año min</Label>
              <ComboBox
                field="yearFrom"
                placeholder="Min"
                items={yearOptions}
                displayValue={
                  yearOptions.find((y) => y.value === formState.selectedYearFrom)?.label ?? ""
                }
                onSelect={(value) => updateField("selectedYearFrom", value)}
                valueKey="value"
                labelKey="label"
              />
            </div>
            {/* Year To Dropdown */}
            <div>
              <Label className="mb-1 block text-sm font-medium text-slate-700">Año max</Label>
              <ComboBox
                field="yearTo"
                placeholder="Max"
                items={yearOptions}
                displayValue={
                  yearOptions.find((y) => y.value === formState.selectedYearTo)?.label ?? ""
                }
                onSelect={(value) => updateField("selectedYearTo", value)}
                valueKey="value"
                labelKey="label"
              />
            </div>

            {/* Price From Dropdown */}
            <div>
              <Label className="mb-1 block text-sm font-medium text-slate-700">Precio min</Label>
              <ComboBox
                field="priceFrom"
                placeholder="Min"
                items={priceOptions}
                displayValue={
                  priceOptions.find((p) => p.value === formState.selectedPriceFrom)?.label ?? ""
                }
                onSelect={(value) => updateField("selectedPriceFrom", value)}
                valueKey="value"
                labelKey="label"
              />
            </div>
            {/* Price To Dropdown */}
            <div>
              <Label className="mb-1 block text-sm font-medium text-slate-700">Precio max</Label>
              <ComboBox
                field="priceTo"
                placeholder="Max"
                items={priceOptions}
                displayValue={
                  priceOptions.find((p) => p.value === formState.selectedPriceTo)?.label ?? ""
                }
                onSelect={(value) => updateField("selectedPriceTo", value)}
                valueKey="value"
                labelKey="label"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
            {/* Km From Dropdown */}
            <div>
              <Label className="mb-1 block text-sm font-medium text-slate-700">Km min</Label>
              <ComboBox
                field="kmFrom"
                placeholder="Min"
                items={kmOptions}
                displayValue={
                  kmOptions.find((k) => k.value === formState.selectedKmFrom)?.label ?? ""
                }
                onSelect={(value) => updateField("selectedKmFrom", value)}
                valueKey="value"
                labelKey="label"
              />
            </div>
            {/* Km To Dropdown */}
            <div>
              <Label className="mb-1 block text-sm font-medium text-slate-700">Km max</Label>
              <ComboBox
                field="kmTo"
                placeholder="Max"
                items={kmOptions}
                displayValue={
                  kmOptions.find((k) => k.value === formState.selectedKmTo)?.label ?? ""
                }
                onSelect={(value) => updateField("selectedKmTo", value)}
                valueKey="value"
                labelKey="label"
              />
            </div>
            {/* Transmission Dropdown */}
            <div className="col-span-2">
              <Label className="mb-1 block text-sm font-medium text-slate-700">Transmisión</Label>
              <ComboBox
                field="transmision"
                placeholder="Cualquiera"
                items={transmissionOptions}
                displayValue={
                  transmissionOptions.find((t) => t.value === formState.transmision)?.label ?? ""
                }
                onSelect={(value) => updateField("transmision", value)}
                valueKey="value"
                labelKey="label"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4">
            <div>
              <Label className="mb-1 block text-sm font-medium text-slate-700">Combustible</Label>
              <ComboBox
                field="fuel"
                placeholder="Cualquiera"
                items={fuelOptions}
                displayValue={
                  fuelOptions.find((f) => f.value === formState.fuel)?.label ?? ""
                }
                onSelect={(value) => updateField("fuel", value)}
                valueKey="value"
                labelKey="label"
              />
            </div>
            <div>
              <Label className="mb-1 block text-sm font-medium text-slate-700">Ordenar por</Label>
              <ComboBox
                field="orderBy"
                placeholder="Por relevancia"
                items={orderByOptions}
                displayValue={
                  orderByOptions.find((o) => o.value === formState.orderBy)?.label ?? ""
                }
                onSelect={(value) => updateField("orderBy", value)}
                valueKey="value"
                labelKey="label"
              />
              <p className="mt-1 text-xs text-slate-500">
                Recientes usa el criterio propio de cada plataforma.
              </p>
            </div>
          </div>
        </div>

        {/* Search Text Input */}
        <div className="mt-6">
          <Label htmlFor="searchText" className="text-sm font-medium text-slate-700">
            Palabras clave
          </Label>
          <Input
            id="searchText"
            placeholder="Ej. techo solar, sensores, cámara..."
            value={formState.searchText}
            onChange={(e) => updateField("searchText", e.target.value)}
            className="mt-1.5 h-11 rounded-xl border-slate-300 focus:border-cyan-500 focus:ring-cyan-500 bg-white/80"
          />
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <Button
          className="h-12 w-full rounded-xl bg-cyan-600 text-lg font-semibold text-white shadow-md shadow-cyan-900/20 transition-all hover:bg-cyan-500 hover:shadow-cyan-900/30 active:scale-[0.98]"
          onClick={handleSearch}
        >
          <Search className="mr-2 h-5 w-5" />
          Buscar vehículos
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SearchCard;
