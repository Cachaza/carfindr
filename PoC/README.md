# CarFindr PoC - Investigación de APIs 🔬

**PoC (Proof of Concept)** contiene scripts de investigación y análisis para entender las APIs de las diferentes plataformas de coches de segunda mano. Estos scripts fueron fundamentales para desarrollar la funcionalidad de búsqueda del proyecto principal.

## 🎯 Objetivo

El objetivo de esta carpeta es:
- **Analizar APIs** de Wallapop, Milanuncios y Coches.net
- **Extraer datos** de marcas y modelos de coches
- **Crear diccionarios** de mapeo entre plataformas
- **Validar endpoints** y parámetros de búsqueda
- **Generar datasets** para la base de datos

## 🛠️ Stack Tecnológico

### Core
- **Python 3.11+** - Lenguaje principal
- **Requests** - Cliente HTTP
- **Pandas** - Manipulación de datos
- **JSON** - Procesamiento de respuestas

### Análisis
- **BeautifulSoup** - Web scraping (cuando sea necesario)
- **Haralyzer** - Análisis de archivos HAR
- **CSV** - Exportación de datos
- **Jupyter Notebooks** - Análisis interactivo

### Gestión de Dependencias
- **uv** - Gestor de paquetes rápido
- **pyproject.toml** - Configuración del proyecto
- **Virtual environments** - Entornos aislados

## 📁 Estructura del Proyecto

```
PoC/
├── main.py                           # Script principal de análisis
├── pyproject.toml                    # Configuración del proyecto
├── uv.lock                          # Lock file de dependencias
├── README.md                        # Este archivo
│
├── wallapop/                        # Análisis de Wallapop
│   ├── wallapop.har                # Archivo HAR capturado
│   ├── wallapopBodyType.json       # Tipos de carrocería
│   ├── wallapopEngines.json        # Tipos de motor
│   └── wallapopGearBox.json        # Tipos de transmisión
│
├── milanuncios/                     # Análisis de Milanuncios
│   ├── apiTransform.py             # Transformación de API
│   ├── contarCuantosResultadosHay.py # Contador de resultados
│   └── marcas.json                 # Catálogo de marcas
│
├── cochesCom/                       # Análisis de Coches.com
│   ├── anadirBrandId.py            # Añadir IDs de marcas
│   ├── marcas.csv                  # Datos de marcas
│   ├── marcas.json                 # Marcas en formato JSON
│   ├── marcasConCount.csv          # Marcas con conteo
│   ├── marcasConCount.json         # Marcas con conteo (JSON)
│   ├── modelos.csv                 # Datos de modelos
│   ├── modelos.json                # Modelos en formato JSON
│   └── modelos_with_brand_id.csv   # Modelos con ID de marca
│
├── ocasionPlus/                     # Análisis de OcasionPlus
│   ├── primer.py                   # Primer script de análisis
│   ├── req.har                     # Archivo HAR
│   └── todo.html                   # Página capturada
│
├── autoscout24/                     # Análisis de AutoScout24
│   ├── primera.py                  # Primer script
│   └── v2.py                       # Segunda versión
│
├── walapop/                         # Análisis adicional de Wallapop
│   ├── wallapop.har                # Archivo HAR
│   └── soloUnResultado.json        # Resultado de prueba
│
├── wallapopExtras/                  # Datos adicionales de Wallapop
│   ├── wallapopBodyType.json       # Tipos de carrocería
│   ├── wallapopEngines.json        # Tipos de motor
│   └── wallapopGearBox.json        # Tipos de transmisión
│
├── csv-data/                        # Datos CSV generados
│   ├── marcas.csv                  # Catálogo de marcas
│   ├── modelos.csv                 # Catálogo de modelos
│   ├── dictionaryCochesNetMilanunciosMarcas.csv
│   ├── dictionaryCochesNetMilanunciosModelos.csv
│   └── updated_dictionary.csv      # Diccionario actualizado
│
└── json-data/                       # Datos JSON generados
    ├── alfa-romeo_giulietta_page1_filtered.json
    ├── all_cars_page1_filtered.json
    ├── audi_page1_filtered.json
    └── ocasionplus_rsc_results_Audi_page1.json
```

## 🚀 Instalación y Configuración

### 1. Configurar entorno Python
```bash
# Instalar uv (gestor de paquetes)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Crear entorno virtual
uv venv

# Activar entorno
source .venv/bin/activate  # Linux/Mac
# o
.venv\Scripts\activate     # Windows
```

