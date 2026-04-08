# 🎨 Portfolio Backend API

Backend seguro y escalable para portafolio personal construido con **Cloudflare Workers** y **D1 Database**.

## 🚀 Tech Stack

- **Runtime:** Cloudflare Workers (Edge Computing)
- **Database:** Cloudflare D1 (SQLite distribuido)
- **Language:** TypeScript
- **Auth:** JWT (HS256)
- **Architecture:** Feature-based Modular

## ✅ Características

- **JWT Authentication** - Tokens seguros con expiración de 24h
- **SQL Injection Prevention** - Prepared statements automáticos
- **Input Validation & Sanitization** - Validadores especializados
- **Rate Limiting** - 5 mensajes de contacto por IP/hora
- **Password Hashing** - SHA-256
- **CORS Headers** - Control de orígenes
- **Modular Architecture** - Código organizado por features
- **Error Codes System** - Códigos de error consistentes y estandarizados
- **Audit Logging** - Registro completo de acciones del sistema
- **Soft Delete** - Papelera para proyectos con opción de restaurar
- **Multi-channel Notifications** - Email, Telegram, Discord, Webhooks
- **Critical Error Alerts** - Notificaciones automáticas de errores críticos
- **Brute Force Protection** - Bloqueo tras intentos fallidos de login

---

## 📦 Instalación

```bash
# Clonar repositorio
git clone https://github.com/nayvilla/portfolio-backend.git
cd portfolio-backend

# Instalar dependencias
npm install
```

### Configuración

Edita `wrangler.toml` con tu JWT_SECRET:

```toml
[vars]
JWT_SECRET = "tu-clave-secreta-muy-segura-minimo-32-caracteres"
```

### Comandos

```bash
npm run dev      # Servidor local (localhost:8787)
npm run build    # Compilar TypeScript
npm run deploy   # Desplegar a Cloudflare Workers
```

---

## 📚 API Reference

**Base URL:** `http://localhost:8787` (desarrollo) | `https://tu-worker.workers.dev` (producción)

### Headers Comunes

```
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>  (rutas protegidas)
```

---

## 🔐 Auth Module

### POST `/api/auth/register`
Registrar nuevo administrador.

```bash
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "SecurePass123!"
  }'
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com"
  }
}
```

---

### POST `/api/auth/login`
Iniciar sesión.

```bash
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "SecurePass123!"
  }'
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 86400,
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com"
    }
  }
}
```

---

### GET `/api/auth/profile` 🔒
Obtener perfil del usuario autenticado.

```bash
curl http://localhost:8787/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "is_active": 1,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### POST `/api/auth/logout` 🔒
Cerrar sesión (client-side debe eliminar el token).

```bash
curl -X POST http://localhost:8787/api/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 📁 Projects Module

### GET `/api/projects`
Listar proyectos publicados (público).

```bash
# Sin filtros
curl http://localhost:8787/api/projects

# Con filtros
curl "http://localhost:8787/api/projects?category=web&status=published&limit=10&offset=0"
```

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| category | string | Filtrar por categoría |
| status | string | published, draft, archived |
| limit | number | Cantidad (default: 10) |
| offset | number | Paginación (default: 0) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "slug": "mi-proyecto",
      "title": "Mi Proyecto",
      "short_description": "Descripción corta",
      "full_description": "Descripción completa...",
      "category": "web",
      "status": "published",
      "featured": 1,
      "sort_order": 1,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0
  }
}
```

---

### GET `/api/projects/:slug`
Obtener proyecto por slug (público).

```bash
curl http://localhost:8787/api/projects/mi-proyecto
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "slug": "mi-proyecto",
    "title": "Mi Proyecto",
    "short_description": "Descripción corta",
    "full_description": "Descripción larga con detalles...",
    "category": "web",
    "status": "published",
    "featured": 1,
    "sort_order": 1,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "images": [
      {
        "id": 1,
        "image_url": "https://example.com/image.jpg",
        "alt_text": "Screenshot principal",
        "is_primary": 1,
        "sort_order": 1
      }
    ],
    "links": [
      {
        "id": 1,
        "link_type": "github",
        "url": "https://github.com/user/repo",
        "label": "Ver código"
      }
    ],
    "technologies": [
      {
        "id": 1,
        "name": "TypeScript",
        "slug": "typescript",
        "icon_url": "https://example.com/ts.svg"
      }
    ],
    "likes_count": 42
  }
}
```

---

### POST `/api/admin/projects` 🔒
Crear nuevo proyecto.

```bash
curl -X POST http://localhost:8787/api/admin/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "slug": "nuevo-proyecto",
    "title": "Nuevo Proyecto",
    "short_description": "Una breve descripción",
    "full_description": "Descripción completa del proyecto...",
    "category": "web",
    "status": "draft",
    "featured": false,
    "sort_order": 1
  }'
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "slug": "nuevo-proyecto",
    "title": "Nuevo Proyecto",
    "status": "draft"
  }
}
```

---

### PUT `/api/admin/projects/:id` 🔒
Actualizar proyecto existente.

```bash
curl -X PUT http://localhost:8787/api/admin/projects/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Proyecto Actualizado",
    "status": "published"
  }'
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "slug": "mi-proyecto",
    "title": "Proyecto Actualizado",
    "status": "published"
  }
}
```

---

### DELETE `/api/admin/projects/:id` 🔒
Eliminar proyecto.

```bash
curl -X DELETE http://localhost:8787/api/admin/projects/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

