package wallapop

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"time"

	// Anteriormente: "github.com/cachaza/searchNotifier/internal/common"
	// Ahora: importar desde el paquete searcher para UnifiedSearchRequest
	"github.com/cachaza/searchNotifier/internal/searcher" // Import corregido para UnifiedSearchRequest
)

// Las constantes permanecen igual
const (
	sourceName         = "wallapop"
	apiBaseURL         = "https://api.wallapop.com/api/v3/search/section"
	targetResults      = 40
	maxFetchesPerBatch = 5
)

type wallapopAPIResponse struct {
	Data struct {
		Section struct {
			Items []json.RawMessage `json:"items"`
		} `json:"section"`
	} `json:"data"`
	Meta struct {
		NextPage string `json:"next_page"`
	} `json:"meta"`
}

// wallapopCarWrapper: Coincide con la estructura externa { id, type, content }
type wallapopCarWrapper struct {
	ID      string             `json:"id"`      // ID de nivel superior
	Type    string             `json:"type"`    // Tipo de nivel superior
	Content wallapopCarContent `json:"content"` // El objeto content anidado
}

// wallapopCarContent: Coincide con los campos *dentro* del objeto "content"
type wallapopCarContent struct {
	// ID parece duplicado en el tipo React? Verificar si la API lo incluye aquí también. Omitiendo por ahora, asumiendo que el ID de nivel superior es el principal.
	// ID           string  `json:"id"`
	Title           string                     `json:"title"`
	Storytelling    string                     `json:"storytelling"`               // Agregado basado en el tipo React
	Distance        *float64                   `json:"distance,omitempty"`         // Puntero para float opcional
	Images          []wallapopImageGo          `json:"images"`                     // Usar struct específico para imágenes
	User            *wallapopUserGo            `json:"user,omitempty"`             // Usar struct específico para usuario (puntero si es opcional)
	Flags           *wallapopFlagsGo           `json:"flags,omitempty"`            // Usar struct específico para flags
	VisibilityFlags *wallapopVisibilityFlagsGo `json:"visibility_flags,omitempty"` // Agregado basado en el tipo React
	Price           float64                    `json:"price"`
	Currency        string                     `json:"currency"`
	WebSlug         *string                    `json:"web_slug,omitempty"`    // Renombrado de web_slug -> WebSlug, usar puntero
	CategoryID      *int                       `json:"category_id,omitempty"` // Agregado basado en el tipo React
	Brand           *string                    `json:"brand,omitempty"`
	Model           *string                    `json:"model,omitempty"`
	Year            *int                       `json:"year,omitempty"`
	Version         *string                    `json:"version,omitempty"` // Agregado basado en el tipo React
	Km              *int                       `json:"km,omitempty"`
	Engine          *string                    `json:"engine,omitempty"`
	Gearbox         *string                    `json:"gearbox,omitempty"`

	Horsepower *float64 `json:"horsepower,omitempty"` // Agregado basado en el tipo React, asumiendo float
	Favorited  *bool    `json:"favorited,omitempty"`  // Agregado basado en el tipo React

	// --- CAMBIAR ESTAS LÍNEAS ---
	CreationDate     *string `json:"creation_date,omitempty"`     // Cambiado de *int64 a *string
	ModificationDate *string `json:"modification_date,omitempty"` // Cambiado de *int64 a *string
	// --- FIN DE CAMBIOS ---

	Location         *wallapopLocationGo `json:"location,omitempty"`          // Usar struct específico para ubicación
	Shipping         *wallapopShippingGo `json:"shipping,omitempty"`          // Agregado basado en el tipo React
	SupportsShipping *bool               `json:"supports_shipping,omitempty"` // Agregado basado en el tipo React
}

// wallapopImageGo: Coincide con la estructura del objeto imagen
type wallapopImageGo struct {
	Original       string `json:"original"`
	Xsmall         string `json:"xsmall"`
	Small          string `json:"small"`
	Large          string `json:"large"`
	Medium         string `json:"medium"`
	Xlarge         string `json:"xlarge"`
	OriginalWidth  *int   `json:"original_width,omitempty"` // Usar punteros si los campos pueden faltar
	OriginalHeight *int   `json:"original_height,omitempty"`
}

