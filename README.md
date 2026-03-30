# Altos De Videma - Backend

Backend para la gestión integral del barrio privado Altos de Videma. Construido con NestJS, ofrece una API RESTful robusta y escalable para manejar todas las operaciones necesarias.

**Versión:** 1.0.0  
**Última actualización:** 2025-03-15  
**Estado:** 🟢 Production Ready
.
## Características Principales

- **Autenticación y Autorización:** Sistema de usuarios con roles y protección de rutas mediante JWT.
- **Gestión de Propiedades:** Administración de unidades funcionales, propietarios e inquilinos.
- **Control de Visitantes:** Registro y seguimiento de visitantes con DNI único y patente de vehículo.
- **Gestión de Paquetería:** Notificación y registro de paquetes recibidos.
- **Comunicación:** Sistema de mensajería en tiempo real a través de WebSockets.
- **Notificaciones:** Envío de notificaciones push a los residentes.
- **Gestión de Emergencias:** Reporte y seguimiento de emergencias.
- **Subida de Archivos:** Manejo de archivos y documentos.

## Seguridad

- 🔒 Helmet.js para cabeceras de seguridad HTTP
- 🔒 CORS configurado con orígenes permitidos
- 🔒 Validación de datos con class-validator
- 🔒 JWT con expiración configurable
- 🔒 Filtros de excepciones para manejo seguro de errores
- 🔒 SSL/TLS para conexiones a base de datos en producción

## Tecnologías Utilizadas

- [NestJS](https://nestjs.com/) v10 - Framework de Node.js para construir aplicaciones eficientes y escalables.
- [TypeScript](https://www.typescriptlang.org/) v5 - Superset de JavaScript que añade tipado estático.
- [TypeORM](https://typeorm.io/) v0.3 - ORM para TypeScript y JavaScript.
- [PostgreSQL](https://www.postgresql.org/) v14 - Base de datos relacional.
- [JWT](https://jwt.io/) - Para la generación de tokens de acceso.
- [Socket.IO](https://socket.io/) v4 - Para la comunicación en tiempo real.
- [Docker](https://www.docker.com/) - Para la contenerización de la aplicación.
- [Helmet](https://helmetjs.github.io/) - Para asegurar cabeceras HTTP.

## Empezando

Sigue estas instrucciones para tener una copia del proyecto corriendo en tu máquina local para desarrollo y pruebas.

### Pre-requisitos

- [Node.js](https://nodejs.org/es/) (v20 o superior)
- [Yarn](https://yarnpkg.com/)
- [Docker](https://www.docker.com/get-started) (opcional, para desarrollo local)

### Instalación

1. **Clonar el repositorio:**
    ```bash
    git clone https://github.com/tomas-massini/Altos-De-Videma-Backend.git
    cd Altos-De-Videma-Backend
    ```

2. **Instalar dependencias:**
    ```bash
    yarn install
    ```

3. **Configurar las variables de entorno:**
    Copia el archivo `.env.template` a un nuevo archivo llamado `.env`.
    ```bash
    cp .env.template .env
    ```
    
    **IMPORTANTE:** En producción, cambia los siguientes valores:
    - `JWT_SECRET` - Genera uno nuevo con: `openssl rand -base64 32`
    - `DB_PASSWORD` - Usa una contraseña segura
    - `ALLOWED_ORIGINS` - Configura los dominios de tu frontend

4. **Levantar la base de datos con Docker (opcional):**
    ```bash
    docker-compose up -d db
    ```

### Ejecutando la Aplicación

- **Modo Desarrollo (con hot-reload):**
    ```bash
    yarn start:dev
    ```

- **Build para Producción:**
    ```bash
    yarn build
    ```

- **Iniciar en modo Producción:**
    ```bash
    yarn start:prod
    ```

### Ejecutando con Docker (Producción)

```bash
docker-compose up -d --build
```

La API estará disponible en `http://localhost:3001`

### Ejecutando los Tests

- **Tests Unitarios:**
    ```bash
    yarn test
    ```

- **Tests con coverage:**
    ```bash
    yarn test:cov
    ```

## Documentación de la API

Una vez levantada la aplicación, puedes acceder a la documentación interactiva de Swagger en:

- **Swagger UI:** `http://localhost:3001/api/docs`

Todos los endpoints (excepto login y registro) requieren autenticación JWT. Incluir el header:
```
Authorization: Bearer <TU_ACCESS_TOKEN>
```

### Endpoints Principales

#### 1. Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/register` | Registrar nuevo usuario |
| POST | `/auth/login` | Iniciar sesión |
| GET | `/auth/check-status` | Verificar estado de autenticación |
| GET | `/auth/phone/:phone` | Obtener usuario y visitantes por teléfono |

#### 2. Visitantes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/visitor` | Crear visitante |
| GET | `/visitor` | Listar todos los visitantes |
| GET | `/visitor/:id` | Obtener visitante por ID |
| PATCH | `/visitor/:id` | Actualizar visitante |
| PATCH | `/visitor/visit-completed/:id` | Marcar visita como completada |
| DELETE | `/visitor/:id` | Eliminar visitante |

#### 3. Propiedades

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/property` | Crear propiedad |
| GET | `/property` | Listar todas las propiedades |
| GET | `/property/my-properties` | Listar mis propiedades |
| GET | `/property/:id` | Obtener propiedad por ID |
| PATCH | `/property/:id` | Actualizar propiedad |
| PATCH | `/property/set-main/:id` | Establecer propiedad como principal |

#### 4. Paquetes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/package` | Crear paquete |
| GET | `/package` | Listar todos los paquetes |
| GET | `/package/user/packages` | Listar mis paquetes |
| PATCH | `/package/mark-as-received/:id` | Marcar como recibido |
| DELETE | `/package/:id` | Eliminar paquete |

#### 5. Emergencias

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/emergency` | Crear emergencia |
| GET | `/emergency` | Listar emergencias |
| PATCH | `/emergency/end/:id` | Finalizar emergencia |
| PATCH | `/emergency/seen/:id` | Marcar como leída |

## Estructura del Proyecto

```
src/
├── auth/             # Autenticación y usuarios
├── common/           # DTOs, filtros y utilidades comunes
├── emergency/        # Módulo de emergencias
├── files/            # Gestión de archivos
├── messages-ws/      # WebSocket para mensajería
├── notification/     # Notificaciones
├── package/          # Gestión de paquetería
├── property/         # Gestión de propiedades
├── visitor/          # Gestión de visitantes
├── app.module.ts     # Módulo raíz
└── main.ts           # Archivo de entrada
```

## Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | 3001 |
| `STAGE` | Entorno (dev/prod) | dev |
| `DB_HOST` | Host de la base de datos | localhost |
| `DB_PORT` | Puerto de la base de datos | 5432 |
| `DB_NAME` | Nombre de la base de datos | altosdeviedma |
| `DB_USERNAME` | Usuario de la base de datos | postgres |
| `DB_PASSWORD` | Contraseña de la base de datos | - |
| `JWT_SECRET` | Secreto para JWT | - |
| `JWT_EXPIRATION` | Expiración del token | 1d |
| `ALLOWED_ORIGINS` | Orígenes CORS permitidos | localhost |

## Despliegue

### Vercel

El proyecto está configurado para desplegarse en Vercel. El archivo `vercel.json` contiene la configuración necesaria.

### Docker

Para producción, usa Docker Compose:

```bash
docker-compose up -d --build
```

## License

UNLICENSED - Todos los derechos reservados.

---

**Altos de Viedma Backend** - Sistema de gestión para barrios privados.