# CarFindr 🚗

**CarFindr** es una plataforma completa de agregación y búsqueda de coches de segunda mano que integra múltiples fuentes de datos en tiempo real. El proyecto está diseñado como un sistema distribuido con una aplicación web moderna y un microservicio de notificaciones.

## 📋 Índice

- [Descripción General](#descripción-general)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Componentes Principales](#componentes-principales)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Instalación y Configuración](#instalación-y-configuración)
- [Uso](#uso)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [API y Endpoints](#api-y-endpoints)
- [Base de Datos](#base-de-datos)
- [Despliegue](#despliegue)
- [Contribución](#contribución)

## 🎯 Descripción General

CarFindr es una solución integral que permite a los usuarios:

- **Buscar coches** en múltiples plataformas simultáneamente (Wallapop, Milanuncios, Coches.net)
- **Guardar búsquedas** personalizadas con filtros avanzados
- **Recibir notificaciones** automáticas cuando aparecen nuevos vehículos
- **Comparar precios** y características entre diferentes plataformas
- **Acceso multiplataforma** con autenticación segura

## 🏗️ Arquitectura del Sistema

El proyecto está estructurado en tres componentes principales:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Microservicio  │    │   Base de       │
│   (Next.js)     │◄──►│   (Go)           │◄──►│   Datos         │
│                 │    │                  │    │   (PostgreSQL)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Redis Cache   │    │   Email Service  │    │   CSV Data      │
│                 │    │   (Resend)       │    │   (Marcas/      │
└─────────────────┘    └──────────────────┘    │   Modelos)      │
                                               └─────────────────┘
```

## 🧩 Componentes Principales

### 1. **Aplicación Web (carfindr/)**
- **Framework**: Next.js 15 con TypeScript
- **UI**: Tailwind CSS + Radix UI
- **Autenticación**: NextAuth.js
- **Estado**: tRPC + React Query
- **Base de datos**: Drizzle ORM + PostgreSQL

### 2. **Microservicio de Notificaciones (searchNotifier/)**
- **Lenguaje**: Go
- **Funcionalidad**: Búsqueda automática y envío de notificaciones
- **Plataformas soportadas**: Wallapop, Milanuncios, Coches.net
- **Programación**: Scheduler con intervalos configurables

### 3. **Scripts de Investigación (PoC/)**
- **Lenguaje**: Python
- **Propósito**: Análisis de APIs y extracción de datos
- **Herramientas**: Requests, Pandas, análisis de HAR files

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Next.js 15** - Framework React con SSR
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework CSS utility-first
- **Radix UI** - Componentes accesibles
- **tRPC** - API type-safe
- **React Query** - Gestión de estado del servidor

### Backend
- **Go** - Microservicio de notificaciones
- **PostgreSQL** - Base de datos principal
- **Redis** - Cache y sesiones
- **Drizzle ORM** - ORM type-safe
- **NextAuth.js** - Autenticación

### DevOps
- **Docker** - Containerización
- **Docker Compose** - Orquestación local
- **pnpm** - Gestor de paquetes

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- Go 1.21+
- Docker y Docker Compose
- PostgreSQL 17+
- Redis 7+

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd tfg
```

### 2. Configurar variables de entorno
```bash
# Crear archivo .env en la raíz
cp .env.example .env

# Variables principales necesarias:
DATABASE_URL="postgresql://user:password@localhost:5432/carfindr"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_SECRET="your-secret-key"
RESEND_API_KEY="your-resend-key"
```

### 3. Iniciar servicios de base de datos
```bash
docker-compose up -d db redis
```

### 4. Instalar dependencias y ejecutar migraciones
```bash
cd carfindr
pnpm install
pnpm db:generate
pnpm db:push
```

### 5. Iniciar la aplicación web
```bash
pnpm dev
```

### 6. Configurar el microservicio (opcional)
```bash
cd searchNotifier
go mod tidy
go run main.go
```

## 📖 Uso

### Interfaz Web
1. **Acceso**: Navega a `http://localhost:3000`
2. **Registro/Login**: Usa el sistema de autenticación
3. **Búsqueda**: Selecciona marca, modelo y filtros
4. **Resultados**: Visualiza coches de múltiples plataformas
5. **Guardar búsquedas**: Crea alertas personalizadas

### API Endpoints
- `GET /api/trpc/*` - Endpoints tRPC
- `POST /api/auth/*` - Autenticación NextAuth
- `GET /api/search` - Búsqueda de coches

### Microservicio
El microservicio se ejecuta automáticamente y:
- Busca nuevas ofertas cada 24 horas (configurable)
- Envía notificaciones por email
- Actualiza la base de datos con nuevos resultados

## 📁 Estructura del Proyecto

```
tfg/
├── carfindr/                    # Aplicación web principal
│   ├── src/
│   │   ├── app/                # App Router de Next.js
│   │   │   ├── actions/        # Server Actions
│   │   │   ├── api/           # API routes
│   │   │   └── components/    # Componentes React
│   │   ├── server/            # Lógica del servidor
│   │   │   ├── api/          # tRPC routers
│   │   │   ├── auth/         # Configuración NextAuth
│   │   │   └── db/           # Esquema y conexión DB
│   │   └── styles/           # Estilos globales
│   ├── drizzle/              # Migraciones de base de datos
│   └── package.json
├── searchNotifier/            # Microservicio Go
│   ├── internal/
│   │   ├── clients/          # Clientes de APIs externas
│   │   ├── db/              # Conexión a base de datos
│   │   ├── scheduler/       # Programador de tareas
│   │   └── notifier/        # Sistema de notificaciones
│   └── main.go
├── PoC/                      # Scripts de investigación
│   ├── wallapop/            # Análisis de Wallapop
│   ├── milanuncios/         # Análisis de Milanuncios
│   └── cochesCom/          # Análisis de Coches.com
├── db/                      # Datos de base de datos
│   ├── csv-data/           # Datos CSV de marcas/modelos
│   └── postgres_data/      # Datos de PostgreSQL
├── docker-compose.yml       # Configuración Docker
└── README.md               # Este archivo
```

## 🗄️ Base de Datos

### Esquema Principal
- **users**: Usuarios del sistema
- **saved_searches**: Búsquedas guardadas por usuarios
- **searched_car_listings**: Listados de coches encontrados
- **marcas**: Catálogo de marcas de coches
- **modelos**: Catálogo de modelos por marca

### Migraciones
```bash
# Generar nueva migración
pnpm db:generate

# Aplicar migraciones
pnpm db:push

# Ver base de datos
pnpm db:studio
```

## 🚀 Despliegue

### Desarrollo Local
```bash
# Iniciar todos los servicios
docker-compose up -d
cd carfindr && pnpm dev
```

### Producción
```bash
# Construir imagen Docker
docker build -t carfindr .

# Usar docker-compose.prod.yml
docker-compose -f prodCompose.yml up -d
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Contacto

- **Autor**: [Tu Nombre]
- **Email**: [tu-email@ejemplo.com]
- **Proyecto**: [URL del repositorio]

---

**CarFindr** - Encuentra tu coche ideal entre miles de ofertas 🚗✨ 