---

### PUT `/api/admin/projects/:id/publish` 🔒
Publicar proyecto (cambiar status a "published").

```bash
curl -X PUT http://localhost:8787/api/admin/projects/1/publish \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Project published successfully"
}
```

---

### Project Images

#### GET `/api/projects/:projectId/images`
Listar imágenes de un proyecto.

```bash
curl http://localhost:8787/api/projects/1/images
```

#### POST `/api/admin/projects/:projectId/images` 🔒
Agregar imagen a proyecto.

```bash
curl -X POST http://localhost:8787/api/admin/projects/1/images \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "image_url": "https://example.com/screenshot.png",
    "alt_text": "Vista principal de la app",
    "is_primary": true,
    "sort_order": 1
  }'
```

#### DELETE `/api/admin/projects/images/:imageId` 🔒
Eliminar imagen.

```bash
curl -X DELETE http://localhost:8787/api/admin/projects/images/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Project Links

#### GET `/api/projects/:projectId/links`
Listar enlaces de un proyecto.

```bash
curl http://localhost:8787/api/projects/1/links
```

#### POST `/api/admin/projects/:projectId/links` 🔒
Agregar enlace a proyecto.

```bash
curl -X POST http://localhost:8787/api/admin/projects/1/links \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "link_type": "github",
    "url": "https://github.com/user/repo",
    "label": "Ver código fuente"
  }'
```

**link_type options:** `github`, `demo`, `documentation`, `other`

#### DELETE `/api/admin/projects/links/:linkId` 🔒
Eliminar enlace.

```bash
curl -X DELETE http://localhost:8787/api/admin/projects/links/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Project Technologies

#### GET `/api/projects/:projectId/technologies`
Listar tecnologías de un proyecto.

```bash
curl http://localhost:8787/api/projects/1/technologies
```

#### POST `/api/admin/projects/:projectId/technologies` 🔒
Asociar tecnología a proyecto.

```bash
curl -X POST http://localhost:8787/api/admin/projects/1/technologies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "technology_id": 5
  }'
```

#### DELETE `/api/admin/projects/:projectId/technologies/:techId` 🔒
Desasociar tecnología de proyecto.

```bash
curl -X DELETE http://localhost:8787/api/admin/projects/1/technologies/5 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Project Likes

#### POST `/api/projects/:projectId/like`
Dar like a un proyecto (público, basado en IP).

```bash
curl -X POST http://localhost:8787/api/projects/1/like
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "likes_count": 43,
    "already_liked": false
  }
}
```

#### GET `/api/projects/:projectId/likes`
Obtener contador de likes.

```bash
curl http://localhost:8787/api/projects/1/likes
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "likes_count": 43
  }
}
```

---

## 💬 Contact Module

### POST `/api/contact`
Enviar mensaje de contacto (público, rate limited: 5/hora).

```bash
curl -X POST http://localhost:8787/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "subject": "Consulta sobre proyecto",
    "message": "Hola, me interesa tu trabajo en el proyecto X. ¿Podríamos hablar?",
    "purpose": "freelance"
  }'
