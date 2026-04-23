# SPIKELINK.GG

> _El juego de conexiones del ecosistema competitivo de Valorant_

![Status: WIP](https://img.shields.io/badge/Status-WIP-FF4655?style=flat-square)
![Stack: Next.js](https://img.shields.io/badge/Stack-Next.js-2A3B4C?style=flat-square)
![Mobile-First](https://img.shields.io/badge/Design-Mobile--First-1A7A4A?style=flat-square)
![i18n: ES/EN/FR](https://img.shields.io/badge/i18n-ES%20%7C%20EN%20%7C%20FR-7B3FA0?style=flat-square)

---

## ¿Qué es SpikeLink.gg?

SpikeLink.gg es un minijuego web de ritmo rápido estilo "conexiones" ambientado en el ecosistema competitivo de Valorant. Los jugadores deben encadenar jugadores profesionales que hayan compartido equipo oficial en algún momento de sus carreras, todo ello contra un temporizador de 15 segundos.

La mecánica es sencilla de aprender y difícil de dominar: cada conexión correcta reinicia el reloj y activa el turno del rival. Un error, un jugador repetido o un timeout significa la derrota. La complejidad del grafo de relaciones —transferencias, equipos de academia, stand-ins— es lo que hace el juego infinitamente rejugable.

---

## Características Principales

- **Core Loop de 15 segundos** — urgencia, adrenalina y decisiones rápidas.
- **Tres modos de juego** — Entrenamiento vs Bot, 1v1 con link privado y Matchmaking aleatorio.
- **Modo "Cadena del Día"** — cadena diaria compartida por todos los usuarios, estilo Wordle. Genera conversación orgánica en redes sociales.
- **Autocompletado inteligente** con búsqueda fuzzy sobre nicknames y nombres reales.
- **Perfil de jugador** con estadísticas: racha máxima, partidas ganadas, conexiones únicas descubiertas.
- **Ranking global y ranking de amigos.**
- **Diseño Mobile-First** optimizado para iOS y Android (sin app nativa).
- **Internacionalización nativa** — Español, Inglés y Francés. Los nicknames nunca se traducen.
- **Input blindado** — `spellcheck="false"`, `autocorrect="off"`, `autocomplete="off"`. Crítico para los nicknames.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | Next.js 14 (App Router) + Tailwind CSS + Framer Motion |
| **Auth** | NextAuth.js (Google + Discord OAuth) |
| **API** | Next.js API Routes + Zod (validación) |
| **Realtime** | Socket.io (servidor dedicado en Railway / Fly.io) |
| **Base de Datos** | PostgreSQL vía Supabase + Redis (Upstash) para estado de partida |
| **ETL / Datos** | Python + requests + BeautifulSoup / API Liquipedia (Semantic MediaWiki) |
| **Despliegue** | Vercel (frontend) + Railway (socket server) + Supabase (DB) |
| **Monitorización** | Vercel Analytics + Sentry (errores) + Upstash Redis Metrics |

---

## Estructura del Repositorio

```
spikelink.gg/
├── apps/
│   ├── web/                  # Next.js app
│   │   ├── app/              # App Router (layouts, pages)
│   │   ├── components/       # Componentes reutilizables
│   │   ├── lib/              # Lógica de negocio, helpers
│   │   └── messages/         # Diccionarios i18n (es, en, fr)
│   └── socket-server/        # Servidor Socket.io independiente
├── packages/
│   ├── db/                   # Prisma schema + migraciones
│   └── game-logic/           # Lógica compartida (validaciones)
├── scripts/
│   └── etl/                  # Scripts Python de extracción de datos
└── docs/                     # Esta documentación
```

---

## Guía de Inicio Rápido

### Prerrequisitos

- Node.js >= 20
- Python >= 3.10
- PostgreSQL (local o Supabase)
- Redis (local o Upstash)

### Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/spikelink-gg.git && cd spikelink-gg
```

2. Instala dependencias:
```bash
npm install
```

3. Copia las variables de entorno:
```bash
cp .env.example .env.local
```

4. Ejecuta las migraciones de base de datos:
```bash
npx prisma migrate dev
```

5. Puebla la base de datos con el ETL:
```bash
cd scripts/etl && pip install -r requirements.txt && python main.py
```

6. Arranca el entorno de desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

---

## Variables de Entorno Requeridas

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

---

## Licencia y Descargo

SpikeLink.gg es un proyecto de fan no afiliado a Riot Games. Valorant y todos los activos asociados son marcas registradas de Riot Games, Inc. Los datos de jugadores se obtienen de fuentes públicas (Liquipedia, VLR.gg) respetando sus términos de servicio.