### 2. Instalar dependencias
```bash
# Instalar desde pyproject.toml
uv pip install -e .

# O instalar manualmente
uv pip install requests pandas beautifulsoup4 haralyzer
```

### 3. Configurar variables de entorno
```bash
# Crear archivo .env si es necesario
echo "API_KEY=your_api_key" > .env
```

## 🔍 Scripts Principales

### 1. **main.py** - Script Principal
```python
# Análisis general de todas las plataformas
python main.py

# Funcionalidades:
- Análisis de archivos HAR
- Extracción de datos de APIs
- Generación de diccionarios
- Validación de endpoints
```

### 2. **Análisis de Wallapop**
```bash
cd wallapop/
python -c "
import json
with open('wallapop.har', 'r') as f:
    har_data = json.load(f)
# Analizar requests y responses
"
```

### 3. **Análisis de Milanuncios**
```bash
cd milanuncios/
python apiTransform.py
python contarCuantosResultadosHay.py
```

### 4. **Análisis de Coches.com**
```bash
cd cochesCom/
python anadirBrandId.py
python mergeCochesComModels.py
```

## 📊 Análisis de Datos

### Extracción de Marcas y Modelos
```python
# Ejemplo de extracción de marcas
import pandas as pd

def extract_brands_from_api():
    # Hacer request a la API
    response = requests.get(API_ENDPOINT)
    data = response.json()
    
    # Extraer marcas
    brands = []
    for item in data['brands']:
        brands.append({
            'id': item['id'],
            'name': item['name'],
            'platform': 'wallapop'
        })
    
    # Guardar en CSV
    df = pd.DataFrame(brands)
    df.to_csv('marcas.csv', index=False)
```

### Creación de Diccionarios
```python
# Mapeo entre plataformas
def create_brand_dictionary():
    wallapop_brands = load_wallapop_brands()
    milanuncios_brands = load_milanuncios_brands()
    
    dictionary = {}
    for wp_brand in wallapop_brands:
        for ma_brand in milanuncios_brands:
            if wp_brand['name'].lower() == ma_brand['name'].lower():
                dictionary[wp_brand['id']] = {
                    'wallapop': wp_brand['id'],
                    'milanuncios': ma_brand['id']
                }
    
    return dictionary
```

## 🔧 Utilidades

### Análisis de Archivos HAR
```python
from haralyzer import HarParser

def analyze_har_file(har_path):
    with open(har_path, 'r') as f:
        har_data = json.load(f)
    
    har_parser = HarParser(har_data)
    
    # Extraer requests de búsqueda
    search_requests = []
    for entry in har_parser.har_data['log']['entries']:
        if 'search' in entry['request']['url']:
            search_requests.append(entry)
    
    return search_requests
```

### Limpieza de Datos CSV
```python
import pandas as pd

def clean_csv_data(csv_path):
    df = pd.read_csv(csv_path)
    
    # Eliminar duplicados
    df = df.drop_duplicates()
    
    # Limpiar nombres
    df['name'] = df['name'].str.strip()
    
    # Filtrar valores nulos
    df = df.dropna(subset=['name'])
    
    return df
```

## 📈 Generación de Datasets

### Proceso de Generación
1. **Extracción**: Obtener datos de APIs
2. **Limpieza**: Eliminar duplicados y valores nulos
3. **Normalización**: Estandarizar formatos
4. **Mapeo**: Crear diccionarios entre plataformas
5. **Validación**: Verificar integridad de datos
6. **Exportación**: Guardar en CSV/JSON

### Scripts de Generación
```bash
# Generar catálogo de marcas
python generate_brands_catalog.py

# Generar catálogo de modelos
python generate_models_catalog.py

# Crear diccionarios de mapeo
python create_mapping_dictionaries.py

# Validar datos generados
python validate_generated_data.py
```

## 🔍 Análisis de APIs

### Wallapop API
```python
# Endpoint principal
WALLAPOP_API = "https://api.wallapop.com/api/v3/cars/search"

# Headers típicos
headers = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:134.0) Gecko/20100101 Firefox/134.0',
    'Accept': 'application/json, text/plain, */*',
    'Origin': 'https://es.wallapop.com',
    'Referer': 'https://es.wallapop.com/'
}

# Parámetros de búsqueda
params = {
    'category_ids': '100',
    'filters_source': 'side_bar_filters',
    'brand': 'audi',
    'model': 'a3',
    'min_sale_price': '10000',
    'max_sale_price': '30000'
}
```