```

**Campos:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| name | string | ✅ | Nombre (2-100 caracteres) |
| email | string | ✅ | Email válido |
| subject | string | ❌ | Asunto (máx 200 caracteres) |
| message | string | ✅ | Mensaje (10-5000 caracteres) |
| purpose | string | ❌ | Propósito del mensaje |

**Valores válidos para `purpose`:**
| Valor | Descripción |
|-------|-------------|
| `freelance` | Proyecto freelance / Contratación |
| `job_offer` | Oferta de trabajo / Vacante |
| `question` | Pregunta sobre un proyecto |
| `collaboration` | Colaboración |
| `other` | Otro |

**Response (201):**
```json
{
  "success": true,
  "message": "Message sent successfully"
}
```

**Rate Limit Response (429):**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again later."
}
```

---

### GET `/api/admin/contact` 🔒
Listar mensajes de contacto (admin).

```bash
# Todos los mensajes
curl http://localhost:8787/api/admin/contact \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Filtrar por estado
curl "http://localhost:8787/api/admin/contact?status=unread&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | unread, read, replied, archived |
| limit | number | Cantidad (default: 10) |
| offset | number | Paginación (default: 0) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "subject": "Consulta",
      "message": "Contenido del mensaje...",
      "status": "unread",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 10,
    "offset": 0
  }
}
```

---

### GET `/api/admin/contact/:id` 🔒
Obtener mensaje específico.

```bash
curl http://localhost:8787/api/admin/contact/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### PUT `/api/admin/contact/:id/status` 🔒
Actualizar estado del mensaje.

```bash
curl -X PUT http://localhost:8787/api/admin/contact/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "read"
  }'
```

**Status options:** `unread`, `read`, `replied`, `archived`

**Response (200):**
```json
{
  "success": true,
  "message": "Status updated successfully"
}
```

---

### DELETE `/api/admin/contact/:id` 🔒
Eliminar mensaje.

```bash
curl -X DELETE http://localhost:8787/api/admin/contact/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## � Sistema de Notificaciones

El backend envía notificaciones automáticas a través de múltiples canales cuando ocurren eventos importantes.

### Eventos que generan notificaciones

| Evento | Canales | Descripción |
|--------|---------|-------------|
| **Mensaje de contacto** | Email, Telegram | Cuando alguien envía un mensaje desde el portfolio |
| **Error crítico** | Email, Telegram | Cuando ocurre un error en el servidor |

### Configuración de canales

Configura los secrets en Cloudflare:

```bash
# Email (Resend.com)
npx wrangler secret put NOTIFICATION_EMAIL_API_KEY
npx wrangler secret put NOTIFICATION_EMAIL_FROM
npx wrangler secret put NOTIFICATION_EMAIL_TO

# Telegram
npx wrangler secret put NOTIFICATION_TELEGRAM_BOT_TOKEN
npx wrangler secret put NOTIFICATION_TELEGRAM_CHAT_ID

# Discord (opcional)
npx wrangler secret put NOTIFICATION_DISCORD_WEBHOOK_URL

# Webhook genérico (opcional)
npx wrangler secret put NOTIFICATION_WEBHOOK_URL
npx wrangler secret put NOTIFICATION_WEBHOOK_SECRET
```

Habilita/deshabilita canales en `wrangler.toml`:

```toml
[vars]
NOTIFICATION_EMAIL_ENABLED = "true"
NOTIFICATION_TELEGRAM_ENABLED = "true"
NOTIFICATION_DISCORD_ENABLED = "false"
NOTIFICATION_WEBHOOK_ENABLED = "false"
```

### Formato de notificaciones

**Mensaje de contacto (con purpose):**
```
📬 Nuevo mensaje de Juan Pérez

Me interesa contratarte para un proyecto web.

━━━━━━━━━━━━━━━━━
📧 De: Juan Pérez
✉️ Email: juan@ejemplo.com
📋 Asunto: Proyecto Web
🎯 Propósito: Proyecto freelance / Contratación
━━━━━━━━━━━━━━━━━
```

**Error crítico:**
```
🚨 Error Crítico en Portfolio Backend

Se ha producido un error en el servidor.

Error: D1_ERROR: Connection failed

━━━━━━━━━━━━━━━━━
📍 Endpoint: POST /api/projects
⏰ Timestamp: 2026-04-08T18:30:00.000Z
🔒 IP Hash: a1b2c3d4e5f6...
━━━━━━━━━━━━━━━━━
```

