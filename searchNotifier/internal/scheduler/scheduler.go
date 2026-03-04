package scheduler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/cachaza/searchNotifier/internal/db"
	"github.com/cachaza/searchNotifier/internal/hasher"
	"github.com/cachaza/searchNotifier/internal/models"
	"github.com/cachaza/searchNotifier/internal/notifier"
	"github.com/cachaza/searchNotifier/internal/searcher"
)

// Scheduler orquesta la ejecución periódica de búsquedas guardadas.
type Scheduler struct {
	dbClient      *db.DBClient
	searchClients []searcher.Searcher
	carHasher     hasher.CarHasher
	notifier      notifier.Notifier

	// savedSearches es la lista actual de búsquedas a procesar.
	// Se actualiza periódicamente.
	savedSearches []models.SavedSearch
	mu            sync.RWMutex // Mutex para proteger el acceso a savedSearches y currentIndex

	currentIndex int           // Índice para procesamiento round-robin
	interval     time.Duration // Con qué frecuencia procesar la siguiente búsqueda guardada
}

// NewScheduler crea y retorna una nueva instancia de Scheduler.
func NewScheduler(
	dbClient *db.DBClient,
	searchClients []searcher.Searcher,
	initialSavedSearches []models.SavedSearch,
	interval time.Duration,
) *Scheduler {
	return &Scheduler{
		dbClient:      dbClient,
		searchClients: searchClients,
		carHasher:     hasher.NewCarHasher(),                                                                           // Inicializar el hasher
		notifier:      notifier.NewEmailNotifier("re_9tBGLCQS_9hyQrxNj5noja189viy8V4mM", "send@motorfindr.cachaza.cc"), // Inicializar el notificador
		savedSearches: initialSavedSearches,
		currentIndex:  0,
		interval:      interval,
	}
}

// Start comienza la operación del programador. Se ejecuta indefinidamente.
func (s *Scheduler) Start() {
	ticker := time.NewTicker(s.interval)
	defer ticker.Stop()

	// Contexto para las operaciones del programador
	ctx := context.Background()

	// Goroutine para actualizar periódicamente la lista de búsquedas guardadas desde la base de datos.
	// Esto asegura que el programador recoja nuevas búsquedas o refleje las eliminadas.
	go s.refreshSavedSearches(ctx, 5*time.Minute) // Actualizar cada 5 minutos

	log.Println("Bucle del programador iniciado.")
	for range ticker.C {
		s.mu.RLock() // Usar RLock para lectura, ya que podríamos actualizar en refreshSavedSearches
		numSearches := len(s.savedSearches)
		s.mu.RUnlock()

		if numSearches == 0 {
			log.Println("No hay búsquedas guardadas disponibles para procesar. Esperando al siguiente intervalo...")
			continue
		}

		s.mu.Lock() // Bloquear para actualizar currentIndex
		searchToProcess := s.savedSearches[s.currentIndex]
		s.currentIndex = (s.currentIndex + 1) % numSearches
		s.mu.Unlock()

		log.Printf("Procesando búsqueda guardada ID: %d (Usuario: %s, Nombre: %s)",
			searchToProcess.ID, searchToProcess.UserID, *searchToProcess.Name)

		// Ejecutar la búsqueda en una goroutine separada para evitar bloquear el ticker.
		// Esto permite búsquedas concurrentes mientras mantiene el orden round-robin para *iniciarlas*.
		go s.processSavedSearch(ctx, searchToProcess)
	}
}

// refreshSavedSearches obtiene periódicamente las últimas búsquedas guardadas de la base de datos.
func (s *Scheduler) refreshSavedSearches(ctx context.Context, refreshInterval time.Duration) {
	ticker := time.NewTicker(refreshInterval)
	defer ticker.Stop()

	for range ticker.C {
		log.Println("Actualizando búsquedas guardadas desde la base de datos...")
		latestSearches, err := s.dbClient.GetSavedSearches(ctx)
		if err != nil {
			log.Printf("Error al actualizar búsquedas guardadas: %v", err)
			continue
		}

		s.mu.Lock()
		s.savedSearches = latestSearches
		// Reiniciar índice si está fuera de límites después de la actualización (ej., si se eliminaron búsquedas)
		if s.currentIndex >= len(s.savedSearches) && len(s.savedSearches) > 0 {
			s.currentIndex = 0
		} else if len(s.savedSearches) == 0 {
			s.currentIndex = 0 // Sin búsquedas, reiniciar índice
		}
		s.mu.Unlock()
		log.Printf("Búsquedas guardadas actualizadas. Ahora %d búsquedas cargadas.", len(latestSearches))
	}
}

