import requests
import json
from urllib.parse import quote, urlencode
import logging

# --- Configuration ---
BASE_URL = "https://www.autoscout24.es"
# WARNING: This build ID might change when the website updates.
BUILD_ID = "as24-search-funnel_main-1824" # Keep checking this

# --- Mappings (Expand these as needed!) ---
# Find IDs by inspecting network requests (mmvmk0=ID for make, mmvmd0=ID for model)
MAKE_MAPPINGS = {
    "alfa romeo": "6",
    "audi": "9",
    "bmw": "13",
    "volkswagen": "74",
    "seat": "65",
    "mercedes-benz": "47",
    # Add more makes...
}

# Model IDs can be make-specific, this is simplified.
# A nested dict {make_id: {model_name: model_id}} might be better.
MODEL_MAPPINGS = {
    # Alfa Romeo
    "giulietta": "1611",
    "giulia": "200050",
    "stelvio": "200650",
    # Audi
    "a3": "1623",
    "a4": "1624",
    "q5": "19687",
    # BMW
    "serie 3": "1644", # Note: 'Serie 3' vs '3 Series' - be consistent
    "serie 1": "1642",
    "x3": "18978",
    # VW
    "golf": "2060",
    "polo": "2063",
    "tiguan": "19790",
    # SEAT
    "leon": "19879",
    "ibiza": "19877",
    # Add more models...
}

# Basic Logging Setup
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


def get_make_model_ids(make_name=None, model_name=None):
    """Looks up make and model IDs from the mappings."""
    make_id, model_id = None, None
    if make_name:
        make_id = MAKE_MAPPINGS.get(make_name.lower())
        if not make_id:
            logging.warning(f"Make '{make_name}' not found in mappings.")
            return None, None # Cannot find model without make id usually
        if model_name:
            # In a more complex system, you might use make_id here to find the model
            model_id = MODEL_MAPPINGS.get(model_name.lower())
            if not model_id:
                logging.warning(f"Model '{model_name}' for Make '{make_name}' not found in mappings.")
    elif model_name:
         logging.warning("Model name provided without a make name.")

    return make_id, model_id

def build_search_params(make_id=None, model_id=None, page=1, other_filters={}):
    """Builds the query parameter dictionary."""
    params = {
        "sort": "standard",
        "desc": "0",
        "ustate": "N,U",
        "atype": "C",
        "cy": "E",
        "source": "listpage_pagination", # Or any relevant source
        "powertype": "kw",
        "page": str(page),
        # Add default filters if desired
         "damaged_listing": "exclude", # Example default
    }

    if make_id:
        params["mmvmk0"] = make_id
    if model_id:
        # Requires make_id to be present for model filtering to usually work
        if make_id:
            params["mmvmd0"] = model_id
        else:
            logging.warning("Attempting to add model filter without make filter. This might not work.")

    # Merge other filters, allowing them to override defaults if needed
    params.update(other_filters)

    # Ensure specific values that need encoding later are strings
    for key in ['fregfrom', 'fregto', 'pricefrom', 'priceto', 'kmfrom', 'kmto']:
         if key in params:
             params[key] = str(params[key])

    return params

def build_headers(make_name=None, model_name=None, params={}):
    """Builds the headers, including a dynamic Referer."""
    # Construct the base path for the referer
    referer_base_path = "/lst"
    if make_name:
        referer_base_path += f"/{make_name.lower().replace(' ', '-')}" # Basic slugification
    if make_name and model_name:
         referer_base_path += f"/{model_name.lower().replace(' ', '-')}" # Basic slugification

    # Build the referer query string (excluding page)
    referer_query_params = {k: v for k, v in params.items() if k != 'page'}
    referer_query_string = urlencode(referer_query_params) # Let urlencode handle basic encoding

    referer_url = f'{BASE_URL}{referer_base_path}?{referer_query_string}'

    headers = {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:134.0) Gecko/20100101 Firefox/134.0',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': referer_url,
        'x-nextjs-data': '1',
        'DNT': '1',
        'Sec-GPC': '1',
        'Connection': 'keep-alive',
        # --- Cookie Handling ---
        # Option A: Omitting complex cookie. This is the biggest potential failure point.
        # If requests fail, you might need Option B (manual cookie) or Option C (browser automation).
        # 'Cookie': 'PASTE_A_MINIMAL_OR_RECENT_COOKIE_IF_NEEDED',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Priority': 'u=4',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
    }
    return headers