---

## �🛠 Technologies Module

### GET `/api/technologies`
Listar todas las tecnologías (público).

```bash
curl http://localhost:8787/api/technologies

# Filtrar por categoría
curl "http://localhost:8787/api/technologies?category=frontend"
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "TypeScript",
      "slug": "typescript",
      "icon_url": "https://example.com/ts.svg",
      "category": "language",
      "proficiency_level": 90,
      "sort_order": 1
    },
    {
      "id": 2,
      "name": "React",
      "slug": "react",
      "icon_url": "https://example.com/react.svg",
      "category": "frontend",
      "proficiency_level": 85,
      "sort_order": 2
    }
  ]
}
```

---

### GET `/api/technologies/:slug`
Obtener tecnología por slug.

```bash
curl http://localhost:8787/api/technologies/typescript
```

---

### POST `/api/admin/technologies` 🔒
Crear tecnología.

```bash
curl -X POST http://localhost:8787/api/admin/technologies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Vue.js",
    "slug": "vuejs",
    "icon_url": "https://example.com/vue.svg",
    "category": "frontend",
    "proficiency_level": 75,
    "sort_order": 5
  }'
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "name": "Vue.js",
    "slug": "vuejs"
  }
}
```

---

### PUT `/api/admin/technologies/:id` 🔒
Actualizar tecnología.

```bash
curl -X PUT http://localhost:8787/api/admin/technologies/3 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "proficiency_level": 80
  }'
```

---

### DELETE `/api/admin/technologies/:id` 🔒
Eliminar tecnología.

```bash
curl -X DELETE http://localhost:8787/api/admin/technologies/3 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## ⚙️ Settings Module

### GET `/api/settings`
Obtener configuración pública del sitio.

```bash
curl http://localhost:8787/api/settings
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "site_title": "Mi Portafolio",
    "site_description": "Desarrollador Full Stack",
    "contact_email": "contact@example.com",
    "github_url": "https://github.com/username",
    "linkedin_url": "https://linkedin.com/in/username",
    "theme": "dark"
  }
}
```

---

### GET `/api/admin/settings` 🔒
Obtener todas las configuraciones (incluye privadas).

```bash
curl http://localhost:8787/api/admin/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "setting_key": "site_title",
      "setting_value": "Mi Portafolio",
      "value_type": "string",
      "setting_group": "general",
      "is_public": 1
    },
    {
      "id": 2,
      "setting_key": "analytics_enabled",
      "setting_value": "true",
      "value_type": "boolean",
      "setting_group": "analytics",
      "is_public": 0
    }
  ]
}
```

---

### PUT `/api/admin/settings/:key` 🔒
Actualizar configuración.

```bash
curl -X PUT http://localhost:8787/api/admin/settings/site_title \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "value": "Nuevo Título del Portafolio"
  }'
```

**Response (200):**
```json
{
  "success": true,
  "message": "Setting updated successfully"
}
```

---

### POST `/api/admin/settings` 🔒
Crear nueva configuración.

```bash
curl -X POST http://localhost:8787/api/admin/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "setting_key": "custom_setting",
    "setting_value": "custom value",
    "value_type": "string",
    "setting_group": "custom",
    "is_public": false
  }'
```

---

## 📊 Analytics Module

### POST `/api/analytics/track`
Registrar evento analítico (público).

```bash
curl -X POST http://localhost:8787/api/analytics/track \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "page_view",
    "page_path": "/projects/mi-proyecto",
    "project_id": 1,
    "metadata": {
      "referrer": "https://google.com",
      "device": "mobile"
    }
  }'
