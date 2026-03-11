# Altos De Videma - Backend

Backend para la gestión integral del barrio privado Altos de Videma. Construido con NestJS, ofrece una API RESTful robusta y escalable para manejar todas las operaciones necesarias.

## Características Principales

- **Autenticación y Autorización:** Sistema de usuarios con roles y protección de rutas mediante JWT.
- **Gestión de Propiedades:** Administración de unidades funcionales, propietarios e inquilinos.
- **Control de Visitantes:** Registro y seguimiento de visitantes.
- **Gestión de Paquetería:** Notificación y registro de paquetes recibidos.
- **Comunicación:** Sistema de mensajería en tiempo real a través de WebSockets.
- **Notificaciones:** Envío de notificaciones push a los residentes.
- **Gestión de Emergencias:** Reporte y seguimiento de emergencias.
- **Subida de Archivos:** Manejo de archivos y documentos.

## Tecnologías Utilizadas

- [NestJS](https://nestjs.com/) - Framework de Node.js para construir aplicaciones eficientes y escalables.
- [TypeScript](https://www.typescriptlang.org/) - Superset de JavaScript que añade tipado estático.
- [TypeORM](https://typeorm.io/) - ORM para TypeScript y JavaScript.
- [PostgreSQL](https://www.postgresql.org/) - Base de datos relacional.
- [JWT](https://jwt.io/) - Para la generación de tokens de acceso.
- [Socket.IO](https://socket.io/) - Para la comunicación en tiempo real.
- [Docker](https://www.docker.com/) - Para la contenerización de la aplicación.

## Empezando

Sigue estas instrucciones para tener una copia del proyecto corriendo en tu máquina local para desarrollo y pruebas.

### Pre-requisitos

- [Node.js](https://nodejs.org/es/) (v16 o superior)
- [Yarn](https://yarnpkg.com/)
- [Docker](https://www.docker.com/get-started)

### Instalación

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/tomas-massini/Altos-De-Videma-Backend.git
    cd Altos-De-Videma-Backend
    ```

2.  **Instalar dependencias:**
    ```bash
    yarn install
    ```

3.  **Configurar las variables de entorno:**
    Copia el archivo `.env.template` a un nuevo archivo llamado `.env`.
    ```bash
    cp .env.template .env
    ```
    Luego, modifica el archivo `.env` con la configuración de tu base de datos y otras variables necesarias.

4.  **Levantar la base de datos con Docker:**
    ```bash
    docker-compose up -d
    ```

### Ejecutando la Aplicación

-   **Modo Desarrollo (con hot-reload):**
    ```bash
    yarn start:dev
    ```

-   **Build para Producción:**
    ```bash
    yarn build
    ```

-   **Iniciar en modo Producción:**
    ```bash
    yarn start:prod
    ```

### Ejecutando los Tests

-   **Tests Unitarios:**
    ```bash
    yarn test
    ```

-   **Tests con coverage:**
    ```bash
    yarn test:cov
    ```

## Estructura del Proyecto

El proyecto sigue la estructura estándar de una aplicación NestJS, con módulos para cada una de las características principales.

```
src/
├── auth/             # Autenticación y usuarios
├── common/           # DTOs y utilidades comunes
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

## API Reference

Todos los endpoints (excepto login) requieren autenticación JWT. Incluir el header:
```
Authorization: Bearer <TU_ACCESS_TOKEN>
```

### 1. Autenticación

#### Login
- **POST** `/auth/login`
- **Body:**
```json
{
  "email": "admin@test.com",
  "password": "123456"
}
```
- **Respuesta:** `{ "access_token": "eyJ..." }`

---

### 2. Emergencias

#### Crear emergencia
- **POST** `/emergency`
- **Body:**
```json
{
  "title": "Incendio en cocina",
  "description": "Se detectó humo en el área de cocina"
}
```

#### Listar todas las emergencias
- **GET** `/emergency`

#### Obtener emergencia por ID
- **GET** `/emergency/:id`

#### Obtener emergencias por usuario
- **GET** `/emergency/user/:userId`

#### Finalizar emergencia
- **PATCH** `/emergency/end/:id`

#### Marcar como leída
- **PATCH** `/emergency/seen/:id`

#### Eliminar emergencia
- **DELETE** `/emergency/:id`

---

### 3. Paquetes

#### Crear paquete
- **POST** `/package`
- **Body:**
```json
{
  "arrivalDate": "2024-01-15",
  "title": "Paquete Amazon",
  "description": "Caja mediana con electronics",
  "propertyId": "<ID_DE_PROPIEDAD>"
}
```

#### Listar todos los paquetes
- **GET** `/package`

#### Listar paquetes del usuario
- **GET** `/package/user/packages`

#### Obtener paquete por ID
- **GET** `/package/:id`

#### Marcar como recibido
- **PATCH** `/package/mark-as-received/:id`

#### Eliminar paquete
- **DELETE** `/package/:id`

---

### 4. Visitantes

#### Crear visitante
- **POST** `/visitor`
- **Body:**
```json
{
  "property": "<ID_DE_PROPIEDAD>",
  "dateAndTimeOfVisit": "2024-01-20T14:00:00Z",
  "fullName": "Juan Pérez",
  "dni": "12345678",
  "phone": "+5491155555555",
  "description": "Visita familiar",
  "vehiclePlate": "ABC123"
}
```

#### Listar todos los visitantes
- **GET** `/visitor`

#### Obtener visitante por ID
- **GET** `/visitor/:id`

#### Actualizar visitante
- **PATCH** `/visitor/:id`

#### Marcar visita como completada
- **PATCH** `/visitor/visit-completed/:id`

#### Eliminar visitante
- **DELETE** `/visitor/:id`

---

### 5. Propiedades

#### Listar todas las propiedades
- **GET** `/property`

#### Obtener propiedad por ID
- **GET** `/property/:id`

*(Nota: Se requiere el ID de una propiedad existente para crear paquetes y visitantes. Obtén los IDs del endpoint GET /property)*