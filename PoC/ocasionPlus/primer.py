import requests
import json
from bs4 import BeautifulSoup
import logging
import re

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Configuration ---
BASE_URL = "https://www.ocasionplus.com/coches-segunda-mano"
# Use a realistic User-Agent from the HAR file or your browser
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:134.0) Gecko/20100101 Firefox/134.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'DNT': '1',
    'Sec-GPC': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none', # Adjust if navigating from another page
    'Sec-Fetch-User': '?1',
    'Priority': 'u=1',
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache',
}

def get_ocasionplus_cars(filters=None, page=1):
    """
    Fetches car listings from OcasionPlus based on filters.

    Args:
        filters (dict, optional): A dictionary of query parameters for filtering.
                                   Examples: {'brand': 'Audi', 'model': 'Audi_A3', 'province': 'Madrid'}
                                   Common keys: brand, model, priceMin, priceMax, kmsMin, kmsMax,
                                                yearMin, yearMax, fuelType, bodywork, province, orderBy etc.
        page (int, optional): The page number to fetch. Defaults to 1.

    Returns:
        list: A list of dictionaries, each representing a car, or None if an error occurs.
    """
    params = filters.copy() if filters else {}
    if page > 1:
        params['page'] = page
    # Ensure 'v2' is present as seen in the referer, might be important
    if 'v2' not in params:
        params['v2'] = '' # Add it as an empty parameter if not provided

    logging.info(f"Requesting URL: {BASE_URL} with params: {params}")

    try:
        response = requests.get(BASE_URL, headers=HEADERS, params=params, timeout=20)
        response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)
        logging.info(f"Successfully fetched page {page}. Status: {response.status_code}")

        # --- Data Extraction using BeautifulSoup and __NEXT_DATA__ ---
        soup = BeautifulSoup(response.text, 'html.parser')
        script_tag = soup.find('script', {'id': '__NEXT_DATA__', 'type': 'application/json'})

        if not script_tag:
            logging.error("Could not find __NEXT_DATA__ script tag.")
            # Fallback: Try regex if ID changes (less reliable)
            script_content_match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', response.text, re.DOTALL)
            if script_content_match:
                 script_json = script_content_match.group(1)
                 logging.info("Found script content using regex fallback.")
            else:
                 logging.error("Could not find script content using regex either.")
                 # Save HTML for debugging if extraction fails
                 with open("ocasionplus_error.html", "w", encoding="utf-8") as f:
                     f.write(response.text)
                 logging.info("Saved error HTML to ocasionplus_error.html")
                 return None
        else:
            script_json = script_tag.string

        data = json.loads(script_json)

        # --- Locating the Car Data ---
        # This path needs careful inspection of the actual JSON output.
        # Based on typical Next.js structures and potential updates, try common paths.
        # Path identified by inspection (might change if website updates):
        try:
            # Path seen in many Next.js apps with Redux/Zustand state hydration
            car_list = data['props']['pageProps']['initialReduxState']['vehicles']['data']['vehicles']['list']
            logging.info(f"Found {len(car_list)} cars in initialReduxState path.")
            return car_list
        except KeyError:
            logging.warning("Could not find cars at ['props']['pageProps']['initialReduxState']['vehicles']['data']['vehicles']['list']")

        try:
            # Alternative path sometimes used
            car_list = data['props']['pageProps']['vehicles']['data']['vehicles']['list']
            logging.info(f"Found {len(car_list)} cars in alternative pageProps path.")
            return car_list
        except KeyError:
             logging.warning("Could not find cars at ['props']['pageProps']['vehicles']['data']['vehicles']['list']")


        # Add more potential paths here if needed after inspecting the JSON output
        # e.g., data['props']['pageProps']['initialData']['vehicles'] etc.

        logging.error("Could not locate car list within the extracted __NEXT_DATA__ JSON.")
        # Save JSON for debugging if car list isn't found in expected paths
        with open("ocasionplus_next_data.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        logging.info("Saved __NEXT_DATA__ JSON to ocasionplus_next_data.json")
        return None


    except requests.exceptions.RequestException as e:
        logging.error(f"Request failed: {e}")
        return None
    except json.JSONDecodeError as e:
        logging.error(f"Failed to parse JSON from script tag: {e}")
        # Save HTML for debugging JSON errors
        with open("ocasionplus_json_error.html", "w", encoding="utf-8") as f:
            f.write(response.text)
        logging.info("Saved error HTML to ocasionplus_json_error.html")
        return None
    except KeyError as e:
        logging.error(f"Could not find expected key in JSON data: {e}")
        # Save JSON for debugging key errors
        if 'data' in locals():
            with open("ocasionplus_key_error.json", "w", encoding="utf-8") as f:
                 json.dump(data, f, indent=2)
            logging.info("Saved JSON data to ocasionplus_key_error.json")
        return None
    except Exception as e:
        logging.error(f"An unexpected error occurred: {e}")
        # Save HTML for debugging unexpected errors
        if 'response' in locals() and hasattr(response, 'text'):
             with open("ocasionplus_unexpected_error.html", "w", encoding="utf-8") as f:
                 f.write(response.text)
             logging.info("Saved error HTML to ocasionplus_unexpected_error.html")
        return None


# --- Example Usage ---
if __name__ == "__main__":
    # Define the filters based on the HAR file referer or desired search
    search_filters = {
        'brand': 'Audi',
        'model': 'Audi_A3',
        'orderBy': 'morePopular', # Common options: 'lowerPrice', 'higherPrice', 'lowerKm', 'higherKm', 'lastPublished'
        # Add other filters as needed:
        # 'province': 'Madrid',
        # 'yearMin': 2018,
        # 'priceMax': 25000,
        # 'fuelType': 'GASOLINA' # DIESEL, ELECTRICO, HIBRIDO_ENCHUFABLE, GLP, etc.
    }

    logging.info("--- Starting OcasionPlus Scraper ---")
    cars_data = get_ocasionplus_cars(filters=search_filters, page=1)

    if cars_data:
        logging.info(f"Successfully retrieved {len(cars_data)} car listings.")
        # Save the results to a JSON file
        output_filename = f"ocasionplus_results_{search_filters.get('brand', 'all')}_{search_filters.get('model', 'all')}_page1.json"
        try:
            with open(output_filename, 'w', encoding='utf-8') as f:
                json.dump(cars_data, f, ensure_ascii=False, indent=2)
            logging.info(f"Results saved to {output_filename}")
        except Exception as e:
            logging.error(f"Could not save results to file: {e}")

        # Optionally print the first few results
        # print("\n--- First 3 Results ---")
        # print(json.dumps(cars_data[:3], indent=2, ensure_ascii=False))
    else:
        logging.warning("Could not retrieve car data.")

    logging.info("--- Scraper finished ---")