"use server"

import { z } from "zod";
import axios, { AxiosResponse } from 'axios';

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
  }
  interface Pagination {
    nextToken: string;
    page: number;
    resultsPerPage: number;
    totalHits: {
      relation: string;
      value: number;
    };
  }
  
  
  type Photo = {
    adId: string;
    imageUrls: string[];
  };
  
  type Photos = Photo[];
  
  interface milanunciosResponse {
    ads: milanunciosCar[];
    ids: string[];
    isShippableContentSharing: never[];
    pagination: Pagination;
    photos: Photos;
    status: {adId: string; reserveStatus: string}[];
  
  }

const searchSchema = z.object({
    brand: z.string().nullable(),
    model: z.string().nullable(),
    sellerType: z.string().nullable(),
    priceFrom: z.string().nullable(),
    priceTo: z.string().nullable(),
    kilometersFrom: z.string().nullable(),
    kilometersTo: z.string().nullable(),
    yearFrom: z.string().nullable(),
    yearTo: z.string().nullable(),
    transmission: z.string().nullable(),
    fuel: z.string().nullable(),
    doors: z.string().nullable(),
    text: z.string().nullable(),
    sort: z.string().nullable().optional(),
    offset: z.number(),
});

const headers = {
    'authority': 'searchapi.gw.milanuncios.com',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/jxl,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-language': 'en-US,en;q=0.9',
    'cache-control': 'no-cache',
    'cookie': 'didomi_token=eyJ1c2VyX2lkIjoiMThjM2I3Y2ItNzY5Yy02ZTNkLWFhM2EtNjUxMDcyMjczODJmIiwiY3JlYXRlZCI6IjIwMjMtMTItMDVUMTk6Mzc6NTguNDEwWiIsInVwZGF0ZWQiOiIyMDIzLTEyLTA1VDE5OjM3OjU5LjczOVoiLCJ2ZW5kb3JzIjp7ImVuYWJsZWQiOlsiZ29vZ2xlIiwiYzpnb29nbGVhbmEtNFRYbkppZ1IiXX0sInB1cnBvc2VzIjp7ImVuYWJsZWQiOlsiZGV2aWNlX2NoYXJhY3RlcmlzdGljcyIsImdlb2xvY2F0aW9uX2RhdGEiXX0sInZlbmRvcnNfbGkiOnsiZW5hYmxlZCI6WyJnb29nbGUiXX0sInZlcnNpb24iOjJ9; euconsent-v2=CP2UBAAP2UBAAAHABBENAdEsAP_gAEPgAAiQg1NX_H__bW9r8Xr3aft0eY1P99j77uQxBhfJE-4FyLvW_JwXx2EwNA26tqIKmRIEu3ZBIQFlHJHURVigaogVryHsYkGchTNKJ6BkgFMRI2dYCF5vmYtj-QKY5_p_d3fx2D-t_dv83dzzz81Hn3f5f2ckcKCdQ58tDfn9bRKb-5IO9-78v4v09l_rk2_eTVn_pcvr7B-uft87_XU-9_fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEQaoaQACIAFAAXAA4AD4AKAAqABcADgAHgAQAAkgBcAGUANAA1AB4AD8AIgARwAmABQgCkAKYAVYAuAC6AGIAMwAaAA3gB6AD8AIQAQ0AiACJAEcAJYATQAnABRgClAGAAMOAZQBlgDNAGiANkAcgA54B3AHeAPYAfEA-wD9gH-AgEBBwEIAIiARSAiwCMAEagI4AjoBIgCSgEpAJoATsAn4BQYCoAKiAVcAsQBcwC6wF5AXoAvoBigDRAGvANoAbgA4gBxwDpAHUAO2Ae0A-wB_wETAIvAR7AkQCRQEqAJWATFAmQCZQE2gJ2AUPAo8CkQFJwKaApsBT4CoYFSAVKAqoBVgCuQFdgLCgWIBYoCygFogLUAWxAtwC3QFwALkAXQAu0Bd8C8gLzAX0Av8BggDBgGGgMQAYsAx4BkMDIwMkgZMBk4DKgGWAMzAZyAzwBokDRgNHAaaA1MBqsDVwNZAa8A2gBtkDbgNvAblA3QDdQHAAOCAcWA48BycDlgOXAc6A58B1gDxQHjwPJA8oB8UD5APlAfSA-uB9oH3QP2A_cCAIEBAIGAQPAgiBBMCDAEGwIQgQoAhXBC0ELgIYgQzghyCHUEPAQ9Ah-BFMCMAEaQI1gRvAjiBHQCOwEewI-gR_AkIBIoCRsEkASTgkwCTMEqASpAlgBLOCW4JcQS6BLsCX0EwATBAmGBMWCZgJnATUAmxBNsE3IJvAm-BOEINQAAAAA.f_wACHwAAAAA; borosTcf=eyJwb2xpY3lWZXJzaW9uIjoyLCJjbXBWZXJzaW9uIjoxLCJwdXJwb3NlIjp7ImNvbnNlbnRzIjp7IjEiOnRydWUsIjIiOnRydWUsIjMiOnRydWUsIjQiOnRydWUsIjUiOnRydWUsIjYiOnRydWUsIjciOnRydWUsIjgiOnRydWUsIjkiOnRydWUsIjEwIjp0cnVlfX0sInNwZWNpYWxGZWF0dXJlcyI6eyIxIjp0cnVlfX0=; AMCV_05FF6243578784B37F000101%40AdobeOrg=-408604571%7CMCIDTS%7C19697%7CMCMID%7C39497821261612844356915773378727390472%7CMCAID%7CNONE%7CMCOPTOUT-1701812279s%7CNONE%7CvVersion%7C4.6.0; _csrf=IFNfkFwk6XQtPiJnINjjJnQEsTAYhG8dqtwjb//TFU9yVkMz5RMuXDPFkNenGvAuRNDP61BZ5olAJ4Rdvlln1LeR81WitLZ+TbJz+qaD7bg=; reese84=3:F7N2gac8Lo4fUdM8Vkgcaw==:etVeHr0dcrkmbuy6PQUDoXUvbltyQiZV58WeCQxnnDXqGoeE7Unaa8HdSagEMSktU0BNbPCiSqeC97QagX0TgxW9OQ1/XO4h2LkuARYE3+j9gqgONRzfMdHBWpeNZTIUFc1N03cGUELHuwwrLbq2dbAjKB+YOoLlK4DcY8zoHeHGxhzkMSPeHvP1E7Jy8WnOG4HcQHU0QcmL1ka9dySlm15kihLktfU2vczazDj75QmNLspaKYrb0LGNdbYxvd0j/eRafP3V0aFIWOBXRK3Sngfqd8yJyCYBseqkXauoiUUOx7ZyQG4iRRt/zCC9Ubaod+OKwgZZnsMZw0gE+h+bLERPWh47T45IGNG56a3+2BfrZ/jCOlTrPZLYOyfshYR/CPkSDSf28XHaOw1xMAbsoZk+nAyruOo2HkMDqCkhwGqbTgCgccYNHT2uZQCj0Z7prYDp2mR8jsvX4BU1b8D8EoJ3j8ekpxZ86ZqL1MpZAlU=:SaG3eCNhi7RFFaWDP6VEsxJf99hSSGx1Hl+yfhtEDgE=',
    'dnt': '1',
    'pragma': 'no-cache',
    'sec-ch-ua': '"Chromium";v="117", "Not;A=Brand";v="8"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"Android"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Mobile Safari/537.36'
};

