package db

import (
	"context"
	"encoding/json" // Agregado para json.RawMessage
	"fmt"
	"log"
	"time"

	"github.com/cachaza/searchNotifier/internal/models" // Tus modelos de datos definidos
	"github.com/jackc/pgx/v5/pgxpool"                   // Driver PostgreSQL moderno
)

// DBClient mantiene el pool de conexiones de la base de datos.
type DBClient struct {
	pool *pgxpool.Pool
}

// NewDBClient crea un nuevo cliente de base de datos y establece un pool de conexiones.
func NewDBClient(connStr string) (*DBClient, error) {
	config, err := pgxpool.ParseConfig(connStr)
	if err != nil {
		return nil, fmt.Errorf("error al parsear la cadena de conexión de la base de datos: %w", err)
	}

	// Opcional: Configurar ajustes del pool de conexiones
	config.MaxConns = 10                               // Máximo de conexiones concurrentes
	config.MinConns = 2                                // Mínimo de conexiones inactivas
	config.ConnConfig.ConnectTimeout = 5 * time.Second // Timeout de conexión

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, fmt.Errorf("no se pudo crear el pool de conexiones: %w", err)
	}

	// Hacer ping a la base de datos para verificar la conexión
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err = pool.Ping(ctx); err != nil {
		pool.Close() // Cerrar el pool si falla el ping
		return nil, fmt.Errorf("error al hacer ping a la base de datos: %w", err)
	}

	log.Println("Conectado exitosamente a la base de datos.")
	return &DBClient{pool: pool}, nil
}

// Close cierra el pool de conexiones de la base de datos.
func (c *DBClient) Close() {
	if c.pool != nil {
		c.pool.Close()
		log.Println("Pool de conexiones de la base de datos cerrado.")
	}
}

// GetSavedSearches obtiene todas las búsquedas guardadas de la base de datos, ordenadas por last_run (ascendente)
// para priorizar búsquedas que no se han ejecutado recientemente.
func (c *DBClient) GetSavedSearches(ctx context.Context) ([]models.SavedSearch, error) {
	query := `
		SELECT
			id, user_id, name, brand_id, model_id, year_from, year_to,
			price_from, price_to, km_from, km_to, transmission, search_text,
			brand_param, model_param, created_at, last_run, next_page_data
		FROM saved_search
		ORDER BY last_run ASC NULLS FIRST, created_at ASC;
	`
	rows, err := c.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("error al consultar búsquedas guardadas: %w", err)
	}
	defer rows.Close()

	var searches []models.SavedSearch
	for rows.Next() {
		var s models.SavedSearch
		var lastRun *time.Time  // Usar un puntero para manejar valores NULL
		var nextPageData []byte // Bytes raw para JSONB
		err := rows.Scan(
			&s.ID, &s.UserID, &s.Name, &s.BrandID, &s.ModelID, &s.YearFrom, &s.YearTo,
			&s.PriceFrom, &s.PriceTo, &s.KmFrom, &s.KmTo, &s.Transmission, &s.SearchText,
			&s.BrandParam, &s.ModelParam, &s.CreatedAt, &lastRun, &nextPageData,
		)
		if err != nil {
			return nil, fmt.Errorf("error al escanear fila de búsqueda guardada: %w", err)
		}
		s.LastRun = lastRun                            // Asignar el puntero escaneado
		s.NextPageData = json.RawMessage(nextPageData) // Asignar bytes JSON raw

		searches = append(searches, s)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error al iterar filas de búsqueda guardada: %w", err)
	}

	return searches, nil
}

// UpdateSavedSearchLastRun actualiza el timestamp 'last_run' para una búsqueda guardada dada.
func (c *DBClient) UpdateSavedSearchLastRun(ctx context.Context, searchID int, lastRun time.Time, nextPageData json.RawMessage) error {
	query := `
		UPDATE saved_search
		SET last_run = $1, next_page_data = $2
		WHERE id = $3;
	`
	_, err := c.pool.Exec(ctx, query, lastRun, nextPageData, searchID)
	if err != nil {
		return fmt.Errorf("error al actualizar last_run y next_page_data para búsqueda guardada %d: %w", searchID, err)
	}
	return nil
}

// GetUserByID obtiene un usuario por su ID.
func (c *DBClient) GetUserByID(ctx context.Context, userID string) (*models.User, error) {
	query := `
		SELECT id, name, email, email_verified, image
		FROM "user"
		WHERE id = $1;
	`
	var u models.User
	var emailVerified *time.Time // Usar puntero para timestamp nullable
	err := c.pool.QueryRow(ctx, query, userID).Scan(
		&u.ID, &u.Name, &u.Email, &emailVerified, &u.Image,
	)
	if err != nil {
		return nil, fmt.Errorf("error al consultar usuario por ID %s: %w", userID, err)
	}
	u.EmailVerified = emailVerified
	return &u, nil
}

// GetSearchedCarListings obtiene todos los hashes conocidos para una búsqueda guardada específica.
func (c *DBClient) GetSearchedCarListings(ctx context.Context, savedSearchID int) (map[string]bool, error) {
	query := `
		SELECT listing_hash
		FROM searched_car_listings
		WHERE saved_search_id = $1;
	`
	rows, err := c.pool.Query(ctx, query, savedSearchID)
	if err != nil {
		return nil, fmt.Errorf("error al consultar anuncios de coches buscados para ID de búsqueda %d: %w", savedSearchID, err)
	}
	defer rows.Close()

	hashes := make(map[string]bool)
	for rows.Next() {
		var hash string
		if err := rows.Scan(&hash); err != nil {
			return nil, fmt.Errorf("error al escanear hash de anuncio: %w", err)
		}
		hashes[hash] = true
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error al iterar filas de anuncios de coches buscados: %w", err)
	}

	return hashes, nil
}

// InsertSearchedCarListing inserta un nuevo hash de anuncio de coche en la base de datos.
func (c *DBClient) InsertSearchedCarListing(ctx context.Context, listing models.SearchedCarListing) error {
	query := `
		INSERT INTO searched_car_listings (saved_search_id, listing_hash, listing_id, created_at)
		VALUES ($1, $2, $3, $4);
	`
	_, err := c.pool.Exec(ctx, query, listing.SavedSearchID, listing.ListingHash, listing.ListingID, listing.CreatedAt)
	if err != nil {
		// Considerar verificar específicamente la violación de restricción única si es necesario,
		// pero la búsqueda en el mapa antes de la inserción debería prevenir esto en gran medida.
		return fmt.Errorf("error al insertar anuncio de coche buscado para ID de búsqueda %d, hash %s: %w",
			listing.SavedSearchID, listing.ListingHash, err)
	}
	return nil
}
