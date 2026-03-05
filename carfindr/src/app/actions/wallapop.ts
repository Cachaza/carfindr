"use server";
import axios from 'axios';
import { z } from 'zod';

const searchSchema = z.object({
  minSalePrice: z.string().nullable().optional(),
  latitude: z.string().nullable().optional(),
  maxYear: z.string().nullable().optional(),
  maxKm: z.string().nullable().optional(),
  minKm: z.string().nullable().optional(),
  maxSalePrice: z.string().nullable().optional(),
  orderBy: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  minYear: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  longitude: z.string().nullable().optional(),
  keywords: z.string().nullable().optional(),
  nextPageUrl: z.string().nullable().optional(),
  gearBox: z.string().nullable().optional(),
  fuel: z.string().nullable().optional(),
});

function mapFuelToWallapopEngine(fuel: string | null | undefined): string | null {
  if (!fuel) return null;
  if (fuel === 'diesel') return 'gasoil';
  if (fuel === 'gasoline') return 'gasoline';
  if (fuel === 'electric' || fuel === 'hybrid') return 'electric-hybrid';
  if (fuel === 'other') return 'others';
  return null;
}

function mapOrderByToWallapop(orderBy: string | null | undefined): string | null {
  if (!orderBy) return null;
  if (orderBy === 'newest') return 'newest';
  if (orderBy === 'price_asc') return 'price_low_to_high';
  if (orderBy === 'price_desc') return 'price_high_to_low';
  if (orderBy === 'most_relevance') return 'most_relevance';
  return null;
}

interface WallapopApiResponse {
  data?: {
    section?: {
      items?: any[];
    };
  };
  meta?: {
    next_page?: string;
  };
}

interface WallapopSearchResult {
  searchObjects: any[];
  nextPageUrl: string | null;
}

const TARGET_RESULTS = 40;
const MAX_CONSECUTIVE_FETCHES = 11;

function toMillis(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return Date.now();
}

function normalizeWallapopItem(item: any, fallbackGearbox?: string | null): any | null {
  const id = item?.id;
  if (!id) {
    return null;
  }

  const typeAttributes = item?.type_attributes ?? {};

  const images = Array.isArray(item?.images)
    ? item.images.map((img: any) => {
        const small = img?.urls?.small ?? img?.small ?? img?.original ?? "";
        const medium = img?.urls?.medium ?? img?.medium ?? small;
        const large = img?.urls?.big ?? img?.large ?? medium;
        return {
          original: large,
          xsmall: small,
          small,
          medium,
          large,
          xlarge: large,
          original_width: img?.original_width ?? null,
          original_height: img?.original_height ?? null,
        };
      })
    : [];

  const amount = typeof item?.price?.amount === 'number'
    ? item.price.amount
    : typeof item?.price === 'number'
      ? item.price
      : 0;
  const currency = item?.price?.currency ?? item?.currency ?? 'EUR';

  return {
    id,
    type: item?.type ?? 'item',
    content: {
      id,
      title: item?.title ?? '',
      storytelling: item?.storytelling ?? item?.description ?? '',
      distance: item?.distance ?? 0,
      images,
      user: item?.user ?? null,
      flags: item?.flags ?? null,
      visibility_flags: item?.visibility_flags ?? null,
      price: amount,
      currency,
      web_slug: item?.web_slug ?? item?.webSlug ?? '',
      category_id: item?.category_id ?? null,
      brand: item?.brand ?? typeAttributes?.brand ?? '',
      model: item?.model ?? typeAttributes?.model ?? '',
      year: item?.year ?? typeAttributes?.year ?? 0,
      version: item?.version ?? typeAttributes?.version ?? '',
      km: item?.km ?? typeAttributes?.km ?? 0,
      engine: item?.engine ?? typeAttributes?.engine ?? '',
      gearbox: item?.gearbox ?? typeAttributes?.gearbox ?? fallbackGearbox ?? '',
      horsepower: item?.horsepower ?? typeAttributes?.horsepower ?? 0,
      favorited: item?.favorited ?? false,
      creation_date: toMillis(item?.creation_date ?? item?.created_at),
      modification_date: toMillis(item?.modification_date ?? item?.modified_at),
      location: {
        postal_code: item?.location?.postal_code ?? '',
        country_code: item?.location?.country_code ?? '',
        city: item?.location?.city ?? '',
      },
      shipping: item?.shipping ?? null,
      supports_shipping: item?.supports_shipping ?? false,
    },
  };
}