```

**event_type options:** `page_view`, `project_view`, `link_click`, `contact_form`, `download`

**Response (201):**
```json
{
  "success": true,
  "message": "Event tracked"
}
```

---

### GET `/api/admin/analytics/summary` 🔒
Obtener resumen de analíticas.

```bash
# Últimos 30 días (default)
curl http://localhost:8787/api/admin/analytics/summary \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Rango personalizado
curl "http://localhost:8787/api/admin/analytics/summary?days=7" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total_events": 1250,
    "period_days": 30,
    "by_type": {
      "page_view": 800,
      "project_view": 350,
      "link_click": 75,
      "contact_form": 25
    },
    "top_projects": [
      { "project_id": 1, "title": "Proyecto A", "views": 150 },
      { "project_id": 3, "title": "Proyecto B", "views": 120 }
    ],
    "daily_breakdown": [
      { "date": "2024-01-15", "count": 45 },
      { "date": "2024-01-14", "count": 38 }
    ]
  }
}
```

---

### DELETE `/api/admin/analytics/cleanup` 🔒
Limpiar eventos antiguos.

```bash
# Eliminar eventos de más de 90 días (default)
curl -X DELETE http://localhost:8787/api/admin/analytics/cleanup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Eliminar eventos de más de 30 días
curl -X DELETE "http://localhost:8787/api/admin/analytics/cleanup?days=30" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "deleted_count": 523,
    "older_than_days": 90
  }
}
```

---

## 🏥 Health Check

### GET `/health`
Verificar estado del servidor.

```bash
curl http://localhost:8787/health
```

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 🔒 Autenticación

### Flujo de Autenticación

1. **Login:** `POST /api/auth/login` → Obtener JWT token
2. **Usar token:** Incluir en header `Authorization: Bearer <token>`
3. **Token expira:** en 24 horas, hacer login nuevamente

### Rutas Protegidas (🔒)

Todas las rutas bajo `/api/admin/*` requieren autenticación:

| Prefijo | Descripción |
|---------|-------------|
| `/api/admin/projects/*` | Gestión de proyectos |
| `/api/admin/contact/*` | Gestión de mensajes |
| `/api/admin/technologies/*` | Gestión de tecnologías |
| `/api/admin/settings/*` | Configuración del sitio |
| `/api/admin/analytics/*` | Analíticas |
| `/api/auth/profile` | Perfil del usuario |
| `/api/auth/logout` | Cerrar sesión |

### Ejemplo con JavaScript

```javascript
// Login
const login = async (username, password) => {
  const res = await fetch('http://localhost:8787/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  localStorage.setItem('token', data.data.token);
  return data;
};

// Llamada autenticada
const getProjects = async () => {
  const token = localStorage.getItem('token');
  const res = await fetch('http://localhost:8787/api/admin/projects', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
};
```

---

## � Audit Module

### GET `/api/admin/audit` 🔒
Listar logs de auditoría.

```bash
curl "http://localhost:8787/api/admin/audit?page=1&limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| page | number | Página (default: 1) |
| limit | number | Cantidad (default: 50) |
| action | string | Filtrar por acción (login, create, update, delete) |
| entity_type | string | Filtrar por tipo de entidad |
| user_id | number | Filtrar por usuario |

---

### GET `/api/admin/audit/stats` 🔒
Obtener estadísticas de auditoría.

```bash
curl "http://localhost:8787/api/admin/audit/stats?days=30" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### GET `/api/admin/audit/failed-logins` 🔒
Listar intentos de login fallidos.

```bash
curl http://localhost:8787/api/admin/audit/failed-logins \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### GET `/api/admin/audit/entity/:type/:id` 🔒
Obtener historial de cambios de una entidad específica.

```bash
curl http://localhost:8787/api/admin/audit/entity/project/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### DELETE `/api/admin/audit/cleanup` 🔒
Limpiar logs antiguos.

```bash
curl -X DELETE http://localhost:8787/api/admin/audit/cleanup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"days_to_keep": 90}'
```

---

## 🗑 Project Trash (Soft Delete)

### GET `/api/admin/projects/trash` 🔒
Listar proyectos eliminados (papelera).

```bash
curl "http://localhost:8787/api/admin/projects/trash?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### POST `/api/admin/projects/:id/restore` 🔒
Restaurar proyecto de la papelera.

```bash
curl -X POST http://localhost:8787/api/admin/projects/1/restore \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Proyecto restaurado exitosamente"
}
```

---

### DELETE `/api/admin/projects/:id/permanent` 🔒
Eliminar proyecto permanentemente (no se puede recuperar).

```bash
curl -X DELETE http://localhost:8787/api/admin/projects/1/permanent \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Proyecto eliminado permanentemente"
}
```

---

## 🔢 Error Codes

Las respuestas de error incluyen un campo `code` para facilitar el manejo en el frontend:

```json
{
  "success": false,
  "error": "Credenciales inválidas",
  "code": "INVALID_CREDENTIALS"
}
```

### Códigos Disponibles

| Código | HTTP Status | Descripción |
|--------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Token no proporcionado o inválido |
| `INVALID_CREDENTIALS` | 401 | Email/contraseña incorrectos |
| `TOKEN_EXPIRED` | 401 | Token JWT expirado |
| `FORBIDDEN` | 403 | Sin permisos para la acción |
| `ACCOUNT_LOCKED` | 403 | Cuenta bloqueada por intentos fallidos |
| `NOT_FOUND` | 404 | Recurso no encontrado |
| `USER_NOT_FOUND` | 404 | Usuario no existe |
| `PROJECT_NOT_FOUND` | 404 | Proyecto no existe |
| `EMAIL_EXISTS` | 409 | Email ya registrado |
| `SLUG_EXISTS` | 409 | Slug ya existe |
| `VALIDATION_ERROR` | 400 | Error de validación |
| `INVALID_EMAIL` | 400 | Formato de email inválido |
| `PASSWORD_TOO_WEAK` | 400 | Contraseña no cumple requisitos |
| `RATE_LIMIT_EXCEEDED` | 429 | Límite de solicitudes excedido |
| `LOGIN_RATE_LIMIT` | 429 | Demasiados intentos de login |
| `INTERNAL_ERROR` | 500 | Error interno del servidor |

---

## �🛡 Seguridad

### Medidas Implementadas

| Medida | Descripción |
|--------|-------------|
| **JWT (HS256)** | Tokens firmados con expiración de 24h |
| **Password Hashing** | SHA-256 (upgradeable a bcrypt) |
| **SQL Injection** | Prepared statements automáticos |
| **Input Validation** | Validadores por tipo de dato |
| **Rate Limiting** | 5 mensajes/hora por IP |
| **CORS** | Headers configurables |

### Validación de Entrada

| Campo | Reglas |
|-------|--------|
| Email | Formato válido, max 255 caracteres |
| Username | 3-20 caracteres, alfanumérico + guiones |
| Password | 8+ caracteres, 1 mayúscula, 1 número, 1 símbolo |
| Slug | Minúsculas, números, guiones |
| Message | 10-5000 caracteres |

### Checklist para Producción

- [ ] Cambiar `JWT_SECRET` a valor único (32+ caracteres)
- [ ] Configurar CORS para tu dominio específico
- [ ] Considerar upgrade a bcrypt para passwords
- [ ] Configurar rate limiting con Cloudflare KV
- [ ] Habilitar Cloudflare WAF
- [ ] Configurar HTTPS obligatorio

---

## 📊 Base de Datos

### Tablas

```
admin_users              - Usuarios administradores
projects                 - Proyectos del portafolio (con soft delete)
project_images           - Imágenes de proyectos
project_links            - Enlaces (GitHub, demo, etc.)
project_technologies     - Relación proyecto-tecnología
project_likes            - Likes de visitantes
contact_messages         - Mensajes de contacto
contact_notifications    - Notificaciones enviadas
technologies             - Catálogo de tecnologías
site_settings            - Configuración del sitio
analytics_events         - Eventos analíticos
audit_logs               - Logs de auditoría
failed_login_attempts    - Intentos de login fallidos
```

### Aplicar Schema

```bash
npx wrangler d1 execute portfolio-database --file=./schema.sql --remote
```

---

## 📁 Estructura del Proyecto

```
portfolio-backend/
├── src/
│   ├── index.ts                    # Entry point
│   ├── router.ts                   # Centralizador de rutas
│   ├── shared/
│   │   ├── types/                  # TypeScript types + Error codes
│   │   ├── utils/                  # Utilidades (response, notifications, hash)
│   │   └── middlewares/            # Auth, rate limiting
│   └── modules/
│       ├── auth/                   # Login, register, profile, logout
│       ├── projects/               # CRUD + images, links, techs, likes, trash
│       ├── contact/                # Mensajes de contacto + notificaciones
│       ├── technologies/           # CRUD tecnologías
│       ├── settings/               # Configuración del sitio
│       ├── analytics/              # Tracking de eventos
│       └── audit/                  # Sistema de auditoría
├── postman/
│   ├── Portfolio-API.postman_collection.json
│   └── Portfolio-API.postman_environment.json
├── wrangler.toml                   # Cloudflare Workers config
├── tsconfig.json                   # TypeScript config
├── schema.sql                      # Database schema
└── package.json
```

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Add nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

---

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE)