function combineAdsAndPhotos(jsonData: milanunciosResponse) {
    const ads = jsonData.ads;
    const photos = jsonData.photos || []; // Added nullish coalescing operator to handle undefined or null
  
  
    const adsWithPhotos = ads.map((ad) => {
      const photo = photos.find((photo: { adId: string; }) => photo.adId === ad.id);
      return {
        ...ad,
        photo: photo ? photo.imageUrls : [],
      };
    });
  
    return { ...jsonData, ads: adsWithPhotos };
  }

export async function milanunciosSearch(inputObject: z.infer<typeof searchSchema>) {
    const input = searchSchema.parse(inputObject);

    const params: {
        brand?: string;
        model?: string;
        sellerType?: string;
        priceFrom?: string;
        priceTo?: string;
        kilometersFrom?: string;
        kilometersTo?: string;
        yearFrom?: string;
        yearTo?: string;
        transmission?: string;
        fuel?: string;
        doors?: string;
        text?: string;
        category?: string;
        limit?: string;
        offset?: number;
        sort?: string;
        transaction?: string;
    } = {
        category: '13',
        transaction: 'supply',
        limit: '30',
        sort: input.sort ?? 'random',
    };

    if (input.brand) {
        params.brand = input.brand;
    }
    if (input.model) {
        params.model = input.model;
    }
    if (input.sellerType) {
        params.sellerType = input.sellerType;
    }
    if (input.priceFrom) {
        params.priceFrom = input.priceFrom;
    }
    if (input.priceTo) {
        params.priceTo = input.priceTo;
    }
    if (input.kilometersFrom) {
        params.kilometersFrom = input.kilometersFrom;
    }
    if (input.kilometersTo) {
        params.kilometersTo = input.kilometersTo;
    }
    if (input.yearFrom) {
        params.yearFrom = input.yearFrom;
    }
    if (input.yearTo) {
        params.yearTo = input.yearTo;
    }
    if (input.transmission) {
        params.transmission = input.transmission;
    }
    if (input.fuel) {
        params.fuel = input.fuel;
    }
    if (input.doors) {
        params.doors = input.doors;
    }
    if (input.text) {
        params.text = input.text;
    }

    params.offset = input.offset;

    const response: AxiosResponse = await axios.get('https://searchapi.gw.milanuncios.com/v3/classifieds', {
        headers: headers,
        params: params
    });

    
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const jsonData: milanunciosResponse = response.data;

    
    const adsWithPhotos = combineAdsAndPhotos(jsonData);
    return adsWithPhotos;

}
