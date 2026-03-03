"use client";

import WallapopCard from "./wallapopCard";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { TriangleDownIcon, TriangleUpIcon } from "@radix-ui/react-icons";
import { wallapopSearch } from "@/app/actions/wallapop"; // Adjust path if needed
import { logger } from "@/lib/logger";

// Interfaces (keep as they are)
interface wallapopCar {
  id: string;
  type: string;
  content: {
    id: string;
    title: string;
    storytelling: string;
    distance: number;
    images: wallapopImage[];
    user: {
      micro_name: string;
      id: string;
      image: wallapopImage;
      online: boolean;
      kind: string;
    };
    flags: {
      pending: boolean;
      sold: boolean;
      reserved: boolean;
      banned: boolean;
      expired: boolean;
      onhold: boolean;
    };
    visibility_flags: {
      bumped: boolean;
      highlighted: boolean;
      urgent: boolean;
      country_bumped: boolean;
      boosted: boolean;
    };
    price: number;
    currency: string;
    web_slug: string;
    category_id: number;
    brand: string;
    model: string;
    year: number;
    version: string;
    km: number;
    engine: string;
    gearbox: string;
    horsepower: number;
    favorited: boolean;
    creation_date: number;
    modification_date: number;
    location: {
      postal_code: string;
      country_code: string;
      city: string;
    };
    shipping: {
      item_is_shippable: boolean;
      user_allows_shipping: boolean;
      cost_configuration_id: string | null;
    };
    supports_shipping: boolean;
  };
}

interface wallapopImage {
  original: string;
  xsmall: string;
  small: string;
  large: string;
  medium: string;
  xlarge: string;
  original_width: number;
  original_height: number;
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
  gearbox: string | null;
}

export default function WallapopCars({
  yearFrom, yearTo, priceFrom, priceTo, kmFrom, kmTo, searchTextProp, model, brand, gearbox
}: SearchParams) {
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null); // URL for the *next* request
  const [wallapopCars, setWallapopCars] = useState<wallapopCar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [hasMoreResults, setHasMoreResults] = useState(true); // Track if API might have more

  const fetchData = async (isNewSearch = false) => {
    const urlForThisFetch = isNewSearch ? null : nextPageUrl;

    // Prevent fetching if already loading or if we know there are no more pages
    if (isLoading || (!isNewSearch && !hasMoreResults)) {
         logger.debug(`Wallapop fetch skipped: loading=${isLoading}, isNewSearch=${isNewSearch}, hasMoreResults=${hasMoreResults}`);
         return;
     }


    logger.debug(`Wallapop fetch start: isNewSearch=${isNewSearch}, hasNextPage=${!!urlForThisFetch}`);
    setIsLoading(true);

    try {
      // Pass initial filters only if isNewSearch, otherwise just pass the nextPageUrl
      const result = await wallapopSearch({
        brand: isNewSearch ? brand : null,
        model: isNewSearch ? model : null,
        latitude: isNewSearch ? "40.41956" : null,
        longitude: isNewSearch ? "-3.69196" : null,
        orderBy: isNewSearch ? "most_relevance" : null,
        minSalePrice: isNewSearch ? priceFrom : null,
        maxSalePrice: isNewSearch ? priceTo : null,
        minKm: isNewSearch ? kmFrom : null,
        maxKm: isNewSearch ? kmTo : null,
        minYear: isNewSearch ? yearFrom : null,
        maxYear: isNewSearch ? yearTo : null,
        keywords: isNewSearch ? searchTextProp : undefined,
        gearBox: isNewSearch ? gearbox : null,
        nextPageUrl: urlForThisFetch,
      });

      const newCars = result.searchObjects as wallapopCar[];
      const returnedNextPageUrl = result.nextPageUrl;

      logger.debug(`Wallapop fetch result: cars=${newCars.length}, hasNextPage=${!!returnedNextPageUrl}`);

      // Append or replace results (server action handles deduplication within the batch)
       if (isNewSearch) {
            // Need to deduplicate here too in case the *initial* batch from server had internal dupes
            const seenIds = new Set<string>();
            const uniqueInitialCars = newCars.filter(car => {
                 if (seenIds.has(car.id)) return false;
                 seenIds.add(car.id);
                 return true;
            });
            setWallapopCars(uniqueInitialCars);
        } else {
            // For "Show More", filter against *existing* client state before appending
            const existingIds = new Set(wallapopCars.map(c => c.id));
            const uniqueNewCarsToAppend = newCars.filter(car => !existingIds.has(car.id));
            if (uniqueNewCarsToAppend.length > 0) {
                setWallapopCars(prevCars => [...prevCars, ...uniqueNewCarsToAppend]);
            } else {
                logger.debug("Wallapop fetch returned no new unique cars.");
            }
        }


      // Update state for the next potential fetch
      setNextPageUrl(returnedNextPageUrl);
      setHasMoreResults(!!returnedNextPageUrl); // If API returns a next URL, assume there's more

    } catch (error) {
      logger.error("Error fetching Wallapop cars:", error);
      setHasMoreResults(false); // Assume error means no more results
    } finally {
      setIsLoading(false);
    }
  };

  // Effect for new searches
  useEffect(() => {
    logger.debug("Wallapop search params changed, resetting pagination.");
    setNextPageUrl(null);
    setWallapopCars([]);
    setHasMoreResults(true); // Assume there might be results initially
    void fetchData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand, model, priceFrom, priceTo, kmFrom, kmTo, yearFrom, yearTo, searchTextProp, gearbox]);

  // Handler for "Show More"
  const handleShowMore = () => {
    if (!isLoading && hasMoreResults && nextPageUrl) { // Check nextPageUrl explicitly
      logger.debug("Wallapop show more clicked.");
      void fetchData(false);
    } else {
        logger.debug(`Wallapop show more blocked: loading=${isLoading}, hasMoreResults=${hasMoreResults}, hasNextPage=${!!nextPageUrl}`);
    }
  };



  // --- Render Logic (Adjusted messaging slightly) ---
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="">
      <div className="flex flex-row justify-between items-center">
        <h1 className="text-2xl text-slate-900">Wallapop</h1>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="rounded-full p-1 hover:bg-slate-100">
             {isOpen ? <TriangleUpIcon className="h-6 w-6" /> : <TriangleDownIcon className="h-6 w-6" />}
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <p className="mb-2 text-sm text-slate-600">Resultados mostrados: {wallapopCars.length}</p>
        {wallapopCars.map((car) => (
          // Ensure WallapopCard uses the correct prop
          <WallapopCard car={car} key={car.id} />
        ))}
        {/* Button logic */}
        {hasMoreResults && wallapopCars.length > 0 && (
            <div className="mt-4 text-black">
              <Button className="rounded-xl" variant="outline" onClick={handleShowMore} disabled={isLoading}>
                {isLoading ? "Cargando..." : "Mostrar más"}
              </Button>
            </div>
        )}
        {/* Messages */}
        {!hasMoreResults && wallapopCars.length > 0 && !isLoading && (
            <p className="text-gray-500 mt-4">No hay más resultados.</p>
        )}
         {wallapopCars.length === 0 && !isLoading && (
             <p className="text-gray-500 mt-4">No se encontraron resultados para esta búsqueda.</p>
          )}
      </CollapsibleContent>
    </Collapsible>
  );
}
