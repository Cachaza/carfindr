import requests
import json
from bs4 import BeautifulSoup # Needs installation: pip install beautifulsoup4
from urllib.parse import quote, urlencode
import logging
import re # For potentially cleaning JSON

# --- Configuration ---
BASE_URL = "https://www.autoscout24.es"
# Build ID not needed for this approach

# --- Mappings (Expand these!) ---
MAKE_MAPPINGS = { "alfa romeo": "6", "audi": "9", "bmw": "13", "volkswagen": "74", "seat": "65", "mercedes-benz": "47"}
MODEL_MAPPINGS = { "giulietta": "1611", "giulia": "200050", "stelvio": "200650", "a3": "1623", "a4": "1624", "q5": "19687", "serie 3": "1644", "serie 1": "1642", "x3": "18978", "golf": "2060", "polo": "2063", "tiguan": "19790", "leon": "19879", "ibiza": "19877"}

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def get_make_model_ids(make_name=None, model_name=None):
    # (Same as previous version)
    make_id, model_id = None, None
    if make_name:
        make_id = MAKE_MAPPINGS.get(make_name.lower())
        if not make_id: logging.warning(f"Make '{make_name}' not found in mappings."); return None, None
        if model_name:
            model_id = MODEL_MAPPINGS.get(model_name.lower())
            if not model_id: logging.warning(f"Model '{model_name}' for Make '{make_name}' not found in mappings.")
    elif model_name: logging.warning("Model name provided without a make name.")
    return make_id, model_id

def build_html_search_params(make_id=None, model_id=None, page=1, other_filters={}):
    """Builds the query parameter dictionary for the HTML search page."""
    # Parameters might be slightly different for HTML page vs API, adjust if needed
    # Often includes pricetype, powertype etc. implicitly or explicitly
    params = {
        "sort": "standard", "desc": "0", "ustate": "N,U", "atype": "C", "cy": "E",
        "source": "listpage_pagination", # This might change depending on actual source
        "powertype": "kw", "page": str(page),
        "damaged_listing": "exclude",
        "pricetype": "public", # Often seen on list pages
    }
    if make_id: params["mmvmk0"] = make_id
    if model_id and make_id: params["mmvmd0"] = model_id
    params.update(other_filters)
    for key in ['fregfrom', 'fregto', 'pricefrom', 'priceto', 'kmfrom', 'kmto']:
         if key in params: params[key] = str(params[key])
    return params

def build_html_headers():
    """Builds simpler headers suitable for fetching the HTML page."""
    # Less need for complex headers like x-nextjs-data or specific Referer/Cookies
    headers = {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:134.0) Gecko/20100101 Firefox/134.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1', # Common for HTML requests
        'DNT': '1',
        'Sec-GPC': '1',
    }
    # Cookies are less critical here, but basic session/consent might help avoid blocks
    # You could add a *minimal* cookie if needed, obtained from browser
    # headers['Cookie'] = 'culture=es-ES; some_consent_cookie=...'
    return headers

def build_html_search_url(make_name=None, model_name=None):
    """Constructs the standard HTML search results page URL."""
    path = "/lst"
    if make_name: path += f"/{make_name.lower().replace(' ', '-')}"
    if make_name and model_name: path += f"/{model_name.lower().replace(' ', '-')}"
    return f"{BASE_URL}{path}" # Query parameters will be added by requests