// wallapopUserGo: Coincide con la estructura del objeto usuario anidado
type wallapopUserGo struct {
	MicroName string           `json:"micro_name"`
	ID        string           `json:"id"`
	Image     *wallapopImageGo `json:"image,omitempty"` // ¿Puede faltar la imagen del usuario? Usar puntero si es así.
	Online    bool             `json:"online"`
	Kind      string           `json:"kind"`
}

// wallapopFlagsGo: Coincide con la estructura del objeto flags anidado
type wallapopFlagsGo struct {
	Pending  bool `json:"pending"`
	Sold     bool `json:"sold"`
	Reserved bool `json:"reserved"`
	Banned   bool `json:"banned"`
	Expired  bool `json:"expired"`
	Onhold   bool `json:"onhold"` // Verificar clave JSON exacta ('onhold' o 'onHold')
}

// wallapopVisibilityFlagsGo: Coincide con la estructura del objeto visibility_flags anidado
type wallapopVisibilityFlagsGo struct {
	Bumped        bool `json:"bumped"`
	Highlighted   bool `json:"highlighted"`
	Urgent        bool `json:"urgent"`
	CountryBumped bool `json:"country_bumped"`
	Boosted       bool `json:"boosted"`
}

// wallapopLocationGo: Coincide con la estructura del objeto location anidado
type wallapopLocationGo struct {
	PostalCode  string `json:"postal_code"`
	CountryCode string `json:"country_code"`
	City        string `json:"city"`
	// Agregar latitude/longitude si existen en el objeto location de la API
	// Latitude    *float64 `json:"latitude,omitempty"`
	// Longitude   *float64 `json:"longitude,omitempty"`
}

// wallapopShippingGo: Coincide con la estructura del objeto shipping anidado
type wallapopShippingGo struct {
	ItemIsShippable     bool    `json:"item_is_shippable"`
	UserAllowsShipping  bool    `json:"user_allows_shipping"`
	CostConfigurationID *string `json:"cost_configuration_id"` // String o null
}

// --- Implementación del Cliente ---

type Client struct {
	httpClient *http.Client
}

func NewClient() *Client {
	return &Client{
		httpClient: &http.Client{Timeout: 15 * time.Second},
	}
}

func (c *Client) SourceName() string {
	return sourceName
}

