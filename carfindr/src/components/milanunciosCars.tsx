"use client";


import MilanunciosCard from "./milanunciosCard";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { TriangleDownIcon, TriangleUpIcon } from "@radix-ui/react-icons";
import { milanunciosSearch } from "@/app/actions/milanuncios";

interface milanunciosCar {
  attributes: {
    field: {
      formatted: string;
      raw: string;
    };
    value: {
      formatted: string;
      raw: string;
    };
  }[];
  authorId: string;
  authorName: string;
  categories: {
    id: number;
    name: string;
    slug: string;
  }[];
  contactMethods: {
    chat: boolean;
    form: boolean;
    phone: boolean;
  };
  description: string;
  distance: null | string; // Change 'any' to the specific type if available
  extras: never[]; // Change 'any' to the specific type if available
  id: string;
  isHighlighted: boolean;
  isNew: boolean;
  location: {
    city: {
      id: number;
      name: string;
      slug: string;
    };
    geolocation: null | string; // Change 'any' to the specific type if available
    province: {
      id: number;
      name: string;
      slug: string;
    };
    region: {
      id: number;
      name: string;
      slug: string;
    };
  };
  origin: {
    name: string;
    provider: null | string; // Change 'any' to the specific type if available
  };
  price: {
    cash: {
      includeTaxes: boolean;
      label: string;
      value: number;
    };
  };
  publicationDate: string;
  shipping: null | boolean; // Change 'any' to the specific type if available
  sortDate: string;
  title: string;
  transaction: string;
  type: string;
  updateDate: string;
  url: string;
  visibility: string;
  photo: string[];
}

interface SearchParams {
  yearFrom: string | null;
  yearTo: string | null;
  priceFrom: string | null;
  priceTo: string | null;
  kmFrom: string | null;
  kmTo: string | null;
  searchTextProp: string | undefined;
  model: string | null;
  brand: string | null;
  transmission: string | null;
}

export default function MilanunciosCars({
  yearFrom,
  yearTo,
  priceFrom,
  priceTo,
  kmFrom,
  kmTo,
  searchTextProp,
  model,
  brand,
  transmission,
}: SearchParams) {
  const [offset, setOffset] = useState(0);
  const [milanunciosCars, setMilanunciosCars] = useState<milanunciosCar[]>([]);
  const [noMore, setNoMore] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [totalResults, setTotalResults] = useState(0);

  const [cursor, setCursor] = useState(0);
  const [isLoading, setIsLoading] = useState(false);


  const fetchCars = async () => {
    setIsLoading(true);
    try {
      const result = await milanunciosSearch({
        brand: brand,
        model: model,
        kilometersFrom: kmFrom,
        kilometersTo: kmTo,
        priceFrom: priceFrom,
        priceTo: priceTo,
        yearFrom: yearFrom,
        yearTo: yearTo,
        fuel: null,
        transmission: transmission ?? null,
        doors: null,
        sellerType: null,
        text: searchTextProp ?? "",
        offset: offset,
      });

      if (result.ads.length === 0) {
        setNoMore(true);
      } else {
        if (milanunciosCars.length === 0) {
          setMilanunciosCars(result.ads);
          setTotalResults(result.pagination.totalHits.value);
        } else {
          setMilanunciosCars((prevCars) => [...prevCars, ...result.ads]);
        }
        //setCursor((prevCursor) => prevCursor + result.length);
      }
    } catch (error) {
      console.error("Error fetching cars:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCursor(0);
    setMilanunciosCars([]);
    setNoMore(false);
    void fetchCars();
  }, [
    brand,
    model,
    priceFrom,
    priceTo,
    kmFrom,
    kmTo,
    yearFrom,
    yearTo,
    searchTextProp,
    transmission
  ]);

  const handleShowMore = () => {
    setCursor((prevCursor) => prevCursor + 30);
    void fetchCars();
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className=""
    >
      <div className="flex flex-row justify-between">
        <h1 className="text-2xl text-slate-900">Milanuncios</h1>
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
        <p className="mb-4 text-sm text-slate-600">
          Resultados totales:{" "}
          {totalResults}
        </p>
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {milanunciosCars.map((car) => (
              <MilanunciosCard car={car} key={car.id} />
            ))}
          </div>
          <div className="mt-4 flex justify-center">
            <Button className="rounded-xl h-11 px-8" variant="outline" onClick={handleShowMore} disabled={noMore}>
              Mostrar mas
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