// processSavedSearch realiza una búsqueda para una sola búsqueda guardada, detecta nuevos anuncios y notifica al usuario.
func (s *Scheduler) processSavedSearch(ctx context.Context, savedSearch models.SavedSearch) {
	// Usar un contexto con timeout para todo el proceso de búsqueda
	searchCtx, cancel := context.WithTimeout(ctx, 2*time.Minute) // Ajustar timeout según sea necesario
	defer cancel()

	log.Printf("Iniciando búsqueda para búsqueda guardada ID: %d", savedSearch.ID)

	// 1. Obtener hashes existentes para esta búsqueda guardada desde la base de datos
	existingHashes, err := s.dbClient.GetSearchedCarListings(searchCtx, savedSearch.ID)
	if err != nil {
		log.Printf("Error al obtener hashes existentes para búsqueda guardada %d: %v", savedSearch.ID, err)
		return
	}
	log.Printf("Encontrados %d hashes existentes para búsqueda guardada ID %d.", len(existingHashes), savedSearch.ID)

	// Convertir modelo SavedSearch a UnifiedSearchRequest
	unifiedReq := s.toUnifiedSearchRequest(savedSearch)

	var allNewListings []map[string]interface{}
	var updatedNextPageData map[string]interface{} // Para acumular datos de siguiente página a través de fuentes

	// Deserializar NextPageData existente en un mapa para acceso fácil
	var currentNextPageData map[string]interface{}
	if len(savedSearch.NextPageData) > 0 {
		if err := json.Unmarshal(savedSearch.NextPageData, &currentNextPageData); err != nil {
			log.Printf("Advertencia: Error al deserializar next_page_data existente para búsqueda %d: %v", savedSearch.ID, err)
			currentNextPageData = make(map[string]interface{}) // Inicializar vacío si falla la deserialización
		}
	} else {
		currentNextPageData = make(map[string]interface{})
	}
	updatedNextPageData = make(map[string]interface{}) // Inicializar para nuevos datos

	// Copiar tokens de paginación existentes a la solicitud unificada
	if wallapopURL, ok := currentNextPageData["wallapopNextPageUrl"].(string); ok && wallapopURL != "" {
		unifiedReq.WallapopNextPageURL = &wallapopURL
	}
	if milanunciosOffset, ok := currentNextPageData["milanunciosOffset"].(float64); ok { // Los números JSON son float64
		offset := int(milanunciosOffset)
		unifiedReq.MilanunciosOffset = &offset
	}
	if cochesNetPage, ok := currentNextPageData["cochesNetPage"].(float64); ok { // Los números JSON son float64
		page := int(cochesNetPage)
		unifiedReq.CochesNetPage = &page
	}

	// 2. Iterar a través de cada cliente de búsqueda y realizar la búsqueda
	for _, client := range s.searchClients {
		log.Printf("Llamando cliente %s para búsqueda guardada ID %d...", client.SourceName(), savedSearch.ID)
		rawListings, nextPageDataFromClient, err := client.Search(searchCtx, unifiedReq)
		if err != nil {
			log.Printf("Error al buscar %s para búsqueda guardada %d: %v", client.SourceName(), savedSearch.ID, err)
			continue // Continuar al siguiente cliente
		}
		log.Printf("Recibidos %d anuncios raw desde %s para búsqueda guardada ID %d.", len(rawListings), client.SourceName(), savedSearch.ID)

		// Actualizar el mapa general de datos de siguiente página
		for k, v := range nextPageDataFromClient {
			updatedNextPageData[k] = v
		}

		// 3. Procesar nuevos anuncios
		newlyFoundCarsForSource := 0
		for _, rawListing := range rawListings {
			hash, listingID, err := s.carHasher.GenerateHash(client.SourceName(), rawListing)
			if err != nil {
				log.Printf("Error al hacer hash del anuncio desde %s para búsqueda %d: %v", client.SourceName(), savedSearch.ID, err)
				continue
			}

			if !existingHashes[hash] {
				// ¡Nuevo anuncio encontrado!
				log.Printf("Nuevo anuncio encontrado para búsqueda %d desde %s (ID: %s, Hash: %s)", savedSearch.ID, client.SourceName(), listingID, hash)

				// Almacenar el nuevo hash en la base de datos
				newListing := models.SearchedCarListing{
					SavedSearchID: savedSearch.ID,
					ListingHash:   hash,
					ListingID:     &listingID, // Almacenar el ID específico de la fuente
					CreatedAt:     time.Now(),
				}
				if err := s.dbClient.InsertSearchedCarListing(searchCtx, newListing); err != nil {
					log.Printf("Error al insertar nuevo hash de anuncio %s para búsqueda %d: %v", hash, savedSearch.ID, err)
					// Continuar incluso si falla la inserción, para intentar notificar al usuario
				} else {
					// Agregar a hashes existentes para prevenir notificaciones duplicadas en esta ejecución
					existingHashes[hash] = true
				}

				// Agregar el anuncio raw a la lista de coches nuevos para notificación
				var carMap map[string]interface{}
				if err := json.Unmarshal(rawListing, &carMap); err != nil {
					log.Printf("Error al deserializar anuncio raw para notificación para búsqueda %d: %v", savedSearch.ID, err)
					continue
				}
				// Agregar nombre de fuente al mapa del coche para mejor contexto del email
				carMap["source"] = client.SourceName()
				allNewListings = append(allNewListings, carMap)
				newlyFoundCarsForSource++
			}
		}
		log.Printf("Encontrados %d coches únicos nuevos desde %s para búsqueda guardada ID %d.", newlyFoundCarsForSource, client.SourceName(), savedSearch.ID)
	}

	// 4. Si se encontraron nuevos anuncios, notificar al usuario
	if len(allNewListings) > 0 {
		log.Printf("Total %d nuevos anuncios encontrados para búsqueda guardada ID %d. Preparando notificación...", len(allNewListings), savedSearch.ID)
		user, err := s.dbClient.GetUserByID(searchCtx, savedSearch.UserID)
		if err != nil {
			log.Printf("Error al obtener usuario %s para notificación para búsqueda %d: %v", savedSearch.UserID, savedSearch.ID, err)
		} else {
			if err := s.notifier.SendNotificationEmail(searchCtx, user, savedSearch, len(allNewListings)); err != nil {
				log.Printf("Error al enviar email de notificación para búsqueda guardada %d al usuario %s: %v", savedSearch.ID, savedSearch.UserID, err)
			} else {
				log.Printf("Email de notificación enviado para búsqueda guardada %d al usuario %s.", savedSearch.ID, savedSearch.UserID)
			}
		}
	} else {
		log.Printf("No se encontraron nuevos anuncios para búsqueda guardada ID %d.", savedSearch.ID)
	}

	// 5. Actualizar el timestamp last_run y next_page_data para la búsqueda guardada
	updatedNextPageDataBytes, err := json.Marshal(updatedNextPageData)
	if err != nil {
		log.Printf("Error al serializar next_page_data actualizado para búsqueda %d: %v", savedSearch.ID, err)
		// Proceder con la actualización de last_run incluso si falla la serialización de next_page_data
		updatedNextPageDataBytes = []byte("{}") // Almacenar JSON vacío
	}

	if err := s.dbClient.UpdateSavedSearchLastRun(searchCtx, savedSearch.ID, time.Now(), updatedNextPageDataBytes); err != nil {
		log.Printf("Error al actualizar last_run y next_page_data para búsqueda guardada %d: %v", savedSearch.ID, err)
	} else {
		log.Printf("Actualizado last_run y next_page_data para búsqueda guardada ID %d.", savedSearch.ID)
	}

	log.Printf("Finalizado el procesamiento de búsqueda guardada ID: %d", savedSearch.ID)
}