### Milanuncios API
```python
# Endpoint principal
MILANUNCIOS_API = "https://api.milanuncios.com/search"

# Headers específicos
headers = {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
}

# Estructura de request
payload = {
    'category': 'vehicles',
    'filters': {
        'brand': 'audi',
        'model': 'a3',
        'price_min': 10000,
        'price_max': 30000
    }
}
```

## 📊 Datos Generados

### Archivos CSV Principales
- `marcas.csv` - Catálogo completo de marcas
- `modelos.csv` - Catálogo completo de modelos
- `dictionaryCochesNetMilanunciosMarcas.csv` - Mapeo de marcas
- `dictionaryCochesNetMilanunciosModelos.csv` - Mapeo de modelos

### Archivos JSON Principales
- `marcas.json` - Marcas en formato JSON
- `modelos.json` - Modelos en formato JSON
- `wallapopBodyType.json` - Tipos de carrocería
- `wallapopEngines.json` - Tipos de motor

## 🧪 Testing y Validación

### Validación de Datos
```python
def validate_brand_data():
    df = pd.read_csv('marcas.csv')
    
    # Verificar que no hay duplicados
    assert len(df) == len(df.drop_duplicates())
    
    # Verificar que no hay valores nulos en campos importantes
    assert df['name'].notna().all()
    
    # Verificar que los IDs son únicos
    assert len(df['id']) == len(df['id'].unique())
    
    print("✅ Datos de marcas válidos")
```

### Tests de APIs
```python
def test_api_endpoints():
    # Test Wallapop
    response = requests.get(WALLAPOP_API, params=test_params)
    assert response.status_code == 200
    
    # Test Milanuncios
    response = requests.get(MILANUNCIOS_API, headers=headers)
    assert response.status_code == 200
    
    print("✅ APIs funcionando correctamente")
```

## 🚀 Uso Avanzado

### Análisis de Rendimiento
```python
import time

def benchmark_api_calls():
    start_time = time.time()
    
    # Hacer múltiples requests
    for i in range(10):
        response = requests.get(API_ENDPOINT)
    
    end_time = time.time()
    print(f"Tiempo total: {end_time - start_time:.2f} segundos")
```

### Generación de Reportes
```python
def generate_analysis_report():
    report = {
        'total_brands': len(brands_df),
        'total_models': len(models_df),
        'platforms_analyzed': ['wallapop', 'milanuncios', 'cochesnet'],
        'data_quality_score': calculate_quality_score(),
        'generated_files': list_generated_files()
    }
    
    with open('analysis_report.json', 'w') as f:
        json.dump(report, f, indent=2)
```

## 🔧 Mantenimiento

### Limpieza de Datos Antiguos
```bash
# Eliminar archivos temporales
find . -name "*.tmp" -delete

# Limpiar archivos de log
find . -name "*.log" -delete

# Comprimir archivos HAR grandes
gzip wallapop.har
```

### Actualización de Catálogos
```bash
# Actualizar marcas y modelos
python update_catalogs.py

# Regenerar diccionarios
python regenerate_dictionaries.py

# Validar cambios
python validate_updates.py
```

## 🤝 Contribución

1. Fork el repositorio
2. Crea una rama para tu análisis (`git checkout -b analysis/nueva-plataforma`)
3. Implementa el script de análisis
4. Añade tests de validación
5. Documenta los hallazgos
6. Abre un Pull Request

### Guías de Contribución
- Usa Python 3.11+
- Sigue PEP 8 para estilo de código
- Documenta todas las APIs analizadas
- Incluye ejemplos de uso
- Añade validaciones de datos

## 📝 Notas Importantes

### Consideraciones Legales
- **Respetar robots.txt** de cada plataforma
- **No hacer requests excesivos** que puedan sobrecargar los servidores
- **Usar delays** entre requests cuando sea necesario
- **Revisar términos de servicio** de cada API

### Limitaciones
- Algunas APIs pueden requerir autenticación
- Los endpoints pueden cambiar sin previo aviso
- Algunos datos pueden estar protegidos por CAPTCHA
- Rate limiting puede afectar la extracción masiva

## 📞 Contacto

Para preguntas sobre el análisis de APIs o contribuciones:
- **Issues**: Crear un issue en el repositorio
- **Discusiones**: Usar la sección de discusiones de GitHub

---

**CarFindr PoC** - Investigación y análisis de APIs para encontrar tu coche ideal 🔬📊
