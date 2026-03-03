"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { type JSX, type SVGProps, useState, useEffect, useCallback, use } from "react";

import { useRouter } from "next/navigation";
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

import { Input } from "./ui/input";
import { getModels } from "@/app/actions/marcasModelos";
import { log } from "console";


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
};

type Props = {
  getBrands: () => Promise<Marca[]>;
  getModels: (brandId: string) => Promise<Modelo[]>;
  brandIdProp: string | null;
  modelId: string | null;
  yearFrom: string | null;
  yearTo: string | null;
  priceFrom: string | null;
  priceTo: string | null;
  kmFrom: string | null;
  kmTo: string | null;
  searchTextProp: string | undefined;
  brand: string | null;
  model: string | null;
  initialBrands: Marca[];
  initialModels: Modelo[];
};

const kmRange = [
  2500, 5000, 7500, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000,
  50000, 60000, 70000, 80000, 90000, 100000, 120000, 140000, 160000, 180000,
  200000,
];

export default function Sidebar({ brandIdProp, modelId, yearFrom, yearTo, priceFrom, priceTo, kmFrom, kmTo, searchTextProp, brand, model, initialBrands, initialModels }: Props) {
  const router = useRouter();
  const [openBrand, setOpenBrand] = useState(false);
  const [openModels, setOpenModels] = useState(false);
  const [openYearTo, setOpenYearTo] = useState(false);
  const [openYearFrom, setOpenYearFrom] = useState(false);
  const [openPrecioFrom, setOpenPrecioFrom] = useState(false);
  const [openPrecioTo, setOpenPrecioTo] = useState(false);
  const [openKmFrom, setOpenKmFrom] = useState(false);
  const [openKmTo, setOpenKmTo] = useState(false);

  const [brandId, setBrandId] = useState(brandIdProp ?? "");

  const [brands, setBrands] = useState<Marca[]>(initialBrands);
  const [models, setModels] = useState<Modelo[]>(initialModels);
  const [selectedBrand, setSelectedBrand] = useState(brand ?? "");
  const [selectedBrandW, setSelectedBrandW] = useState(brand ?? "");
  const [selectedModel, setSelectedModel] = useState(model ?? "");
  const [selectedModelW, setSelectedModelW] = useState(model ?? "");
  const [selectedModelId, setSelectedModelId] = useState(modelId ?? "");
  const [selectedYearFrom, setSelectedYearFrom] = useState(yearFrom ?? "");
  const [selectedYearTo, setSelectedYearTo] = useState(yearTo ?? "");
  const [selectedPrecioFrom, setSelectedPrecioFrom] = useState(priceFrom ?? "");
  const [selectedPrecioTo, setSelectedPrecioTo] = useState(priceTo ?? "");
  const [selectedKmFrom, setSelectedKmFrom] = useState(kmFrom ?? "");
  const [selectedKmTo, setSelectedKmTo] = useState(kmTo ?? "");
  const [searchText, setSearchText] = useState(searchTextProp ?? "");

  useEffect(() => {
    setModels(initialModels);
  }, [initialModels]);

  


  const handleBrandChange = useCallback(async (newBrandId: string) => {
    console.log("handleBrandChange");
    console.log(newBrandId);
    if (newBrandId && newBrandId !== 'All') {
      const brandModels = await getModels(newBrandId);
      setModels(brandModels);
    } else {
      setModels([]);
    }
  }, [getModels]);

  function clearAll() {
    setSelectedBrand("");
    setSelectedModel("");
    setSelectedYearFrom("");
    setSelectedYearTo("");
    setSelectedPrecioFrom("");
    setSelectedPrecioTo("");
    setSelectedKmFrom("");
    setSelectedKmTo("");
    setSearchText("");
    setBrandId("");
    setSelectedBrandW("");
    setSelectedModelW("");
  }




  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-white p-4">
      <div className="mb-6 flex items-center space-x-2">
        <IconMagnifyingglass className="text-gray-500" />
        <h2 className="text-lg font-semibold">Filtros</h2>
      </div>
      <div className="space-y-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium" htmlFor="make">
            Marca
          </label>
          <Popover open={openBrand} onOpenChange={setOpenBrand}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openBrand}
                className="w-full justify-between "
              >
                {selectedBrand ? selectedBrand : "Select brand..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="max-h-64 w-56 justify-between overflow-auto p-0 ">
            <Command>
                    <CommandInput placeholder="Search car brand..." />
                    <CommandList className="max-h-56 overflow-auto">
                      <CommandEmpty>No car brand found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="All"
                          onSelect={async () => {
                            setSelectedBrand("All");
                            setSelectedBrandW("");
                            setOpenBrand(false);
                            setBrandId("All");
                            const newBrandId = "All";
                            setBrandId(newBrandId);
                            handleBrandChange(newBrandId);
                            setSelectedModel( "");
                            setSelectedModelW("");
                            setSelectedModelId("");
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedBrand === "" ? "opacity-100" : "opacity-0",
                            )}
                          />
                          All
                        </CommandItem>
                        {brands.map((car) => (
                          <CommandItem
                            key={car.cochesNetId}
                            value={car.label}
                            onSelect={() => {
                              setSelectedBrand(car.label);
                              setSelectedBrandW(car.wallapopId ?? "None");
                              setOpenBrand(false);
                              const newBrandId = car.cochesNetId.toString();
                              setBrandId(newBrandId);
                              handleBrandChange(newBrandId);
                              setSelectedModel( "");
                              setSelectedModelW("");
                              setSelectedModelId("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedBrand === car.label
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {car.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium" htmlFor="model">
            Modelo
          </label>
          <Popover open={openModels} onOpenChange={setOpenModels}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openModels}
                className="w-full justify-between "
              >
                {selectedModel ? selectedModel : "Select model..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="max-h-64 w-56 overflow-auto p-0 ">
            <Command>
                  <CommandInput placeholder="Search car model..." />
                  <CommandList  className="max-h-56 overflow-auto">
                    <CommandEmpty>No car model found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="All"
                        onSelect={async () => {
                          setSelectedModel("All");
                          setSelectedModelW("");
                          setOpenModels(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedModel === "" ? "opacity-100" : "opacity-0",
                          )}
                        />
                        All
                      </CommandItem>

                      {models.map((model) => (
                        <CommandItem
                          key={model.cochesNetModeloId}
                          value={model.wallapopModeloId ?? ""}
                          onSelect={async () => {
                            setOpenModels(false);
                            setSelectedModel(model.wallapopModeloId ?? "");
                            setSelectedModelW(model.wallapopModeloId ?? "");
                            setSelectedModelId(
                              model.cochesNetModeloId?.toString() ?? "",
                            );
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedModel === model.wallapopModeloId
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {model.wallapopModeloId}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div className="py-3">
          <label className="text-sm font-medium" htmlFor="model">
            Antigüedad
          </label>
          <div className="py-3">
          <Popover open={openYearFrom} onOpenChange={setOpenYearFrom}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openYearFrom}
                  className="w-full justify-between max-md:w-full"
                >
                  {selectedYearFrom ? selectedYearFrom : "Año desde..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0 max-md:w-full">
                <Command>
                  <CommandList className="max-h-56 overflow-auto">
                    <CommandGroup>
                        {
                          // go from 2023 to 1949
                          Array.from(Array(75).keys())
                            .reverse()
                            .map((year) => (
                              <CommandItem
                                key={year + 1949}
                                value={(year + 1949).toString()}
                                onSelect={async () => {
                                  setOpenYearFrom(false);
                                  setSelectedYearFrom((year + 1950).toString());
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedYearFrom === (year + 1949).toString()
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                {year + 1949}
                              </CommandItem>
                            ))
                        }
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="">
          <Popover open={openYearTo} onOpenChange={setOpenYearTo}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openYearTo}
                  className="w-full justify-between max-md:w-full"
                >
                  {selectedYearTo ? selectedYearTo : "Año hasta..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0 max-md:w-full">
                <Command>
                  <CommandList className="max-h-56 overflow-auto">
                    <CommandGroup>
                      {
                        // go from 2023 to 1949
                        Array.from(Array(75).keys())
                          .reverse()
                          .map((year) => (
                            <CommandItem
                              key={year + 1949}
                              value={(year + 1949).toString()}
                              onSelect={async () => {
                                setOpenYearTo(false);
                                setSelectedYearTo((year + 1949).toString());
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedYearTo === (year + 1949).toString()
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {year + 1949}
                            </CommandItem>
                          ))
                      }
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="py-3">
          <label className="text-sm font-medium" htmlFor="model">
            Precio
          </label>
          <div className="py-3">
          <Popover open={openPrecioFrom} onOpenChange={setOpenPrecioFrom}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openPrecioFrom}
                  className="w-full justify-between max-md:w-full"
                >
                  {selectedPrecioFrom ? selectedPrecioFrom : "Precio desde..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0 max-md:w-full">
                <Command>
                  <CommandList className="max-h-56 overflow-auto">
                    <CommandGroup>
                      {
                        // go from 0 to 1000 in increments of 250, from 1000 to 10000 in increments of 1000, from 10000 to 100000 in increments of 10000
                        Array.from(Array(41).keys()).map((year) => (
                          <CommandItem
                            key={year * 250}
                            value={(year * 250).toString()}
                            onSelect={async () => {
                              setOpenPrecioFrom(false);
                              setSelectedPrecioFrom((year * 250).toString());
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedPrecioFrom === (year * 250).toString()
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {year * 250}
                          </CommandItem>
                        ))
                      }
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="">
          <Popover open={openPrecioTo} onOpenChange={setOpenPrecioTo}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openPrecioTo}
                  className="w-full justify-between max-md:w-full"
                >
                  {selectedPrecioTo ? selectedPrecioTo : "Precio hasta..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0 max-md:w-full">
                <Command>
                  <CommandList className="max-h-56 overflow-auto">
                    <CommandGroup>
                      {
                        // go from 0 to 1000 in increments of 250, from 1000 to 10000 in increments of 1000, from 10000 to 100000 in increments of 10000
                        Array.from(Array(41).keys()).map((year) => (
                          <CommandItem
                            key={year * 250}
                            value={(year * 250).toString()}
                            onSelect={async () => {
                              setOpenPrecioTo(false);
                              setSelectedPrecioTo((year * 250).toString());
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedPrecioTo === (year * 250).toString()
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {year * 250}
                          </CommandItem>
                        ))
                      }
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="">
          <label className="text-sm font-medium" htmlFor="model">
            Kilometraje
          </label>
          <div className="py-3">
          <Popover open={openKmFrom} onOpenChange={setOpenKmFrom}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openKmFrom}
                  className="w-full justify-between max-md:w-full"
                >
                  {selectedKmFrom ? selectedKmFrom : "Km desde..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0 max-md:w-full">
                <Command>
                  <CommandList className="max-h-56 overflow-auto">
                    <CommandGroup>
                      {kmRange.map((km) => (
                        <CommandItem
                          key={km}
                          value={km.toString()}
                          onSelect={async () => {
                            setOpenKmFrom(false);
                            setSelectedKmFrom(km.toString());
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedKmFrom === km.toString()
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {km.toLocaleString()} km
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="">
            <Popover open={openKmTo} onOpenChange={setOpenKmTo}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openKmTo}
                  className="w-full justify-between "
                >
                  {selectedKmTo ? selectedKmTo : "Km hasta..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="max-h-64 w-56 overflow-auto p-0 ">
                <Command>
                <CommandList className="max-h-56 overflow-auto">
                    <CommandGroup>
                      {kmRange.map((km) => (
                        <CommandItem
                          key={km}
                          value={km.toString()}
                          onSelect={async () => {
                            setOpenKmTo(false);
                            setSelectedKmTo(km.toString());
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedKmTo === km.toString()
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {km.toLocaleString()} km
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="w-full max-w-sm items-center pt-3 font-semibold">
          <Input
            id="searchText"
            placeholder="Palabras clave"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>
      <Button
        onClick={() => {
          const params = new URLSearchParams();
          if (selectedBrand) {
            params.append("brandId", brandId);
          }
          if (selectedModel) {
            params.append("modelId", selectedModelId);
          }
          if (selectedYearFrom) {
            params.append("yearFrom", selectedYearFrom);
          }
          if (selectedYearTo) {
            params.append("yearTo", selectedYearTo);
          }
          if (selectedPrecioFrom) {
            params.append("priceFrom", selectedPrecioFrom);
          }
          if (selectedPrecioTo) {
            params.append("priceTo", selectedPrecioTo);
          }
          if (selectedKmFrom) {
            params.append("kmFrom", selectedKmFrom);
          }
          if (selectedKmTo) {
            params.append("kmTo", selectedKmTo);
          }
          if (selectedModelW) {
            params.append("model", selectedModelW);
          }
          if (selectedBrandW) {
            params.append("brand", selectedBrandW);
          }
          if (searchText) {
            params.append("searchText", searchText);
          }
          if (selectedBrand == "All") {
            params.delete("brandId");
          }
          if (selectedModel == "All") {
            params.delete("modelId");
          }

          
          router.push("/search?" + params.toString());
          router.refresh();
        }}
        className="mt-4 w-full"
      >
        Buscar
      </Button>
      <Button
        onClick={() => {
          clearAll();
        }}
        className="mt-4 w-full"
        variant="secondary"
      >
        Limpiar
      </Button>
    </div>
  );
}

function IconChevrondown(
  props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>,
) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IconFilter(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function IconMagnifyingglass(
  props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>,
) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 18h8" />
      <path d="M3 22h18" />
      <path d="M14 22a7 7 0 1 0 0-14h-1" />
      <path d="M9 14h2" />
      <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" />
      <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
    </svg>
  );
}