// toUnifiedSearchRequest convierte un models.SavedSearch a un searcher.UnifiedSearchRequest.
// Esta es una función auxiliar para mapear tu modelo de base de datos al formato común de solicitud de búsqueda.
func (s *Scheduler) toUnifiedSearchRequest(ss models.SavedSearch) *searcher.UnifiedSearchRequest {
	req := &searcher.UnifiedSearchRequest{
		Brand:        ss.BrandParam, // Usar BrandParam para la consulta de búsqueda
		Model:        ss.ModelParam, // Usar ModelParam para la consulta de búsqueda
		YearFrom:     intPtrToStringPtr(ss.YearFrom),
		YearTo:       intPtrToStringPtr(ss.YearTo),
		PriceFrom:    intPtrToStringPtr(ss.PriceFrom),
		PriceTo:      intPtrToStringPtr(ss.PriceTo),
		KmFrom:       intPtrToStringPtr(ss.KmFrom),
		KmTo:         intPtrToStringPtr(ss.KmTo),
		Transmission: ss.Transmission,
		Keywords:     ss.SearchText,
		BrandID:      ss.BrandID, // Usado por Coches.net
		ModelID:      ss.ModelID, // Usado por Coches.net
		// Agregar otros campos según sea necesario basado en tu UnifiedSearchRequest y cómo se mapean desde SavedSearch
	}

	// Los datos de paginación se cargarán desde savedSearch.NextPageData dentro de processSavedSearch
	// y luego se pasarán al método client.Search.

	return req
}

// Auxiliar para convertir *int a *string para UnifiedSearchRequest
func intPtrToStringPtr(i *int) *string {
	if i == nil {
		return nil
	}
	s := fmt.Sprintf("%d", *i)
	return &s
}
