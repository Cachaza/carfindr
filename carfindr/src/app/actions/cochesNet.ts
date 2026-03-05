'use server'

import { z } from "zod";
import axios from 'axios';
import { logger } from "@/lib/logger";

const searchSchema = z.object({
  isFinanced: z.boolean().nullable(),
  price: z.object({
    from: z.string().nullable(),
    to: z.string().nullable(),
  }).nullable(),
  bodyTypeIds: z.array(z.number()),
  categories: z.object({
    category1Ids: z.array(z.number()),
  }),
  contractId: z.number(),
  drivenWheelsIds: z.array(z.number()),
  environmentalLabels: z.array(z.unknown()),
  equipments: z.array(z.unknown()),
  fuelTypeIds: z.array(z.unknown()),
  hasPhoto: z.boolean().nullable(),
  hasStock: z.boolean().nullable(),
  hasWarranty: z.boolean().nullable(),
  hp: z.object({
    from: z.number().nullable(),
    to: z.number().nullable(),
  }),
  isCertified: z.boolean(),
  km: z.object({
    from: z.string().nullable(),
    to: z.string().nullable(),
  }),
  luggageCapacity: z.object({
    from: z.number().nullable(),
    to: z.number().nullable(),
  }),
  onlyPeninsula: z.boolean(),
  offerTypeIds: z.array(z.number()),
  provinceIds: z.array(z.number()),
  searchText: z.string(),
  sellerTypeId: z.number(),
  transmissionTypeId: z.number(),
  vehicles: z.array(
    z.object({
      make: z.string(),
      makeId: z.number(),
      model: z.string(),
      modelId: z.number(),
    })
  ),
  year: z.object({
    from: z.string().nullable(),
    to: z.string().nullable(),
  }),
  orderBy: z.string().nullable().optional(),
  page: z.number(),
});

export async function cochesNetSearch(input: z.infer<typeof searchSchema>) {
  const parsedInput = searchSchema.parse(input);
  const normalizedPage = Math.max(1, parsedInput.page);

  const headers = {
    'authority': 'web.gw.coches.net',
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.9',
    'content-type': 'application/json',
    'dnt': '1',
    'origin': 'https://www.coches.net',
    'referer': 'https://www.coches.net/',
    'sec-ch-ua': '"Chromium";v="117", "Not;A=Brand";v="8"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Linux"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
    'x-adevinta-amcvid': '02820470527038544711067287973982224321',
    'x-adevinta-channel': 'web-desktop',
    'x-adevinta-euconsent-v2': 'CP2DiUAP2DiUAAHABBENAcEsAP_gAEPgAAiQg1NX_H__bW9r8Xr3aft0eY1P99j77uQxBhfJE-4FyLvW_JwXx2EwNA26tqIKmRIEuzZBIQFlHJHURVigSogVryHsYkGchTNKJ6BkgFMRI2dYCF5vmYtjeQKY5_p_d3fx2D-t_dv83dzzz8lHn3f5P2ckcKCdQ58tDfn9bRKb-5IO9-78v4v09l_rk2_eTVn_pcvr7B-uft87_XU-9_fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEQaoZ4ACIAFAAXAA4AD4AKAAqABcADkAHgAgABJAC4AMoAaABqADwAH4ARAAjgBMAChAFIAUwAqwBcAF0AMQAZgA0ABvAD0AH4AQgAhoBEAESAI4ASwAmgBOACjAFKAMAAYcAygDLAGaANEAbIA5ABzwDuAO8AewA-IB9gH7AP8BAICDgIQAREAikBFgEYAI1ARwBHQCRAElAJSATQAnYBPwCgwFQAVEAq4BYgC5gF1gLyAvQBfQDFAGiANeAbQA3ABxADjgHSAOoAdsA9oB9gD_gImAReAj2BIgEigJUASsAmKBMgEygJtATsAoeBR4FIgKTgU0BTYCnwFQwKkAqUBVQCrAFcgK7AWFAsQCxQFlALRAWoAtiBbgFugLgAXIAugBdoC74F5AXmAvoBf4DBAGDAMNAYgAxYBjwDIYGRgZJAyYDJwGVAMsAZmAzkBngDRIGjAaOA00BqYDVYGrgayA14BtEDbgNvAblA3QDdQHAAOCAcWA48BycDlgOXAc-A6wB4oDx4HkgeUA-KB8gHygPpAfXA-0D7oH7AfuBAECAgEDAIHgQRAgmBBgCDYEIQIUAQrghaCFwEMQIZwQ5BDqCHgIegQ_AimBGACNIEawI3gRxAjoBHYCPYEfQI_gSEAkUBI2CSAJJwSYBJmCVAJUgSwAlnBLcEuIJdAl2BL6CYAJggTDAmLBMwEzgJqATYgm2CbkE3gTfAnCEGoAAA.f_wACHwAAAAA',
    'x-adevinta-page-url': 'https://www.coches.net/search/?KeyWords=junta%20culata&MakeIds%5B0%5D=7&ModelIds%5B0%5D=0&Versions%5B0%5D=',
    'x-adevinta-referer': 'https://www.coches.net/search/?KeyWords=junta%20culata&MakeIds%5B0%5D=7&ModelIds%5B0%5D=0&Versions%5B0%5D=',
    'x-adevinta-session-id': 'f8369f0b-c354-4f69-8381-7877f8c652c3',
    'x-schibsted-tenant': 'coches',
  };

  const jsonData = {
    pagination: {
      page: normalizedPage,
      size: 30,
    },
    sort: {
      order: 'desc',
      term: 'relevance',
    },
    filters: {
      isFinanced: false,
      price: {
        from: null,
        to: null,
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
        from: null,
        to: null,
      },
      luggageCapacity: {
        from: null,
        to: null,
      },
      onlyPeninsula: false,
      offerTypeIds: [0, 1, 2, 3, 4, 5],
      provinceIds: [],
      searchText: '',
      sellerTypeId: 0,
      transmissionTypeId: 0,
      vehicles: [
        {
          make: '',
          makeId: 0,
          model: '',
          modelId: 0,
        },
      ],
      year: {
        from: null,
        to: null,
      },
    },
  };

  if (parsedInput.orderBy === 'newest') {
    jsonData.sort = { order: 'desc', term: 'creationDate' };
  } else if (parsedInput.orderBy === 'price_asc') {
    jsonData.sort = { order: 'asc', term: 'price' };
  } else if (parsedInput.orderBy === 'price_desc') {
    jsonData.sort = { order: 'desc', term: 'price' };
  }

  // Update jsonData with search parameters
  for (const key in parsedInput) {
    if (key in jsonData.filters) {
      (jsonData.filters as any)[key] = parsedInput[key as keyof typeof parsedInput];
    }
  }

  logger.debug('Coches.net search payload prepared', {
    page: jsonData.pagination.page,
    makeId: jsonData.filters.vehicles[0]?.makeId,
    modelId: jsonData.filters.vehicles[0]?.modelId,
  });

  const maxRetries = 2;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const response = await axios.post('https://web.gw.coches.net/search/listing', jsonData, {
        headers: headers,
        timeout: 15000,
      });

      return response.data;
    } catch (error) {
      const isAxiosError = axios.isAxiosError(error);
      const status = isAxiosError ? error.response?.status : undefined;
      const isRetriable = isAxiosError && (status === 502 || status === 503 || status === 504 || error.code === 'ECONNABORTED');

      if (!isRetriable || attempt === maxRetries) {
        logger.error('Error in searchCars:', error);
        throw new Error('Failed to search cars');
      }

      const backoffMs = 400 * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      attempt++;
    }
  }
}
