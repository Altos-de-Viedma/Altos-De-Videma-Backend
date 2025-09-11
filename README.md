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