def build_data_url(make_name=None, model_name=None, build_id=BUILD_ID):
    """Constructs the correct _next/data URL path."""
    path = "/lst"
    if make_name:
        # Basic slug conversion, might need refinement for specific names
        make_slug = make_name.lower().replace(' ', '-')
        path += f"/{make_slug}"
    if make_name and model_name:
        model_slug = model_name.lower().replace(' ', '-')
        path += f"/{model_slug}"
    path += ".json"
    return f"{BASE_URL}/_next/data/{build_id}{path}"


def fetch_car_data(url, params, headers):
    """Fetches and returns the JSON data for a given search."""
    # Let requests handle standard URL encoding for params like ustate=N,U -> N%2CU
    params_to_send = params.copy()

    logging.info(f"Fetching URL: {url}")
    logging.info(f"With Params: {params_to_send}")

    try:
        response = requests.get(url, headers=headers, params=params_to_send, timeout=20) # Added timeout
        logging.info(f"Actual Requested URL: {response.url}")
        response.raise_for_status()

        logging.info(f"Status Code: {response.status_code}")
        return response.json()

    except requests.exceptions.Timeout:
        logging.error("Request timed out.")
        return None
    except requests.exceptions.RequestException as e:
        logging.error(f"Error during request: {e}")
        if response is not None:
            logging.error(f"Response Status Code: {response.status_code}")
            logging.error(f"Response Text: {response.text[:500]}...")
            if response.status_code == 404:
                 logging.error(f"Hint: Got a 404. Check BUILD_ID ('{BUILD_ID}') and URL path structure.")
            if response.status_code >= 400:
                 logging.error("Hint: Authentication/Cookie/Referer might be incorrect or missing.")
        return None
    except json.JSONDecodeError as e:
        logging.error(f"Error decoding JSON: {e}")
        logging.error(f"Response Text: {response.text[:500]}...")
        return None

# --- extract_simple_info function remains the same ---
def extract_simple_info(listing):
    # (Keep the function from the previous working version)
    try:
        details_map = {}
        vehicle_details = listing.get('vehicleDetails', [])
        if isinstance(vehicle_details, list):
             details_map = {item.get('ariaLabel'): item.get('data') for item in vehicle_details if item.get('ariaLabel')}

        price_eval_code = listing.get('price', {}).get('priceEvaluation')
        price_eval_map = {
            1: "Top Price", 2: "Good Price", 3: "Fair Price",
            4: "Slightly High", 5: "High Price", 6: "Unknown/No Eval"
        }
        price_evaluation_text = price_eval_map.get(price_eval_code, "Unknown/No Eval")

        power_str = details_map.get('Potencia')
        power_cv = None
        if power_str and '(' in power_str and 'CV)' in power_str:
             try:
                 # Extract number before ' CV)'
                 power_cv = int(power_str.split('(')[1].split(' CV)')[0].strip())
             except (IndexError, ValueError):
                 power_cv = None # Failed extraction

        return {
            "id": listing.get('id'),
            "make": listing.get('vehicle', {}).get('make'),
            "model": listing.get('vehicle', {}).get('model'),
            "version": listing.get('vehicle', {}).get('modelVersionInput'),
            "price": listing.get('price', {}).get('priceFormatted'),
            "price_eur": listing.get('price', {}).get('priceUnformatted'), # Assuming this key exists
            "price_evaluation_code": price_eval_code,
            "price_evaluation_text": price_evaluation_text,
            "mileage_km": details_map.get('Kilometraje'),
            "registration_date": details_map.get('Año'),
            "fuel_type": details_map.get('Tipo de combustible'),
            "power_cv_raw": power_str,
            "power_cv": power_cv,
            "transmission": details_map.get('Transmisión'),
            "location_city": listing.get('location', {}).get('city'),
            "location_zip": listing.get('location', {}).get('zip'),
            "seller_name": listing.get('seller', {}).get('companyName'),
            "seller_type": listing.get('seller', {}).get('type'),
            "listing_url": BASE_URL + listing.get('url') if listing.get('url') else None,
            "image_urls": listing.get('images', [])
        }
    except Exception as e:
        listing_id = listing.get('id', 'UNKNOWN_ID')
        logging.error(f"Error parsing listing {listing_id}: {e}", exc_info=True) # Log traceback
        return None

