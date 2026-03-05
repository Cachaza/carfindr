"use client";


import CochesNetCard from "@/components/cochesNetCard";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { TriangleDownIcon, TriangleUpIcon } from "@radix-ui/react-icons";
import { cochesNetSearch } from "@/app/actions/cochesNet";
interface Car {
  id: string;
  creationDate: string;
  title: string;
  url: string;
  price: {
    amount: number;
    financedAmount: number;
    taxTypeId: number;
    hasTaxes: boolean;
  };
  km: number;
  year: number;
  cubicCapacity: number;
  provinceIds: number[];
  mainProvince: string;
  location: {
    provinceIds: number[];
    mainProvince: string;
    mainProvinceId: number;
  };
  resources: {
    type: string;
    url: string;
  }[];
  makeId: number;
  modelId: number;
  fuelTypeId: number;
  fuelType: string;
  bodyTypeId: number;
  warranty: {
    id: number;
    months: number;
  };
  isFinanced: boolean;
  isCertified: boolean;
  isProfessional: boolean;
  publishedDate: string;
  hasUrge: boolean;
  offerType: {
    id: number;
    literal: string;
  };
  phone: string;
  environmentalLabel: string;
  drivenWheelsId: number;
  contractId: string;
  pack: {
    legacyId: number;
    type: string;
  };
  transmissionTypeId: number;
}

interface SearchParams {
  brandIdProp: string | null;
  modelId: string | null;
  yearFrom: string | null;
  yearTo: string | null;
  priceFrom: string | null;
  priceTo: string | null;
  kmFrom: string | null;
  kmTo: string | null;
  searchTextProp: string | undefined;
  transmissionTypeId: number | null;
}

export default function CochesNetCars({
  brandIdProp,
  modelId,
  yearFrom,
  yearTo,
  priceFrom,
  priceTo,
  kmFrom,
  kmTo,
  searchTextProp,
  transmissionTypeId
}: SearchParams) {
  const [page, setPage] = useState(1);
  const [cochesNetCars, setCochesNetCars] = useState<Car[]>([]);
  const [noMore, setNoMore] = useState(false);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setPage(1);
    setCochesNetCars([]);
  }, [
    brandIdProp,
    modelId,
    yearFrom,
    yearTo,
    priceFrom,
    priceTo,
    kmFrom,
    kmTo,
    searchTextProp,
    transmissionTypeId,
  ]);

  const fetchCars = async (currentPage: number) => {
    try {
      setLoading(true);
      const results = await cochesNetSearch({
        isFinanced: false,
        price: {
          from: priceFrom,
          to: priceTo,
        },
        bodyTypeIds: [],
        categories: {
          category1Ids: [2500],
        },
        contractId: 0,
        drivenWheelsIds: [],
        environmentalLabels: [],
        equipments: [],
        fuelTypeIds: [],
        hasPhoto: null,
        hasStock: null,
        hasWarranty: null,
        hp: {
          from: null,
          to: null,
        },
        isCertified: false,
        km: {
          from: kmFrom,
          to: kmTo,
        },
        luggageCapacity: {
          from: 0,
          to: 2000,
        },
        onlyPeninsula: false,
        offerTypeIds: [0, 1, 2, 3, 4, 5],
        provinceIds: [],
        searchText: searchTextProp ? searchTextProp : "",
        sellerTypeId: 0,
        transmissionTypeId: transmissionTypeId ?? 0,
        vehicles: [
          {
            make: "",
            makeId: brandIdProp ? parseInt(brandIdProp) : 0,
            model: "",
            modelId: modelId ? parseInt(modelId) : 0,
          },
        ],
        year: {
          from: yearFrom,
          to: yearTo,
        },
        page: currentPage,
      });
      
      if (currentPage === 1) {
        setCochesNetCars(results.items || []);
      } else {
        setCochesNetCars(prevCars => [...prevCars, ...(results.items || [])]);
      }
      
      setTotal(results.meta.totalResults);
      setNoMore(results.items.length === 0);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setCochesNetCars([]);
    fetchCars(1);
  }, [
    brandIdProp,
    modelId,
    yearFrom,
    yearTo,
    priceFrom,
    priceTo,
    kmFrom,
    kmTo,
    searchTextProp,
    transmissionTypeId,
  ]);

  

  const handleShowMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCars(nextPage);
  };

  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full"
    >
      <div className="flex flex-row justify-between">
        <h1 className="text-2xl text-slate-900">Coches.net</h1>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="rounded-full hover:bg-slate-100">
            {isOpen ? (
              <TriangleUpIcon className="h-6 w-6" />
            ) : (
              <TriangleDownIcon className="h-6 w-6" />
            )}
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <p className="mb-2 text-sm text-slate-600">Resultados totales: {total}</p>
        {loading && cochesNetCars.length === 0 ? (
          <div className="flex justify-center items-center">
            Loading.....
          </div>
        ) : error ? (
          <div className="flex justify-center items-center p-8 bg-red-50 text-red-500 rounded-xl">
            <p>Error: {error}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {cochesNetCars.map((car) => (
                <CochesNetCard car={car} key={car.id} />
              ))}
            </div>
            <div className="mt-4 flex justify-center">
              <Button className="rounded-xl h-11 px-8" variant="outline" onClick={handleShowMore} disabled={noMore || loading}>
                {loading ? "Cargando..." : "Mostrar mas"}
              </Button>
            </div>
          </div>
        )}
        
      </CollapsibleContent>
    </Collapsible>
  );
}
