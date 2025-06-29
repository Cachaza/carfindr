import csv
from unidecode import unidecode

def normalize_text(text):
    return unidecode(str(text).lower().strip())

def read_csv(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        return list(csv.DictReader(file))

def write_csv(file_path, fieldnames, rows):
    with open(file_path, 'w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

# Read the input files
dictionary_data = read_csv('dictionaryCochesNetMilanunciosMarcas.csv')
coches_com_data = read_csv('cochesCom/marcas.csv')

# Create a set of all normalized names from the dictionary file
dictionary_names = set()
for row in dictionary_data:
    for field in ['cochesNetId', 'milanunciosId', 'wallapopId']:
        if row[field] and row[field].lower() != 'none':
            dictionary_names.add(normalize_text(row[field]))

# Process the dictionary data and add the new field
unmatched_ids = []
matched_coches_com_ids = set()

for row in dictionary_data:
    row['cochesComId'] = 'None'
    for field in ['cochesNetId', 'milanunciosId', 'wallapopId']:
        normalized_name = normalize_text(row[field])
        for coches_com_row in coches_com_data:
            if normalize_text(coches_com_row['text']) == normalized_name:
                row['cochesComId'] = coches_com_row['uuid']
                matched_coches_com_ids.add(coches_com_row['uuid'])
                break
        if row['cochesComId'] != 'None':
            break

# Find unmatched cochesComIds
for row in coches_com_data:
    if row['uuid'] not in matched_coches_com_ids:
        uuidPlusText = row['uuid'] + ',' + row['text']
        unmatched_ids.append(uuidPlusText)

# Write the updated data to a new CSV file
fieldnames = list(dictionary_data[0].keys())
write_csv('updated_dictionary.csv', fieldnames, dictionary_data)

# Print unmatched IDs
print("Unmatched cochesCom IDs:")
print(', '.join(unmatched_ids))