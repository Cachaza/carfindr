import csv
from collections import defaultdict

# Read marcas.csv and create a dictionary of brands
brands = {}
with open('marcas.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        brands[row['text'].upper()] = row['uuid']

# Function to find the brand in the model text
def find_brand(model_text, brands):
    model_words = model_text.upper().split()
    for i in range(len(model_words), 0, -1):
        potential_brand = ' '.join(model_words[:i])
        if potential_brand in brands:
            return potential_brand, brands[potential_brand]
    return None, ''

# Read modelos.csv and process the data
models = []
with open('modelos.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        model = row['text']
        brand, brand_id = find_brand(model, brands)
        models.append({
            'uuid': row['uuid'],
            'type': row['type'],
            'text': row['text'],
            'brandId': brand_id
        })

# Write the new CSV file
with open('modelos_with_brand_id.csv', 'w', newline='') as f:
    fieldnames = ['uuid', 'type', 'text', 'brandId']
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    
    writer.writeheader()
    for model in models:
        writer.writerow(model)

print("New CSV file 'modelos_with_brand_id.csv' has been created.")