// El método Search ahora retorna []json.RawMessage
// El tipo de parámetro ha sido cambiado de *common.UnifiedSearchRequest a *searcher.UnifiedSearchRequest
func (c *Client) Search(ctx context.Context, params *searcher.UnifiedSearchRequest) ([]json.RawMessage, map[string]interface{}, error) {
	log.Printf("[%s] Iniciando búsqueda", sourceName)

	var accumulatedRawCars []json.RawMessage
	currentURLToFetch := params.WallapopNextPageURL
	var nextURLForClient *string
	fetchCount := 0
	seenCarIDs := make(map[string]bool)

	for len(accumulatedRawCars) < targetResults && fetchCount < maxFetchesPerBatch {
		fetchCount++
		apiURL := apiBaseURL
		queryParams := url.Values{}

		// --- (Lógica de URL y Parámetros permanece igual) ---
		if currentURLToFetch != nil && *currentURLToFetch != "" { /* ... */
			log.Printf("[%s] Fetch %d: Usando nextPage token", sourceName, fetchCount)
			queryParams.Set("next_page", *currentURLToFetch)
		} else if fetchCount == 1 { /* ... */
			log.Printf("[%s] Fetch %d: Construyendo parámetros iniciales", sourceName, fetchCount)
			queryParams = buildInitialWallapopParams(params)
		} else { /* ... */
			log.Printf("[%s] Fetch %d: No se proporcionó más nextPageUrl por la API.", sourceName, fetchCount)
			break
		}

		req, err := http.NewRequestWithContext(ctx, "GET", apiURL, nil)
		if err != nil {
			return accumulatedRawCars, createNextPageData(nextURLForClient), fmt.Errorf("[%s] error al crear request: %w", sourceName, err)
		}

		req.URL.RawQuery = queryParams.Encode()
		setWallapopHeaders(req)

		log.Printf("[%s] Fetch %d: Solicitando URL: %s", sourceName, fetchCount, req.URL.String())

		resp, err := c.httpClient.Do(req)
		if err != nil {
			nextURLForClient = currentURLToFetch
			return accumulatedRawCars, createNextPageData(nextURLForClient), fmt.Errorf("[%s] request fallido para %s: %w", sourceName, req.URL.String(), err)
		}
		bodyCloseFunc := resp.Body.Close // Asignar función de cierre
		// !!! Importante: Diferir el cierre del body *fuera* de la verificación de error de abajo si podrías leer el body en caso de error !!!
		defer bodyCloseFunc()

		log.Printf("[%s] Fetch %d: Estado de Respuesta: %s", sourceName, fetchCount, resp.Status)

		// Leer Body PRIMERO
		bodyBytes, readErr := io.ReadAll(resp.Body)
		if readErr != nil {
			log.Printf("[%s] Fetch %d: Error al leer body de respuesta: %v", sourceName, fetchCount, readErr)
			// No retornar aquí aún, tal vez el header sea útil. Pero marcar body como inutilizable.
			bodyBytes = nil // Marcar como inutilizable
			// No es necesario llamar bodyCloseFunc de nuevo, defer lo maneja.
		}
		// Ahora el body está leído o marcado como nil, ya diferimos el cierre

		if resp.StatusCode != http.StatusOK {
			nextURLForClient = currentURLToFetch
			logBody := string(bodyBytes) // Registrar lo que leímos (si algo)
			return accumulatedRawCars, createNextPageData(nextURLForClient), fmt.Errorf("[%s] request fallido para %s, estado %d: %s", sourceName, req.URL.String(), resp.StatusCode, logBody)
		}

		// --- Procesar respuesta exitosa ---
		// Verificar si el body fue leído exitosamente antes de deserializar
		if bodyBytes == nil {
			log.Printf("[%s] Fetch %d: Saltando decodificación debido a error previo de lectura del body.", sourceName, fetchCount)
			break // ¿O continuar? Depende si los resultados parciales están bien. Romper es más seguro.
		}

		// *** Paso Crucial de Decodificación ***
		// Decodificar los bytes del body en la estructura apiResp, usando los structs Go detallados
		var apiResp wallapopAPIResponse
		if err := json.Unmarshal(bodyBytes, &apiResp); err != nil {
			// Registrar el body exacto que falló al deserializar para debugging
			log.Printf("[%s] Fetch %d: Error al decodificar respuesta JSON: %v", sourceName, fetchCount, err)
			log.Printf("[%s] Fetch %d: Fragmento del Body Fallido (primeros 500 bytes): %s", sourceName, fetchCount, string(bodyBytes[:min(500, len(bodyBytes))]))
			nextURLForClient = currentURLToFetch // Mantener URL que llevó al error
			break                                // Detener procesamiento de esta respuesta
		}
		// *** Decodificación exitosa ***

		nextToken := apiResp.Meta.NextPage
		if nextToken == "" {
			nextToken = resp.Header.Get("x-nextpage")
		}
		if nextToken != "" {
			currentURLToFetch = &nextToken
			nextURLForClient = &nextToken
		} else {
			currentURLToFetch = nil
			nextURLForClient = nil
		}

		log.Printf("[%s] Fetch %d: Recibidos %d items.", sourceName, fetchCount, len(apiResp.Data.Section.Items))
		newCarsFound := 0
		for _, rawItem := range apiResp.Data.Section.Items {
			listingID := extractWallapopListingID(rawItem)
			if listingID == "" {
				continue
			}
			if _, exists := seenCarIDs[listingID]; exists {
				continue
			}
			seenCarIDs[listingID] = true
			accumulatedRawCars = append(accumulatedRawCars, rawItem)
			newCarsFound++
		}
		log.Printf("[%s] Fetch %d: Agregados %d coches únicos nuevos.", sourceName, fetchCount, newCarsFound)

		if currentURLToFetch == nil || *currentURLToFetch == "" {
			break
		}
	} // Fin del bucle fetch

	// --- (Lógica de Logging y Retorno permanece igual) ---
	if fetchCount >= maxFetchesPerBatch {
		log.Printf("[%s] Advertencia: Alcanzado límite máximo de fetch (%d) para un lote de request.", sourceName, maxFetchesPerBatch)
	}
	nextURLStr := "<nil>"
	if nextURLForClient != nil {
		nextURLStr = *nextURLForClient
	}
	log.Printf("[%s] Búsqueda finalizada. Total de coches: %d. Retornando URL de siguiente página: %s", sourceName, len(accumulatedRawCars), nextURLStr)
	return accumulatedRawCars, createNextPageData(nextURLForClient), nil
}

