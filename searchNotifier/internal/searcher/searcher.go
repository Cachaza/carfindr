package searcher

import (
	"context"
	"encoding/json"
)

// Searcher define la interfaz que todos los clientes de plataformas de coches deben implementar.
// Permite que el programador interactúe con diferentes plataformas de manera uniforme.
type Searcher interface {
	SourceName() string // Retorna el nombre de la fuente de búsqueda (ej., "wallapop", "milanuncios")
	// Search realiza una búsqueda de coches basada en los parámetros de solicitud unificados.
	// Retorna un slice de mensajes JSON raw que representan los anuncios de coches,
	// un mapa para datos de siguiente página (específico de cada fuente), y un error.
	Search(ctx context.Context, params *UnifiedSearchRequest) ([]json.RawMessage, map[string]interface{}, error)
}

// UnifiedSearchRequest define una estructura común para parámetros de búsqueda
// que pueden ser traducidos a solicitudes de API específicas de plataforma.
// Esta estructura debe contener todos los campos de tu esquema `saved_search` de Drizzle
// que son relevantes para hacer una consulta de búsqueda, más cualquier token de paginación.
type UnifiedSearchRequest struct {
	// Parámetros de búsqueda directamente desde saved_search
	Brand        *string `json:"brand"`
	Model        *string `json:"model"`
	YearFrom     *string `json:"yearFrom"` // Usar string ya que algunas APIs podrían esperarlo, convertir internamente
	YearTo       *string `json:"yearTo"`
	PriceFrom    *string `json:"priceFrom"`
	PriceTo      *string `json:"priceTo"`
	KmFrom       *string `json:"kmFrom"`
	KmTo         *string `json:"kmTo"`
	Transmission *string `json:"transmission"`
	Keywords     *string `json:"keywords"` // Corresponde a searchText

	// Parámetros específicos para Coches.net (desde tu código de cliente)
	BrandID            *string `json:"brandId"` // Usado por Coches.net
	ModelID            *string `json:"modelId"` // Usado por Coches.net
	IsFinanced         *bool   `json:"isFinanced"`
	HasPhoto           *bool   `json:"hasPhoto"`
	HasWarranty        *bool   `json:"hasWarranty"`
	IsCertified        *bool   `json:"isCertified"`
	BodyTypeIDs        []int   `json:"bodyTypeIds"`
	DrivenWheelsIDs    []int   `json:"drivenWheelsIds"`
	ProvinceIDs        []int   `json:"provinceIds"`
	TransmissionTypeID *int    `json:"transmissionTypeId"` // Usado por Coches.net

	// Parámetros específicos para Milanuncios (desde tu código de cliente)
	SellerType *string `json:"sellerType"`
	FuelType   *string `json:"fuelType"`
	Doors      *string `json:"doors"`

	// Parámetros específicos para Wallapop (desde tu código de cliente)
	Latitude  *string `json:"latitude"`
	Longitude *string `json:"longitude"`
	GearBox   *string `json:"gearbox"` // Wallapop usa "gearbox", Milanuncios "transmission"

	// Tokens de paginación (específicos de fuente, almacenados en el campo JSONB next_page_data)
	WallapopNextPageURL *string `json:"wallapopNextPageUrl"`
	MilanunciosOffset   *int    `json:"milanunciosOffset"`
	CochesNetPage       *int    `json:"cochesNetPage"`

	// OrderBy (si aplica a todas las plataformas)
	OrderBy *string `json:"orderBy"` // ej., "newest", "price_asc"
}
