# SPIKELINK.GG — Arquitectura Técnica Detallada

---

## 1. Visión General del Sistema

SpikeLink.gg sigue una arquitectura de tres capas desacopladas:

1. **Frontend** — Next.js desplegado en Vercel.
2. **Servidor de WebSockets** — Servidor Socket.io independiente en Railway para partidas en tiempo real.
3. **Capa de datos** — PostgreSQL (Supabase) para datos persistentes + Redis (Upstash) para estado de partida efímero.

Esta separación permite escalar cada capa de forma independiente y evita la restricción de Vercel con WebSockets persistentes. El frontend solo se comunica con el servidor de sockets durante las partidas activas; el resto de operaciones van por Next.js API Routes estándar.

---

## 2. Diagrama de Componentes

### 2.1 Flujo de una Partida PvP

```
Jugador A (Browser) ──── Next.js API Routes ──── Redis (estado partida)
        │                                                │
        └──────── Socket.io Server (Railway) ───────────┘
        │                       │
        └───────────────────────┘
                Jugador B (Browser)

Socket.io Server ──── PostgreSQL (verificar conexión, guardar resultado)
```

### 2.2 Componentes

| Componente | Responsabilidad | Tecnología |
|---|---|---|
| **Web App** | UI, routing, autenticación, API calls | Next.js 14 + Tailwind |
| **API Routes** | Autocompletado, ranking, perfil, inicio de partida | Next.js API + Zod |
| **Socket Server** | Sincronización de turno, temporizador, estado en tiempo real | Node.js + Socket.io |
| **Game Logic Pkg** | Validación de conexiones, reglas de negocio compartidas | TypeScript puro (shared package) |
| **PostgreSQL** | Players, Teams, Rosters, Users, Rankings, Matches | Supabase (Postgres 15) |
| **Redis** | Estado de partida activa, TTL 30min, matchmaking queue | Upstash Redis |
| **ETL Script** | Extracción semanal de datos de Liquipedia/VLR | Python + cron (Railway) |

---

## 3. Modelo de Base de Datos

### 3.1 Esquema Principal (PostgreSQL)

#### Tabla: `players`

```sql
id            SERIAL PRIMARY KEY
nickname      VARCHAR(64) NOT NULL UNIQUE
aliases       TEXT[]                        -- nicknames históricos
real_name     VARCHAR(128)
country_code  CHAR(2)
image_url     TEXT
twitter_url   TEXT
created_at    TIMESTAMPTZ DEFAULT NOW()
updated_at    TIMESTAMPTZ DEFAULT NOW()
```

#### Tabla: `teams`

```sql
id          SERIAL PRIMARY KEY
name        VARCHAR(128) NOT NULL
slug        VARCHAR(64) UNIQUE
logo_url    TEXT
region      VARCHAR(32)           -- EMEA, Americas, Pacific, CN
is_academy  BOOLEAN DEFAULT FALSE
parent_id   INT REFERENCES teams(id)  -- para academias
```

#### Tabla: `rosters` _(tabla de unión central del grafo)_

```sql
id          SERIAL PRIMARY KEY
player_id   INT NOT NULL REFERENCES players(id)
team_id     INT NOT NULL REFERENCES teams(id)
role        VARCHAR(32)           -- duelist, controller, initiator, sentinel, igl
is_standin  BOOLEAN DEFAULT FALSE
maps_played INT DEFAULT 0         -- mapas jugados en este stint
year_start  DATE NOT NULL
year_end    DATE                  -- NULL si activo actualmente
source_url  TEXT                  -- URL de Liquipedia/VLR de referencia
```

#### Tabla: `users`

```sql
id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
email            TEXT UNIQUE
nickname         VARCHAR(32) UNIQUE
avatar_url       TEXT
elo              INT DEFAULT 1000
provider         VARCHAR(16)   -- "google" | "discord"
provider_id      TEXT
last_nick_change TIMESTAMPTZ
created_at       TIMESTAMPTZ DEFAULT NOW()
```

#### Tabla: `matches`

```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
mode          VARCHAR(16)   -- "bot" | "pvp_private" | "pvp_ranked" | "daily"
player1_id    UUID REFERENCES users(id)
player2_id    UUID REFERENCES users(id)  -- NULL si vs bot
winner_id     UUID REFERENCES users(id)
chain_length  INT
chain_nodes   INT[]         -- array de player IDs en orden
duration_secs INT
created_at    TIMESTAMPTZ DEFAULT NOW()
```

#### Índices recomendados

```sql
CREATE INDEX idx_rosters_player ON rosters(player_id);
CREATE INDEX idx_rosters_team   ON rosters(team_id);
CREATE INDEX idx_players_nick   ON players
  USING gin(to_tsvector('simple', nickname || ' ' || coalesce(real_name, '')));
```

---

## 4. Lógica de Verificación de Conexión

### 4.1 Algoritmo Core

El paquete `game-logic` expone una función pura `validateConnection` usada tanto en el servidor de sockets como en los tests. Recibe los IDs de dos jugadores y retorna si la conexión es válida junto con el equipo compartido.

