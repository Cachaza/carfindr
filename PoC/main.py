import requests
import csv
from urllib3.exceptions import InsecureRequestWarning
import time

# Suppress only the single InsecureRequestWarning
requests.packages.urllib3.disable_warnings(category=InsecureRequestWarning)

headers = {
    'Host': 'web.gw.coches.net',
    'Sec-Ch-Ua': '"Not;A=Brand";v="24", "Chromium";v="128"',
    'Sec-Ch-Ua-Platform': '"Linux"',
    'X-Schibsted-Tenant': 'coches',
    'X-Adevinta-Referer': 'https://www.coches.net/',
    'Accept-Language': 'en-US,en;q=0.9',
    'Sec-Ch-Ua-Mobile': '?0',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.120 Safari/537.36',
    'X-Adevinta-Page-Url': 'https://www.coches.net/search/',
    'X-Adevinta-Amcvid': '23286947342458817021030267491651161487',
    'Accept': 'application/json, text/plain, */*',
    'X-Adevinta-Channel': 'web-desktop',
    'X-Adevinta-Session-Id': '0935cac0-d80e-4b00-b9ec-6533ad5e2033',
    'X-Adevinta-Euconsent-V2': 'CQF0FMAQF0FMAAHABBENBJFsAP_gAEPgAAiQKftV_G__bWlr8X73aftkeY1P9_h77sQxBhfJE-4FzLvW_JwXx2ExNA36tqIKmRIAu3bBIQNlGJDUTVCgaogVryDMaE2coTNKJ6BkiFMRM2dYCF5vm4tj-QKY5vr991dx2B-t7dr83dzyz4VHn3a5_2a0WJCdA5-tDfv9bROb-9IOd_x8v4v8_F_rE2_eT1l_tWvp7D9-cts7_XW89_fff_9Ln_-uB_-_3_gp4ASYaFRAGWBISEGgYQQIAVBWEBFAgAAABIGiAgBMGBTsDAJdYSIAQAoABggBAACDIAEAAAEACEQAQAFAgAAgECgADAAgGAgAIGAAEAFgIBAACA6BimBBAoFgAkZkRCmBCEAkEBLZUIJAECCuEIRZ4BEAiJgoAAAAACsAAQFgsDiSQEqEggS4g2gAAIAEAggAKEEnJgACAM2WoPBk2jK0wDR8wSIaYBkAQAAA.f_wACHwAAAAA',
    'Origin': 'https://www.coches.net',
    'Sec-Fetch-Site': 'same-site',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
    'Referer': 'https://www.coches.net/',
    'Priority': 'u=1, i',
}

def process_make_ids(input_file, output_file):
    with open(input_file, 'r') as infile, open(output_file, 'w', newline='') as outfile:
        reader = csv.reader(infile)
        writer = csv.writer(outfile)
        
        # Write header to the output CSV
        writer.writerow(['makeId', 'id', 'label'])
        
        # Skip header if it exists
        next(reader, None)
        
        for row in reader:
            make_id = row[0]  # Assuming the makeId is in the first column
            params = {'makeId': make_id}
            
            try:
                response = requests.get('https://web.gw.coches.net/models', params=params, headers=headers, verify=False)
                response.raise_for_status()  # Raise an exception for bad status codes
                
                items = response.json().get('items', [])
                for item in items:
                    writer.writerow([make_id, item['id'], item['label']])
                
                print(f"Processed makeId: {make_id}")
                time.sleep(1)  # Add a delay to avoid overwhelming the server
            
            except requests.exceptions.RequestException as e:
                print(f"Error processing makeId {make_id}: {e}")
                continue

# Usage
input_csv = 'marcasCochesNet.csv'  # Replace with your input CSV file name
output_csv = 'modelsCochesNet.csv'  # Output file name
process_make_ids(input_csv, output_csv)