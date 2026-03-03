# CarFindr Web Application 🚗

**CarFindr** es la aplicación web principal del proyecto, construida con Next.js 15 y TypeScript. Proporciona una interfaz moderna y responsive para buscar, comparar y gestionar búsquedas de coches de segunda mano.

## 🎯 Características Principales

- 🔍 **Búsqueda Multiplataforma**: Integra Wallapop, Milanuncios y Coches.net
- 👤 **Sistema de Autenticación**: Registro y login seguro con Better Auth
- 💾 **Búsquedas Guardadas**: Guarda y gestiona tus búsquedas favoritas
- 🔔 **Notificaciones**: Recibe alertas cuando aparecen nuevos vehículos
- 📱 **Diseño Responsive**: Optimizado para móviles y desktop
- ⚡ **Rendimiento**: SSR y optimizaciones de Next.js

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 15** - Framework React con App Router
- **TypeScript** - Tipado estático completo
- **Tailwind CSS** - Framework CSS utility-first
- **Radix UI** - Componentes accesibles y personalizables
- **Lucide React** - Iconografía moderna

### Backend & API
- **tRPC** - API type-safe end-to-end
- **Better Auth** - Autenticación y autorización
- **Drizzle ORM** - ORM type-safe para PostgreSQL
- **Server Actions** - Mutaciones del servidor

### Estado & Cache
- **React Query** - Gestión de estado del servidor
- **Redis** - Cache y sesiones
- **Zod** - Validación de esquemas

### DevOps
- **Docker** - Containerización
- **pnpm** - Gestor de paquetes rápido
- **ESLint + Prettier** - Linting y formateo

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- pnpm 8+
- PostgreSQL 17+
- Redis 7+

### 1. Instalar dependencias
```bash
pnpm install
```

### 2. Configurar variables de entorno
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Variables necesarias:
DATABASE_URL="postgresql://user:password@localhost:5432/carfindr"
REDIS_URL="redis://localhost:6379"
AUTH_SECRET="your-secret-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
RESEND_API_KEY="your-resend-key"
```

### 3. Configurar base de datos
```bash
# Generar migraciones
pnpm db:generate

# Aplicar migraciones
pnpm db:push

# Ver base de datos (opcional)
pnpm db:studio
```

### 4. Iniciar desarrollo
```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
src/
├── app/                          # App Router de Next.js
│   ├── actions/                  # Server Actions
│   │   ├── wallapop.ts          # API Wallapop
│   │   ├── milanuncios.ts       # API Milanuncios
│   │   ├── cochesNet.ts         # API Coches.net
│   │   └── marcasModelos.ts     # Datos de marcas/modelos
│   ├── api/                     # API Routes
│   │   ├── auth/                # Better Auth endpoints
│   │   └── trpc/                # tRPC endpoints
│   ├── login/                   # Página de login
│   ├── search/                  # Página de búsqueda
│   ├── user/                    # Panel de usuario
│   ├── layout.tsx              # Layout principal
│   └── page.tsx                # Página de inicio
├── components/                  # Componentes React
│   ├── ui/                     # Componentes base (Radix UI)
│   ├── searchCard.tsx          # Tarjeta de búsqueda
│   ├── navbar.tsx              # Navegación
│   ├── sidebar.tsx             # Barra lateral
│   └── [platform]Card.tsx      # Tarjetas de resultados
├── server/                     # Lógica del servidor
│   ├── api/                    # tRPC routers
│   │   ├── root.ts            # Router principal
│   │   └── routers/           # Routers específicos
│   ├── auth/                  # Configuración Better Auth
│   └── db/                    # Esquema y conexión DB
├── styles/                     # Estilos globales
│   └── globals.css            # CSS global
└── trpc/                      # Configuración tRPC
    ├── react.tsx             # Provider React
    └── server.ts             # Configuración servidor
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
pnpm dev              # Servidor de desarrollo
pnpm build            # Construir para producción
pnpm start            # Iniciar servidor de producción
pnpm preview          # Vista previa de producción

