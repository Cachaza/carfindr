package models

import (
	"encoding/json" // Agregado para json.RawMessage
	"time"
)

// SavedSearch representa una fila en la tabla 'saved_search' de Drizzle.
// Contiene los criterios para una búsqueda de coches guardada por un usuario.
type SavedSearch struct {
	ID           int        `db:"id"`       // primaryKey().generatedByDefaultAsIdentity()
	UserID       string     `db:"user_id"`  // notNull().references(() => users.id)
	Name         *string    `db:"name"`     // Opcional: para que los usuarios nombren sus búsquedas
	BrandID      *string    `db:"brand_id"` // Corresponde a selectedBrandId
	ModelID      *string    `db:"model_id"` // Corresponde a selectedModelId
	YearFrom     *int       `db:"year_from"`
	YearTo       *int       `db:"year_to"`
	PriceFrom    *int       `db:"price_from"`
	PriceTo      *int       `db:"price_to"`
	KmFrom       *int       `db:"km_from"`
	KmTo         *int       `db:"km_to"`
	Transmission *string    `db:"transmission"`
	SearchText   *string    `db:"search_text"`
	BrandParam   *string    `db:"brand_param"` // Corresponde a selectedBrandParam
	ModelParam   *string    `db:"model_param"` // Corresponde a selectedModelParam
	CreatedAt    time.Time  `db:"created_at"`  // default(sql`CURRENT_TIMESTAMP`).notNull()
	LastRun      *time.Time `db:"last_run"`
	// Nuevo campo para almacenar tokens de paginación para cada fuente.
	// Esto se almacenará como JSONB en la base de datos.
	NextPageData json.RawMessage `db:"next_page_data"`
}

// User representa una fila en la tabla 'user' de Drizzle.
// Usado para obtener el email del usuario para notificaciones.
type User struct {
	ID            string     `db:"id"` // notNull().primaryKey().$defaultFn(() => crypto.randomUUID())
	Name          *string    `db:"name"`
	Email         string     `db:"email"`          // notNull()
	EmailVerified *time.Time `db:"email_verified"` // default(sql`CURRENT_TIMESTAMP`)
	Image         *string    `db:"image"`
}

// SearchedCarListing representa un anuncio de coche que ha sido procesado
// para una búsqueda guardada específica. Esta es la nueva tabla que propusiste.
type SearchedCarListing struct {
	ID            int       `db:"id"`              // primaryKey().generatedByDefaultAsIdentity()
	SavedSearchID int       `db:"saved_search_id"` // REFERENCES saved_search(id)
	ListingHash   string    `db:"listing_hash"`    // El hash del contenido del anuncio de coche
	ListingID     *string   `db:"listing_id"`      // Opcional: ID original de la plataforma fuente (ej., ID de Wallapop)
	CreatedAt     time.Time `db:"created_at"`      // default(sql`CURRENT_TIMESTAMP`).notNull()
}