def fetch_and_extract_data_from_html(url, params, headers):
    """Fetches HTML page, finds __NEXT_DATA__, extracts listings."""
    logging.info(f"Fetching HTML URL: {url}")
    logging.info(f"With Params: {params}")

    try:
        response = requests.get(url, headers=headers, params=params, timeout=25) # Longer timeout for HTML
        logging.info(f"Actual Requested URL: {response.url}")
        response.raise_for_status()
        logging.info(f"Status Code: {response.status_code}")

        soup = BeautifulSoup(response.text, 'html.parser')
        next_data_script = soup.find('script', {'id': '__NEXT_DATA__'})

        if not next_data_script:
            logging.error("Could not find __NEXT_DATA__ script tag in HTML.")
            logging.debug(f"HTML Snippet: {response.text[:1000]}...") # Log beginning of HTML
            return None

        # Extract JSON - sometimes it might have weird escaping, attempt to clean
        json_text = next_data_script.string
        try:
            # Basic cleaning attempt (optional, remove if it causes issues)
            # json_text = json_text.replace('\\"', '"').replace("\\'", "'")
            data = json.loads(json_text)
        except json.JSONDecodeError as e:
            logging.error(f"Error decoding JSON from __NEXT_DATA__: {e}")
            logging.debug(f"JSON Text Snippet: {json_text[:1000]}...")
            # Attempt to find JSON block using regex as fallback (more fragile)
            match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', response.text, re.DOTALL)
            if match:
                try:
                    logging.warning("Attempting regex fallback for __NEXT_DATA__ JSON.")
                    data = json.loads(match.group(1))
                except json.JSONDecodeError as e_regex:
                     logging.error(f"Regex fallback also failed JSON decoding: {e_regex}")
                     return None
            else:
                return None


        # Navigate the JSON structure (adjust path if needed after inspection)
        if 'props' in data and 'pageProps' in data['props']:
            return data['props']['pageProps'] # Return the relevant part containing listings etc.
        else:
            logging.error("Unexpected structure in __NEXT_DATA__ JSON. 'props.pageProps' not found.")
            logging.debug(f"JSON Data Keys: {list(data.keys())}")
            return None

    except requests.exceptions.Timeout:
        logging.error("Request timed out fetching HTML.")
        return None
    except requests.exceptions.RequestException as e:
        logging.error(f"Error during HTML request: {e}")
        if response is not None:
            logging.error(f"Response Status Code: {response.status_code}")
            logging.error(f"Response Text: {response.text[:500]}...")
        return None

# --- extract_simple_info function (same as before) ---
# Ensure this function works with the structure found inside pageProps from __NEXT_DATA__
def extract_simple_info(listing):
    # (Keep the function from the previous working version - it should be compatible)
    try:
        details_map = {}
        vehicle_details = listing.get('vehicleDetails', [])
        if isinstance(vehicle_details, list):
             details_map = {item.get('ariaLabel'): item.get('data') for item in vehicle_details if item.get('ariaLabel')}

        price_eval_code = listing.get('price', {}).get('priceEvaluation')
        price_eval_map = { 1: "Top Price", 2: "Good Price", 3: "Fair Price", 4: "Slightly High", 5: "High Price", 6: "Unknown/No Eval" }
        price_evaluation_text = price_eval_map.get(price_eval_code, "Unknown/No Eval")
        power_str = details_map.get('Potencia'); power_cv = None
        if power_str and '(' in power_str and 'CV)' in power_str:
             try: power_cv = int(power_str.split('(')[1].split(' CV)')[0].strip())
             except (IndexError, ValueError): power_cv = None

        return {
            "id": listing.get('id'), "make": listing.get('vehicle', {}).get('make'),
            "model": listing.get('vehicle', {}).get('model'), "version": listing.get('vehicle', {}).get('modelVersionInput'),
            "price": listing.get('price', {}).get('priceFormatted'), "price_eur": listing.get('price', {}).get('priceUnformatted'),
            "price_evaluation_code": price_eval_code, "price_evaluation_text": price_evaluation_text,
            "mileage_km": details_map.get('Kilometraje'), "registration_date": details_map.get('Año'),
            "fuel_type": details_map.get('Tipo de combustible'), "power_cv_raw": power_str, "power_cv": power_cv,
            "transmission": details_map.get('Transmisión'), "location_city": listing.get('location', {}).get('city'),
            "location_zip": listing.get('location', {}).get('zip'), "seller_name": listing.get('seller', {}).get('companyName'),
            "seller_type": listing.get('seller', {}).get('type'),
            "listing_url": BASE_URL + listing.get('url') if listing.get('url') else None,
            "image_urls": listing.get('images', []) }
    except Exception as e:
        listing_id = listing.get('id', 'UNKNOWN_ID'); logging.error(f"Error parsing listing {listing_id}: {e}", exc_info=True); return None


