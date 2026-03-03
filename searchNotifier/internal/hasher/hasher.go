package hasher

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"sort"
)

// CarHasher define la interfaz para hacer hash de anuncios de coches.
type CarHasher interface {
	GenerateHash(sourceName string, rawListing json.RawMessage) (string, string, error) // Retorna hash e ID específico de la fuente
}

// NewCarHasher crea una nueva instancia de la implementación por defecto de CarHasher.
func NewCarHasher() CarHasher {
	return &defaultCarHasher{}
}

// defaultCarHasher es la implementación concreta de CarHasher.
type defaultCarHasher struct{}

// GenerateHash genera un hash SHA256 para un anuncio de coche JSON raw dado.
// Intenta extraer campos de identificación clave del anuncio para crear una cadena consistente
// para el hash, independientemente de cambios menores en la respuesta de la API (ej., orden de campos).
// También retorna el ID específico de la fuente del anuncio.
func (h *defaultCarHasher) GenerateHash(sourceName string, rawListing json.RawMessage) (string, string, error) {
	// Usar un mapa para deserializar el JSON raw para poder acceder a campos dinámicamente.
	var data map[string]interface{}
	if err := json.Unmarshal(rawListing, &data); err != nil {
		return "", "", fmt.Errorf("error al deserializar anuncio raw para hash: %w", err)
	}

	var identifyingString string
	var listingID string

	// Lógica para extraer campos relevantes para el hash basado en la fuente.
	// Esto es crucial para un hash consistente.
	switch sourceName {
	case "wallapop":
		// Compatible con estructura antigua ({id, content:{...}}) y nueva (item plano).
		if id, ok := data["id"].(string); ok {
			listingID = id
		} else {
			log.Printf("Advertencia: Anuncio de Wallapop sin 'id' de nivel superior para hash: %s", string(rawListing))
			return "", "", fmt.Errorf("anuncio de wallapop sin 'id' de nivel superior")
		}

		hashFields := []string{}

		content, hasContent := data["content"].(map[string]interface{})
		sourceData := data
		if hasContent {
			sourceData = content
		}

		if title, ok := sourceData["title"].(string); ok {
			hashFields = append(hashFields, "title:"+title)
		}

		if price, ok := sourceData["price"].(float64); ok {
			hashFields = append(hashFields, fmt.Sprintf("price:%.2f", price))
		} else if priceMap, ok := sourceData["price"].(map[string]interface{}); ok {
			if amount, ok := priceMap["amount"].(float64); ok {
				hashFields = append(hashFields, fmt.Sprintf("price:%.2f", amount))
			}
		}

		if km, ok := sourceData["km"].(float64); ok {
			hashFields = append(hashFields, fmt.Sprintf("km:%.0f", km))
		} else if km, ok := sourceData["km"].(int); ok {
			hashFields = append(hashFields, fmt.Sprintf("km:%d", km))
		}

		if year, ok := sourceData["year"].(float64); ok {
			hashFields = append(hashFields, fmt.Sprintf("year:%.0f", year))
		} else if year, ok := sourceData["year"].(int); ok {
			hashFields = append(hashFields, fmt.Sprintf("year:%d", year))
		}

		if brand, ok := sourceData["brand"].(string); ok {
			hashFields = append(hashFields, "brand:"+brand)
		}
		if model, ok := sourceData["model"].(string); ok {
			hashFields = append(hashFields, "model:"+model)
		}
		if gearbox, ok := sourceData["gearbox"].(string); ok {
			hashFields = append(hashFields, "gearbox:"+gearbox)
		}

		if creationDate, ok := sourceData["creation_date"].(string); ok {
			hashFields = append(hashFields, "creation_date:"+creationDate)
		} else if creationDate, ok := sourceData["creation_date"].(float64); ok {
			hashFields = append(hashFields, fmt.Sprintf("creation_date:%.0f", creationDate))
		} else if creationDate, ok := sourceData["modification_date"].(string); ok {
			hashFields = append(hashFields, "modification_date:"+creationDate)
		}

		sort.Strings(hashFields)
		identifyingString = listingID + "|" + sourceName + "|" + fmt.Sprintf("%v", hashFields)

	case "milanuncios":
		// Estructura de Milanuncios: { "id": "...", "title": "...", "price": { "cash": { "value": ... } }, ... }
		if id, ok := data["id"].(string); ok {
			listingID = id
		} else {
			log.Printf("Advertencia: Anuncio de Milanuncios sin 'id' para hash: %s", string(rawListing))
			return "", "", fmt.Errorf("anuncio de milanuncios sin 'id'")
		}

		hashFields := []string{}
		if title, ok := data["title"].(string); ok {
			hashFields = append(hashFields, "title:"+title)
		}
		if priceData, ok := data["price"].(map[string]interface{}); ok {
			if cashData, ok := priceData["cash"].(map[string]interface{}); ok {
				if price, ok := cashData["value"].(float64); ok {
					hashFields = append(hashFields, fmt.Sprintf("price:%.2f", price))
				}
			}
		}
		if pubDate, ok := data["publicationDate"].(string); ok {
			hashFields = append(hashFields, "publicationDate:"+pubDate)
		}
		// Extraer atributos como km, year, transmission
		if attrs, ok := data["attributes"].([]interface{}); ok {
			for _, attr := range attrs {
				if attrMap, ok := attr.(map[string]interface{}); ok {
					if field, ok := attrMap["field"].(map[string]interface{}); ok {
						if rawField, ok := field["raw"].(string); ok {
							if value, ok := attrMap["value"].(map[string]interface{}); ok {
								if rawValue, ok := value["raw"].(string); ok {
									hashFields = append(hashFields, fmt.Sprintf("%s:%s", rawField, rawValue))
								}
							}
						}
					}
				}
			}
		}

		sort.Strings(hashFields)
		identifyingString = listingID + "|" + sourceName + "|" + fmt.Sprintf("%v", hashFields)

	case "cochesnet":
		// Los elementos de Coches.net ya son JSON raw.
		// Tienen un 'id' de nivel superior y otros campos.
		if id, ok := data["id"].(string); ok {
			listingID = id
		} else {
			log.Printf("Advertencia: Anuncio de Coches.net sin 'id' para hash: %s", string(rawListing))
			return "", "", fmt.Errorf("anuncio de coches.net sin 'id'")
		}

		hashFields := []string{}
		if title, ok := data["title"].(string); ok {
			hashFields = append(hashFields, "title:"+title)
		}
		if price, ok := data["price"].(float64); ok {
			hashFields = append(hashFields, fmt.Sprintf("price:%.2f", price))
		}
		if km, ok := data["km"].(float64); ok {
			hashFields = append(hashFields, fmt.Sprintf("km:%.0f", km))
		}
		if year, ok := data["year"].(float64); ok {
			hashFields = append(hashFields, fmt.Sprintf("year:%.0f", year))
		}
		if make, ok := data["make"].(string); ok {
			hashFields = append(hashFields, "make:"+make)
		}
		if model, ok := data["model"].(string); ok {
			hashFields = append(hashFields, "model:"+model)
		}
		if transmission, ok := data["transmission"].(string); ok {
			hashFields = append(hashFields, "transmission:"+transmission)
		}
		if publicationDate, ok := data["publicationDate"].(string); ok {
			hashFields = append(hashFields, "publicationDate:"+publicationDate)
		}

		sort.Strings(hashFields)
		identifyingString = listingID + "|" + sourceName + "|" + fmt.Sprintf("%v", hashFields)

	default:
		return "", "", fmt.Errorf("fuente no soportada para hash: %s", sourceName)
	}

	// Generar hash SHA256
	hasher := sha256.New()
	hasher.Write([]byte(identifyingString))
	hash := hex.EncodeToString(hasher.Sum(nil))

	return hash, listingID, nil
}
