package main

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/cachaza/searchNotifier/internal/clients/cochesnet"
	"github.com/cachaza/searchNotifier/internal/clients/milanuncios"
	"github.com/cachaza/searchNotifier/internal/clients/wallapop"
	"github.com/cachaza/searchNotifier/internal/db"
	"github.com/cachaza/searchNotifier/internal/scheduler"
	"github.com/cachaza/searchNotifier/internal/searcher" // Asumiendo que este paquete existe con la interfaz Searcher
	"github.com/joho/godotenv"
)

func main() {
	// Inicializar logging
	log.SetOutput(os.Stdout)
	log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)
	log.Println("Iniciando microservicio de notificador de búsqueda de coches...")

	// --- Cargar variables de entorno desde archivo .env ---
	// Esto cargará variables desde un archivo llamado '.env' en el directorio actual.
	// NO sobrescribirá variables de entorno existentes.
	err := godotenv.Load()
	if err != nil {
		// Registrar una advertencia si el archivo .env no se encuentra, pero no salir fatalmente.
		// Esto permite que la aplicación se ejecute si las variables de entorno están configuradas directamente en el sistema.
		log.Printf("Advertencia: Error al cargar archivo .env (puede no existir o no ser legible): %v", err)
	} else {
		log.Println("Archivo .env cargado exitosamente (si está presente).")
	}

	// --- Carga de Configuración (usando variables de entorno) ---
	dbConnStr := os.Getenv("DATABASE_URL")
	if dbConnStr == "" {
		log.Fatal("La variable de entorno DATABASE_URL no está configurada. Por favor configúrala en tu archivo .env o en las variables de entorno del sistema.")
	}

	// --- Inicialización de Base de Datos ---
	dbClient, err := db.NewDBClient(dbConnStr)
	if err != nil {
		log.Fatalf("Error al conectar con la base de datos: %v", err)
	}
	defer dbClient.Close()
	log.Println("Conexión a la base de datos establecida exitosamente.")

	// --- Inicialización de Clientes de Búsqueda ---
	wallapopClient := wallapop.NewClient()
	milanunciosClient := milanuncios.NewClient()
	cochesnetClient := cochesnet.NewClient()

	searchClients := []searcher.Searcher{
		wallapopClient,
		milanunciosClient,
		cochesnetClient,
	}
	log.Println("Clientes de búsqueda de coches inicializados.")

	// --- Obtener Búsquedas Guardadas Iniciales ---
	savedSearches, err := dbClient.GetSavedSearches(context.Background())
	if err != nil {
		log.Fatalf("Error al obtener las búsquedas guardadas iniciales: %v", err)
	}
	log.Printf("Cargadas %d búsquedas guardadas iniciales.", len(savedSearches))

	// --- Inicialización del Programador ---
	schedulerIntervalStr := os.Getenv("SCHEDULER_INTERVAL_SECONDS")
	schedulerIntervalSeconds := 24 //* 60 * 60
	if schedulerIntervalStr != "" {
		if val, parseErr := time.ParseDuration(schedulerIntervalStr + "s"); parseErr == nil {
			schedulerIntervalSeconds = int(val.Seconds())
		} else {
			log.Printf("Advertencia: SCHEDULER_INTERVAL_SECONDS '%s' inválido. Usando valor por defecto %d segundos. Error: %v", schedulerIntervalStr, schedulerIntervalSeconds, parseErr)
		}
	}
	schedulerInterval := time.Duration(schedulerIntervalSeconds) * time.Second

	carScheduler := scheduler.NewScheduler(dbClient, searchClients, savedSearches, schedulerInterval)
	log.Printf("Programador inicializado con un intervalo de %s.", schedulerInterval)

	// --- Iniciar el Programador ---
	go carScheduler.Start()
	log.Println("Programador iniciado.")

	// --- Mantener la goroutine principal viva ---
	select {}
}