```typescript
// packages/game-logic/src/validateConnection.ts
export async function validateConnection(
  currentPlayerId: number,
  guessedPlayerId: number,
  usedPlayerIds: number[],
  db: DatabaseClient
): Promise<ValidationResult> {

  if (usedPlayerIds.includes(guessedPlayerId))
    return { valid: false, reason: 'ALREADY_USED' };

  const sharedTeam = await db.query(`
    SELECT t.name AS team_name, t.id AS team_id
    FROM rosters r1
    JOIN rosters r2 ON r1.team_id = r2.team_id
    JOIN teams t ON t.id = r1.team_id
    WHERE r1.player_id = $1
      AND r2.player_id = $2
      AND (r1.maps_played > 0 OR NOT r1.is_standin)
      AND (r2.maps_played > 0 OR NOT r2.is_standin)
      AND daterange(r1.year_start, r1.year_end) &&
          daterange(r2.year_start, r2.year_end)
    LIMIT 1
  `, [currentPlayerId, guessedPlayerId]);

  if (!sharedTeam.rows.length)
    return { valid: false, reason: 'NEVER_PLAYED' };

  return {
    valid: true,
    sharedTeam: sharedTeam.rows[0].team_name,
    newPlayerId: guessedPlayerId
  };
}
```

---

## 5. Arquitectura de Tiempo Real (WebSockets)

### 5.1 Eventos del Protocolo

| Evento | Dirección | Payload / Descripción |
|---|---|---|
| `match:join` | Client → Server | `{ roomCode, userId }` — El cliente se une a una sala. |
| `match:start` | Server → Client | `{ startPlayerId, startPlayerData, yourTurn }` — La partida comienza. |
| `match:guess` | Client → Server | `{ guessedPlayerName }` — El cliente envía una jugada. |
| `match:result` | Server → Client | `{ valid, sharedTeam, newPlayerData, nextTurn, timeLeft }` — Resultado de la jugada. |
| `match:timeout` | Server → Client | `{ loserId }` — El temporizador llegó a cero. |
| `match:end` | Server → Client | `{ winnerId, chain, stats }` — Fin de partida con resultados completos. |
| `match:opponent_dc` | Server → Client | `{ reconnectWindowSecs }` — El rival se desconectó. Ventana de 10s para reconectar. |

### 5.2 Gestión de Estado en Redis

El estado de cada partida activa se almacena en Redis con la clave `match:{roomCode}` y un TTL de 30 minutos:

```json
{
  "player1Id": "uuid",
  "player2Id": "uuid",
  "currentNodeId": 123,
  "usedNodeIds": [123, 456],
  "currentTurn": "player1",
  "timerStart": 1700000000000,
  "chain": [
    { "nodeId": 123, "teamName": "LOUD" },
    { "nodeId": 456, "teamName": "Sentinels" }
  ],
  "errorCount": { "player1": 0, "player2": 1 }
}
```

---

## 6. Pipeline ETL

### 6.1 Fuentes de Datos

- **Liquipedia Valorant** (API Semantic MediaWiki) — fuente principal para equipos históricos y rosters.
- **VLR.gg** — scraping de respaldo para datos recientes aún no en Liquipedia.

### 6.2 Flujo ETL

1. **Extracción** — El script Python llama a la API de Liquipedia con queries SMW para obtener todos los rosters de todos los equipos con competiciones en Challengers, Masters y Champions.
2. **Transformación** — Normalización de nicknames, resolución de aliases (ej: alias históricos de un mismo jugador → misma entidad), detección de stand-ins (`is_standin` + `maps_played`), y validación de solapamiento de fechas.
3. **Carga** — Upsert en PostgreSQL usando `ON CONFLICT (nickname) DO UPDATE`. Los rosters nuevos se insertan; los existentes se actualizan solo si el `source_url` cambia.
4. **Verificación post-carga** — Script de sanity check que valida que el grafo es conexo (todos los nodos tienen al menos 1 arista) y que no hay rosters con fechas imposibles.

```bash
# Modo dry-run (sin escritura en DB)
python main.py --source liquipedia --region all --dry-run

# Aplicar cambios
python main.py --source liquipedia --region all --apply
```

> El ETL se ejecuta como cron job cada domingo a las **03:00 UTC** en Railway.

### 6.3 Regiones cubiertas

| Región | Fuente Principal | Cobertura Estimada |
|---|---|---|
| EMEA | Liquipedia | Alta |
| Americas | Liquipedia | Alta |
| Pacific (PCS) | Liquipedia + VLR | Media |
| CN | VLR | Baja (MVP v2) |

---

## 7. Despliegue e Infraestructura

| Servicio | Plataforma | Notas |
|---|---|---|
| **Web App** | Vercel | Deploy automático desde `main`. Preview deploys en PRs. |
| **Socket Server** | Railway (Node.js) | Mínimo 1 instancia siempre activa. Escala a 3 en picos. |
| **PostgreSQL** | Supabase | Plan Pro. Backups diarios. Connection pooling con PgBouncer. |
| **Redis** | Upstash | Serverless Redis. Pago por request. TTL automático. |
| **ETL Cron** | Railway (Python) | Cron job semanal. Logs en Railway Dashboard. |
| **CDN / Assets** | Vercel Edge Network | Imágenes de jugadores servidas desde Supabase Storage. |