export async function wallapopSearch(input: z.infer<typeof searchSchema>): Promise<WallapopSearchResult> {
  const parsedInput = searchSchema.parse(input);

  const headers = {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'es,en-US;q=0.9,en;q=0.8',
    'Connection': 'keep-alive',
    'DNT': '1',
    'Origin': 'https://es.wallapop.com',
    'Referer': 'https://es.wallapop.com/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:134.0) Gecko/20100101 Firefox/134.0', // Match HAR
    'sec-ch-ua': '"Chromium";v="117", "Not;A=Brand";v="8"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Linux"',
    'Sec-GPC': '1',
    'DeviceOS': '0',
    'X-DeviceOS': '0',
    'X-DeviceID': '2eb91a88-2bf8-4ebb-a905-e5d06f00a76d',
    'MPID': '-1142872387716636433',
    'X-AppVersion': '84760',
  };

  const initialParamMappings: Record<string, string> = {
    brand: 'brand', model: 'model', minSalePrice: 'min_sale_price', maxSalePrice: 'max_sale_price',
    minKm: 'min_km', maxKm: 'max_km', minYear: 'min_year', maxYear: 'max_year',
    latitude: 'latitude', longitude: 'longitude', orderBy: 'order_by', keywords: 'keywords', gearBox: 'gearbox',
    fuel: 'engine',
  };

  let accumulatedCars: any[] = [];
  let currentUrlToFetch: string | null = parsedInput.nextPageUrl ?? null;
  let nextUrlFromApi: string | null = parsedInput.nextPageUrl ?? null;
  let fetchCount = 0;
  const seenCarIds = new Set<string>();

  while (accumulatedCars.length < TARGET_RESULTS && fetchCount < MAX_CONSECUTIVE_FETCHES) {
    fetchCount++;
    let params: Record<string, string | number> = {};
    const isInitialApiCallForBatch = (fetchCount === 1 && !parsedInput.nextPageUrl);
    const apiEndpoint = 'https://api.wallapop.com/api/v3/search/section';

    if (currentUrlToFetch) {
      params.next_page = currentUrlToFetch;
    } else if (isInitialApiCallForBatch) {
      params.category_id = '100';
      params.source = 'side_bar_filters';
      params.section_type = 'organic_search_results';
      for (const [key, value] of Object.entries(parsedInput)) {
        if (key !== 'nextPageUrl' && value !== null && value !== undefined && key in initialParamMappings) {
          const paramKey = initialParamMappings[key];
          if (paramKey) {
            if (key === 'fuel') {
              const mappedFuel = mapFuelToWallapopEngine(value.toString());
              if (mappedFuel) params[paramKey] = mappedFuel;
            } else if (key === 'orderBy') {
              const mappedOrder = mapOrderByToWallapop(value.toString());
              if (mappedOrder) params[paramKey] = mappedOrder;
            } else {
              params[paramKey] = value.toString();
            }
          }
        }
      }
      if (!params.order_by) {
        params.order_by = 'most_relevance';
      }
    } else {
      break;
    }

    try {
      const response = await axios.get<WallapopApiResponse>(apiEndpoint, {
        params: params,
        headers: headers,
      });

      const newCarsRaw = response.data?.data?.section?.items ?? [];
      const headerNext = response.headers['x-nextpage'] as string | undefined;
      nextUrlFromApi = response.data?.meta?.next_page ?? headerNext ?? null;

      const uniqueNewCarsInThisFetch = newCarsRaw
        .map((car) => normalizeWallapopItem(car, parsedInput.gearBox ?? null))
        .filter((car): car is any => !!car)
        .filter((car) => {
          if (seenCarIds.has(car.id)) {
            return false;
          }
          seenCarIds.add(car.id);
          return true;
      });

      if (uniqueNewCarsInThisFetch.length > 0) {
        accumulatedCars = [...accumulatedCars, ...uniqueNewCarsInThisFetch];
      }

      currentUrlToFetch = nextUrlFromApi;

      if (accumulatedCars.length >= TARGET_RESULTS || !currentUrlToFetch) {
        break;
      }
    } catch {
      nextUrlFromApi = currentUrlToFetch;
      break;
    }
  }

  return {
    searchObjects: accumulatedCars,
    nextPageUrl: nextUrlFromApi,
  };
}