# Base de datos
pnpm db:generate      # Generar migraciones
pnpm db:push          # Aplicar migraciones
pnpm db:studio        # Abrir Drizzle Studio

# Linting y formateo
pnpm lint             # Ejecutar ESLint
pnpm lint:fix         # Corregir errores de linting
pnpm format:write     # Formatear código
pnpm format:check     # Verificar formato

# TypeScript
pnpm typecheck        # Verificar tipos
pnpm check            # Lint + Type check
```

## 🗄️ Base de Datos

### Esquema Principal
```typescript
// Usuarios y autenticación
users                 // Usuarios del sistema
accounts              // Cuentas de proveedores OAuth
sessions              // Sesiones activas
verifications         // Tokens de verificación

// Datos de coches
marcas                // Catálogo de marcas
modelos               // Catálogo de modelos por marca

// Búsquedas y resultados
savedSearches         // Búsquedas guardadas por usuarios
searchedCarListings   // Listados encontrados por búsqueda
```

### Migraciones
```bash
# Crear nueva migración
pnpm db:generate

# Aplicar migraciones
pnpm db:push

# Ver estado de migraciones
pnpm db:studio
```

## 🔌 APIs Integradas

### Wallapop
- **Endpoint**: `https://api.wallapop.com/api/v3/cars/search`
- **Funcionalidad**: Búsqueda de coches con filtros avanzados
- **Paginación**: Soporte para paginación automática

### Milanuncios
- **Endpoint**: API REST de Milanuncios
- **Funcionalidad**: Búsqueda y filtrado de vehículos
- **Autenticación**: Headers personalizados

### Coches.net
- **Endpoint**: API de Coches.net
- **Funcionalidad**: Búsqueda de coches usados
- **Filtros**: Marca, modelo, precio, kilometraje

## 🎨 Componentes UI

### Componentes Base (Radix UI)
- `Button` - Botones con variantes
- `Card` - Tarjetas de contenido
- `Dialog` - Modales y diálogos
- `DropdownMenu` - Menús desplegables
- `Input` - Campos de entrada
- `Label` - Etiquetas de formulario

### Componentes Específicos
- `SearchCard` - Formulario de búsqueda principal
- `Navbar` - Navegación superior
- `Sidebar` - Panel lateral
- `[Platform]Card` - Tarjetas de resultados por plataforma
- `RecentSearchesCard` - Búsquedas recientes

## 🔐 Autenticación

### Better Auth Configuration
```typescript
// Configuración en server/auth/index.ts
export const auth = betterAuth({
  socialProviders: {
    google: { clientId: "...", clientSecret: "..." },
    discord: { clientId: "...", clientSecret: "..." },
  },
})
```

### Rutas Protegidas
- `/user/*` - Requiere autenticación
- `/search` - Acceso público con funcionalidades limitadas

## 🚀 Despliegue

### Desarrollo Local
```bash
# Con Docker Compose
docker-compose up -d db redis
pnpm dev
```

### Producción
```bash
# Construir imagen
docker build -t carfindr .

# Usar docker-compose.prod.yml
docker-compose -f prodCompose.yml up -d
```

### Variables de Entorno de Producción
```bash
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
AUTH_SECRET=...
NEXT_PUBLIC_APP_URL=https://yourdomain.com
RESEND_API_KEY=...
```

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén implementados)
pnpm test

# Tests de integración
pnpm test:integration

# Coverage
pnpm test:coverage
```

## 📊 Monitoreo y Logs

- **Logs**: Console.log para desarrollo, Winston para producción
- **Métricas**: Integración con herramientas de monitoreo
- **Errores**: Captura y reporte de errores

## 🤝 Contribución

1. Fork el repositorio
2. Crea una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

### Guías de Contribución
- Usa TypeScript para todo el código
- Sigue las convenciones de ESLint/Prettier
- Añade tests para nuevas funcionalidades
- Documenta APIs y componentes nuevos

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

---

**CarFindr Web App** - La interfaz moderna para encontrar tu coche ideal 🚗✨
