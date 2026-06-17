# Innovatech Frontend

Aplicación web de gestión de proyectos y tareas desarrollada con React + TypeScript + Vite. Permite a administradores, gestores de proyectos y colaboradores interactuar con el sistema según su rol.

## Tecnologías

- **React 19** + **TypeScript**
- **Vite 8** (bundler y dev server)
- **React Router DOM 7** (enrutamiento)
- **React Bootstrap 2** + **Bootstrap 5** (UI)
- **Lucide React** (íconos)
- **Vitest 4** + **React Testing Library** (pruebas unitarias)
- **@vitest/coverage-v8** (cobertura de código)

## Requisitos previos

- Node.js >= 18
- npm >= 9
- Backend Innovatech corriendo en `http://localhost:8080` (para desarrollo local)

## Instalación

```bash
npm install
```

## Variables de entorno

Para desarrollo local no se requiere configuración adicional; el servidor de Vite actúa como proxy hacia `http://localhost:8080`.

Para producción, crear un archivo `.env.production` en la raíz del proyecto:

```env
VITE_BACKEND_URL=http://<URL_DEL_LOAD_BALANCER>
```

## Ejecución

### Modo desarrollo

```bash
npm run dev
```

Abre automáticamente `http://localhost:5173` con Hot Module Replacement activo.

### Build de producción

```bash
npm run build
```

Genera la carpeta `dist/` lista para desplegar en un servidor estático (S3, Nginx, etc.).

### Vista previa del build

```bash
npm run preview
```

## Pruebas unitarias

### Ejecutar todas las pruebas

```bash
npm run test:run
```

### Ejecutar en modo watch (desarrollo)

```bash
npm run test
```

### Generar reporte de cobertura

```bash
npm run test:coverage
```

El reporte se genera en la carpeta `coverage/` en tres formatos:
- **Terminal** — resumen inmediato en consola
- **HTML** — abrir `coverage/index.html` en el navegador para explorar la cobertura por archivo
- **LCOV** — archivo `coverage/lcov.info` compatible con herramientas CI/CD

### Resultados de cobertura (último reporte)

| Métrica     | Cobertura |
|-------------|-----------|
| Statements  | 78.77%    |
| Branches    | 66.42%    |
| Functions   | 71.58%    |
| Lines       | 81.83%    |

> Cobertura mínima requerida: **60%** — todos los indicadores la superan.

### Estructura de las pruebas

Los archivos de test se ubican junto al componente que prueban, con la extensión `.test.tsx` o `.test.ts`:

```
src/
├── App.test.tsx
├── components/
│   ├── Admin/
│   │   ├── AdminLayout.test.tsx
│   │   ├── Analytics.test.tsx
│   │   ├── Config.test.tsx
│   │   ├── Dashboard.test.tsx
│   │   ├── ProjectsManagement.test.tsx
│   │   ├── Sidebar.test.tsx
│   │   ├── UserRegistration.test.tsx
│   │   └── UsersManagement.test.tsx
│   ├── Gestor/
│   │   ├── GestorLayout.test.tsx
│   │   ├── GestorProfile.test.tsx
│   │   ├── GestorProjects.test.tsx
│   │   └── GestorTaskBoard.test.tsx
│   ├── Login/
│   │   └── Login.test.tsx
│   ├── User/
│   │   ├── TaskBoard.test.tsx
│   │   ├── UserDashboard.test.tsx
│   │   ├── UserLayout.test.tsx
│   │   ├── UserProfile.test.tsx
│   │   └── UserProjects.test.tsx
│   └── common/
│       └── ChangePasswordCard.test.tsx
├── config/
│   └── api.test.ts
├── context/
│   └── AuthContext.test.tsx
└── utils/
    ├── notificationsUtils.test.ts
    ├── rutUtils.test.ts
    └── skillsUtils.test.ts
```

## Linting

```bash
npm run lint
```

## Estructura del proyecto

```
front_innovatech/
├── public/               # Archivos estáticos públicos
├── src/
│   ├── assets/           # Imágenes y recursos
│   ├── components/
│   │   ├── Admin/        # Vistas del rol Administrador
│   │   ├── Gestor/       # Vistas del rol Gestor de Proyectos
│   │   ├── Login/        # Pantalla de autenticación
│   │   ├── User/         # Vistas del rol Colaborador
│   │   └── common/       # Componentes reutilizables
│   ├── config/
│   │   └── api.ts        # URLs y endpoints de la API REST
│   ├── context/
│   │   └── AuthContext.tsx  # Contexto de autenticación JWT
│   ├── test/
│   │   └── setup.ts      # Configuración global de Vitest
│   ├── utils/
│   │   ├── notificationsUtils.ts
│   │   ├── rutUtils.ts
│   │   └── skillsUtils.ts
│   ├── App.tsx           # Enrutamiento principal con guards por rol
│   └── main.tsx          # Punto de entrada
├── infra/s3/             # Scripts PowerShell para deploy en AWS S3
├── package.json
├── vite.config.ts        # Configuración de Vite + proxy + cobertura
└── tsconfig.app.json
```

## Roles de usuario

| Rol                | Acceso |
|--------------------|--------|
| `ADMINISTRADOR`    | Dashboard de analytics, gestión de usuarios, proyectos y configuración |
| `GESTOR_PROYECTOS` | Proyectos asignados y tablero de tareas |
| `COLABORADOR`      | Dashboard personal, proyectos y tablero de tareas |

La autenticación usa JWT almacenado en `localStorage`. El token se valida en cada carga y se elimina automáticamente si está vencido.

## Despliegue en AWS S3

Los scripts de infraestructura se encuentran en `infra/s3/`:

1. **Crear el bucket** (solo primera vez):
   ```powershell
   .\infra\s3\01-create-bucket.ps1
   ```

2. **Build y deploy**:
   ```powershell
   $env:VITE_BACKEND_URL = "http://<URL_DEL_LOAD_BALANCER>"
   .\infra\s3\02-build-and-deploy.ps1
   ```