def search_cars_html(make_name=None, model_name=None, page=1, filters={}):
    """Performs a car search by scraping the HTML page."""
    logging.info(f"--- Starting HTML search: Make='{make_name}', Model='{model_name}', Page={page}, Filters={filters} ---")

    make_id, model_id = get_make_model_ids(make_name, model_name)
    if make_name and not make_id: logging.error(f"Cannot proceed: Make '{make_name}' ID missing."); return None, 0, 0
    if model_name and not model_id: logging.error(f"Cannot proceed: Model '{model_name}' ID missing."); return None, 0, 0

    # Build components for HTML page request
    search_params = build_html_search_params(make_id, model_id, page, filters)
    search_headers = build_html_headers()
    search_url = build_html_search_url(make_name, model_name)

    # Fetch HTML and extract pageProps data
    page_props_data = fetch_and_extract_data_from_html(search_url, search_params, search_headers)

    # Process results
    if page_props_data:
        listings_data = page_props_data.get('listings', [])
        # Extract counts from pageProps if available, otherwise default
        total_results = page_props_data.get('numberOfResults', 0)
        total_pages = page_props_data.get('numberOfPages', 0)
        current_page_from_query = page_props_data.get('pageQuery', {}).get('page', page)

        logging.info(f"HTML Extraction successful. Found {total_results} total results across {total_pages} pages. (Page {current_page_from_query})")

        simplified_listings = [info for listing in listings_data if (info := extract_simple_info(listing)) is not None]

        return simplified_listings, total_results, total_pages
    else:
        logging.error("Failed to fetch HTML or extract data from __NEXT_DATA__.")
        return None, 0, 0

# --- Example Usage ---
if __name__ == "__main__":
    # Ensure you have installed necessary libraries:
    # pip install requests beautifulsoup4

    # Example 1: Search for Audi A4 via HTML scraping
    print("\n>>> EXAMPLE 1: Audi A4 (HTML Scrape) <<<")
    audi_filters = {'fregto': 2023, 'priceto': 30000}
    audi_results, total_audi, pages_audi = search_cars_html(
        make_name="Audi", model_name="a4", page=1, filters=audi_filters
    )
    if audi_results is not None:
        print(f"Found {len(audi_results)} Audi A4 listings on page 1 (Total: {total_audi})")
        # print(json.dumps(audi_results[:1], indent=4, ensure_ascii=False)) # Print first result
    else:
        print("Audi A4 HTML search failed.")

    # Example 2: Search for BMW (Make only) via HTML scraping
    print("\n>>> EXAMPLE 2: BMW (Make only) (HTML Scrape) <<<")
    bmw_filters = {'pricefrom': 15000, 'priceto': 25000}
    bmw_results, total_bmw, pages_bmw = search_cars_html(
        make_name="BMW", page=1, filters=bmw_filters
    )
    if bmw_results is not None:
        print(f"Found {len(bmw_results)} BMW listings on page 1 (Total: {total_bmw})")
    else:
        print("BMW HTML search failed.")

    # Example 3: General search via HTML scraping
    print("\n>>> EXAMPLE 3: General Search (fregfrom=2022) (HTML Scrape) <<<")
    general_filters = {'fregfrom': 2022}
    general_results, total_general, pages_general = search_cars_html(
        page=1, filters=general_filters
    )
    if general_results is not None:
        print(f"Found {len(general_results)} general listings on page 1 (Total: {total_general})")
    else:
        print("General HTML search failed.")