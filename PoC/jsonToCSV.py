import pandas as pd
import json

# Suponiendo que tienes tu JSON en un archivo llamado 'datos.json'
with open('cochesCom/marcas.json', 'r') as f:
    data = json.load(f)

# Crear un DataFrame de pandas a partir de la lista de diccionarios
df = pd.DataFrame(data)

# Guardar el DataFrame como un archivo CSV
df.to_csv('cochesCom/marcas.csv', index=False)

print("¡Archivo CSV creado exitosamente!")