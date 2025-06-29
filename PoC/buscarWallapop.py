import requests
import csv
from urllib3.exceptions import InsecureRequestWarning
import time

# Suppress only the single InsecureRequestWarning
requests.packages.urllib3.disable_warnings(category=InsecureRequestWarning)

input_file = 'marcasCochesNet.csv'
output_file = 'modelsWallapop.csv'

with open(input_file, 'r') as infile, open(output_file, 'w', newline='') as outfile:
    reader = csv.reader(infile)
    writer = csv.writer(outfile)

    # Write header to the output CSV
    writer.writerow(['makeId', 'modelId', 'label'])

    # Skip header if it exists
    next(reader, None)

    for row in reader:
        make = row[1]  # Assuming the makeId is in the second column
        params = {'text': make}
        headers = {
            'Host': 'api.wallapop.com',
            'Sec-Ch-Ua': '"Not;A=Brand";v="24", "Chromium";v="128"',
            'X-Deviceid': '7f920055-8560-404a-8d77-a28129141d2e',
            'X-Deviceos': '0',
            'Accept-Language': 'es,en-US;q=0.9',
            'Sec-Ch-Ua-Mobile': '?0',
            'Mpid': '-5060784939349269185',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.120 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Deviceos': '0',
            'X-Appversion': '83000',
            'Sec-Ch-Ua-Platform': '"Linux"',
            'Origin': 'https://es.wallapop.com',
            'Sec-Fetch-Site': 'same-site',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Dest': 'empty',
            'Referer': 'https://es.wallapop.com/',
            'Priority': 'u=1, i',
            'Connection': 'keep-alive',
        }

        response = requests.get(
            'https://api.wallapop.com/api/v3/suggesters/cars/brands-and-models',
            params=params,
            headers=headers,
            verify=False,
        )

        results = response.json()

        if len(results) > 1:
            print(f"Processed make: {make}")
            for result in results[1:]:  # Skip the first result
                writer.writerow([make, result.get('model', ''), result.get('brand', '')])
        else:
            print(f"No results for make: {make}")
            writer.writerow([make, 'no tiene', make])

        # Add a small delay to avoid overwhelming the server
        time.sleep(0.5)

print("Processing complete. Results saved to", output_file)