// --- buildInitialWallapopParams, setWallapopHeaders, createNextPageData, min permanecen igual ---
// Estos helpers aún son necesarios.
// El tipo de parámetro ha sido cambiado de *common.UnifiedSearchRequest a *searcher.UnifiedSearchRequest
func buildInitialWallapopParams(params *searcher.UnifiedSearchRequest) url.Values { /* ... como antes ... */
	q := url.Values{}
	q.Set("category_id", "100")
	q.Set("source", "side_bar_filters")
	q.Set("section_type", "organic_search_results")

	if params.Brand != nil {
		q.Set("brand", *params.Brand)
	}
	if params.Model != nil {
		q.Set("model", *params.Model)
	}
	if params.PriceFrom != nil {
		q.Set("min_sale_price", *params.PriceFrom)
	}
	if params.PriceTo != nil {
		q.Set("max_sale_price", *params.PriceTo)
	}
	if params.KmFrom != nil {
		q.Set("min_km", *params.KmFrom)
	}
	if params.KmTo != nil {
		q.Set("max_km", *params.KmTo)
	}
	if params.YearFrom != nil {
		q.Set("min_year", *params.YearFrom)
	}
	if params.YearTo != nil {
		q.Set("max_year", *params.YearTo)
	}
	if params.Latitude != nil {
		q.Set("latitude", *params.Latitude)
	}
	if params.Longitude != nil {
		q.Set("longitude", *params.Longitude)
	}
	if params.Keywords != nil {
		q.Set("keywords", *params.Keywords)
	}
	if params.GearBox != nil {
		q.Set("gearbox", *params.GearBox)
	}

	orderBy := "newest" // otra opcion es most_relevance con esto es lo mas nuevo
	if params.OrderBy != nil {
		orderBy = *params.OrderBy
	}
	q.Set("order_by", orderBy)
	return q
}
func setWallapopHeaders(req *http.Request) { /* ... como antes ... */
	req.Header.Set("Accept", "application/json, text/plain, */*")
	req.Header.Set("Accept-Language", "es,en-US;q=0.9,en;q=0.8")
	req.Header.Set("Connection", "keep-alive")
	req.Header.Set("DNT", "1")
	req.Header.Set("Origin", "https://es.wallapop.com")
	req.Header.Set("Referer", "https://es.wallapop.com/")
	req.Header.Set("Sec-Fetch-Dest", "empty")
	req.Header.Set("Sec-Fetch-Mode", "cors")
	req.Header.Set("Sec-Fetch-Site", "same-site")
	req.Header.Set("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36")
	req.Header.Set("sec-ch-ua", `"Chromium";v="117", "Not;A=Brand";v="8"`)
	req.Header.Set("sec-ch-ua-mobile", "?0")
	req.Header.Set("sec-ch-ua-platform", `"Linux"`)
	req.Header.Set("DeviceOS", "0")
	req.Header.Set("X-DeviceOS", "0")
	req.Header.Set("X-DeviceID", "312cd4af-f8a0-438d-87c7-273058f152fc")
	req.Header.Set("X-AppVersion", "816780")
}
func createNextPageData(url *string) map[string]interface{} { /* ... como antes ... */
	if url == nil || *url == "" {
		return nil
	}
	return map[string]interface{}{
		"wallapopNextPageUrl": *url,
	}
}
func min(a, b int) int { /* ... como antes ... */
	if a < b {
		return a
	}
	return b
}

func extractWallapopListingID(raw json.RawMessage) string {
	var item map[string]interface{}
	if err := json.Unmarshal(raw, &item); err != nil {
		return ""
	}
	id, ok := item["id"].(string)
	if !ok {
		return ""
	}
	return id
}

// --- Asegurar que Client implementa Searcher ---
var _ searcher.Searcher = (*Client)(nil)