# --- Main Search Orchestration ---
def search_cars(make_name=None, model_name=None, page=1, filters={}):
    """
    Performs a car search based on provided criteria.

    Args:
        make_name (str, optional): User-friendly make name. Defaults to None.
        model_name (str, optional): User-friendly model name. Defaults to None.
        page (int, optional): Page number to fetch. Defaults to 1.
        filters (dict, optional): Dictionary of additional filters
                                  (e.g., {'fregto': 2020, 'pricefrom': 10000}).
                                  Defaults to {}.

    Returns:
        tuple: (list of simplified car dicts, total_results, total_pages) or (None, 0, 0) on failure.
    """
    logging.info(f"--- Starting search: Make='{make_name}', Model='{model_name}', Page={page}, Filters={filters} ---")

    make_id, model_id = get_make_model_ids(make_name, model_name)

    # Handle cases where make/model lookup fails but search might still proceed (e.g., general search)
    if make_name and not make_id:
         logging.error(f"Cannot proceed with make '{make_name}' due to missing ID.")
         return None, 0, 0
    if model_name and not model_id:
         logging.error(f"Cannot proceed with model '{model_name}' due to missing ID.")
         # Allow search by make only if make_id was found
         if not make_id:
             return None, 0, 0
         # Reset model_id to None if only make should be searched
         model_id = None
         model_name = None # Also reset name for consistency in URL/Referer building
         logging.warning("Model ID not found, proceeding with Make-only search.")


    # Build components
    search_params = build_search_params(make_id, model_id, page, filters)
    search_headers = build_headers(make_name, model_name, search_params) # Pass make/model names for Referer
    search_url = build_data_url(make_name, model_name) # Pass make/model names for URL path

    # Fetch data
    raw_data = fetch_car_data(search_url, search_params, search_headers)

    # Process results
    if raw_data and 'pageProps' in raw_data:
        listings_data = raw_data['pageProps'].get('listings', [])
        total_results = raw_data['pageProps'].get('numberOfResults', 0)
        total_pages = raw_data['pageProps'].get('numberOfPages', 0)
        current_page_from_response = raw_data['pageProps'].get('pageQuery', {}).get('page', page)

        logging.info(f"Request successful. Found {total_results} total results across {total_pages} pages. (Page {current_page_from_response})")

        simplified_listings = [info for listing in listings_data if (info := extract_simple_info(listing)) is not None]

        return simplified_listings, total_results, total_pages
    else:
        logging.error("Failed to fetch or structure of response was unexpected.")
        return None, 0, 0


# --- Example Usage ---
if __name__ == "__main__":

    # Example 1: Search for Audi A4 up to year 2023, max price 30000
    print("\n>>> EXAMPLE 1: Audi A4 <<<")
    audi_filters = {
        'fregto': 2023,
        'priceto': 30000
    }
    audi_results, total_audi, pages_audi = search_cars(make_name="Audi", model_name="a4", page=1, filters=audi_filters)

    if audi_results is not None:
        print(f"Found {len(audi_results)} Audi A4 listings on page 1 (Total: {total_audi})")
        # print(json.dumps(audi_results[:2], indent=4, ensure_ascii=False)) # Print first 2 results
    else:
        print("Audi A4 search failed.")

    # Example 2: Search for any BMW (make only), price between 15k and 25k
    print("\n>>> EXAMPLE 2: BMW (Make only) <<<")
    bmw_filters = {
        'pricefrom': 15000,
        'priceto': 25000
    }
    bmw_results, total_bmw, pages_bmw = search_cars(make_name="BMW", page=1, filters=bmw_filters)

    if bmw_results is not None:
        print(f"Found {len(bmw_results)} BMW listings on page 1 (Total: {total_bmw})")
        # print(json.dumps(bmw_results[:1], indent=4, ensure_ascii=False)) # Print first result
    else:
        print("BMW search failed.")

    # Example 3: General search (like before), year from 2022
    print("\n>>> EXAMPLE 3: General Search (fregfrom=2022) <<<")
    general_filters = {
        'fregfrom': 2022
        # Add other general filters here if needed
    }
    general_results, total_general, pages_general = search_cars(page=1, filters=general_filters)

    if general_results is not None:
        print(f"Found {len(general_results)} general listings on page 1 (Total: {total_general})")
    else:
        print("General search failed.")

    # Example 4: Search for a make/model not in mappings (should log warnings)
    print("\n>>> EXAMPLE 4: Unknown Make/Model <<<")
    unknown_results, _, _ = search_cars(make_name="Ferrari", model_name="Testarossa", page=1)
    if unknown_results is None:
         print("Search correctly failed due to unknown make/model (check logs).")