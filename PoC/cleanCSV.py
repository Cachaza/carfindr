import pandas as pd




import os

def eliminar_duplicados(archivo_entrada, archivo_salida):
    try:
        # Ruta absoluta al archivo
        ruta_archivo = os.path.abspath(archivo_entrada)

        # Leer el CSV
        df = pd.read_csv(ruta_archivo)

        # rellenar todos los campos type con make
        df['type'] = df['type'].fillna('model')

        # Escribir el resultado
        df.to_csv(archivo_salida, index=False)

        print("Duplicados eliminados exitosamente.")
    except FileNotFoundError:
        print("El archivo no se encontró.")
    except Exception as e:
        print("Ocurrió un error:", e)

# Ejemplo de uso:
archivo_entrada = "cochesCom/modelos.csv"
archivo_salida = "cochesCom/modelosLlenos.csv"
eliminar_duplicados(archivo_entrada, archivo_salida)

