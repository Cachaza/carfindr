import csv
from collections import defaultdict

mainDict = "dictionaryCochesNetMilanunciosModelos.csv"
brandDict = "dictionaryCochesNetMilanunciosMarcas.csv"
cochesCom = "cochesCom/modelos_with_brand_id.csv"
finalCSV = "updated_dictionary.csv"
# Helper function to clean brand names
def clean_brand_name(name):
    return name.upper()

# Read the brand dictionary CSV
brand_dict = {}
with open(brandDict, 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        clean_label = clean_brand_name(row['label'])
        brand_dict[clean_label] = {
            'cochesNetId': row['cochesNetId'],
            'cochesComId': row['cochesComId']
        }

# Read the cochescom CSV
cochescom_dict = defaultdict(dict)
with open(cochesCom, 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        brand_id = row['brandId']
        model_id = row['modelId']
        full_name = row['text'].upper()
        for brand in brand_dict.keys():
            if full_name.startswith(brand):
                model_name = full_name[len(brand):].strip()
                cochescom_dict[brand_id][model_name] = model_id
                break

# Read and update the main dictionary CSV
updated_rows = []
with open(mainDict, 'r') as f:
    reader = csv.DictReader(f)
    headers = reader.fieldnames + ['cochesComMarcaId', 'cochesComModeloId']
    
    for row in reader:
        clean_brand = clean_brand_name(row['milanunciosMarcaId'])
        if clean_brand in brand_dict:
            coches_net_id = brand_dict[clean_brand]['cochesNetId']
            coches_com_marca_id = brand_dict[clean_brand]['cochesComId']
            
            if coches_com_marca_id in cochescom_dict:
                model_name = clean_brand_name(row['milanunciosModeloId'].strip('*'))
                coches_com_modelo_id = cochescom_dict[coches_com_marca_id].get(model_name, 'None')
            else:
                coches_com_modelo_id = 'None'
        else:
            coches_com_marca_id = 'None'
            coches_com_modelo_id = 'None'
        
        row['cochesComMarcaId'] = coches_com_marca_id
        row['cochesComModeloId'] = coches_com_modelo_id
        updated_rows.append(row)

# Write the updated CSV
with open(finalCSV, 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    writer.writerows(updated_rows)

print("Updated CSV has been created as ", finalCSV) 