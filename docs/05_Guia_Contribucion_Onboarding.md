# VALIX.GG — Guía de Contribución & Onboarding Dev

---

## 1. Bienvenida

Bienvenido al equipo de Valix.gg. Este documento te guiará desde cero hasta tener tu entorno local completamente funcional y listo para contribuir. Léelo de arriba a abajo la primera vez; está ordenado para minimizar bloqueos.

Si algo no funciona o encuentras información desactualizada, abre un issue en GitHub con la etiqueta `docs` o actualiza el documento directamente. **La documentación es responsabilidad de todos.**

---

## 2. Prerrequisitos del Sistema

| Herramienta | Versión Mínima | Verificar |
|---|---|---|
| **Node.js** | >= 20.0.0 (LTS) | `node --version` |
| **npm** | >= 10.0.0 | `npm --version` |
| **Python** | >= 3.10 | `python --version` |
| **Git** | >= 2.40 | `git --version` |
| **Docker** | >= 24 (opcional, recomendado) | `docker --version` |

> Recomendamos usar [nvm](https://github.com/nvm-sh/nvm) para gestionar versiones de Node.js y [pyenv](https://github.com/pyenv/pyenv) para Python.

---

## 3. Configuración del Entorno Local

### 3.1 Clonar y arrancar

**1.** Clona el repositorio y entra en la carpeta:
```bash
git clone https://github.com/tu-usuario/valix-gg.git
cd valix-gg
```

**2.** Instala todas las dependencias del monorepo:
```bash
npm install
```

**3.** Copia las variables de entorno de ejemplo:
```bash
cp .env.example .env.local
```

**4.** Edita `.env.local` con tus credenciales (ver sección 4).

**5.** Aplica las migraciones de base de datos:
```bash
npx prisma migrate dev
```

**6.** Pobla la base de datos con el ETL (requiere Python):
```bash
cd scripts/etl
pip install -r requirements.txt
python main.py --source liquipedia --region emea --dry-run   # verificar primero
python main.py --source liquipedia --region emea --apply     # aplicar
cd ../..
```

**7.** Arranca todos los servicios en paralelo:
```bash
npm run dev
```

Esto arranca en paralelo: Next.js en `:3000`, el servidor Socket.io en `:3001` y el worker de Redis en background.

### 3.2 Alternativa local con Docker

Si prefieres no usar Supabase y Upstash en desarrollo, puedes levantar PostgreSQL y Redis localmente:

```bash
docker compose up -d   # levanta postgres:5432 y redis:6379
```

---

## 4. Variables de Entorno

### 4.1 Variables obligatorias para desarrollo

| Variable | Entorno | Descripción |
|---|---|---|
| `DATABASE_URL` | Dev + Prod | Connection string de PostgreSQL. |
| `REDIS_URL` | Dev + Prod | Connection string de Redis. |
| `NEXTAUTH_SECRET` | Dev + Prod | Secreto para JWT. Generar con: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Dev + Prod | URL base de la app (`http://localhost:3000` en dev). |
| `GOOGLE_CLIENT_ID` | Dev + Prod | OAuth app de Google Cloud Console. |
| `GOOGLE_CLIENT_SECRET` | Dev + Prod | Secret del OAuth app de Google. |
| `DISCORD_CLIENT_ID` | Dev + Prod | App de Discord Developer Portal. |
| `DISCORD_CLIENT_SECRET` | Dev + Prod | Secret del app de Discord. |
| `NEXT_PUBLIC_SOCKET_URL` | Dev + Prod | URL del socket server (`http://localhost:3001` en dev). |

---

## 5. Flujo de Trabajo Git

### 5.1 Ramas

| Rama | Uso |
|---|---|
| `main` | Rama de producción. Protegida. Solo acepta PRs aprobados. |
| `dev` | Rama de integración. Aquí se mergean las features antes de ir a `main`. |
| `feature/{nombre}` | Para nuevas funcionalidades. Ej: `feature/matchmaking-queue` |
| `fix/{nombre}` | Para bug fixes. Ej: `fix/timer-desync` |
| `chore/{nombre}` | Para tareas de mantenimiento. Ej: `chore/update-dependencies` |

### 5.2 Flujo estándar

```bash
# 1. Crea tu rama desde dev
git checkout dev && git pull
git checkout -b feature/mi-feature

# 2. Desarrolla y commitea

# 3. Abre un Pull Request hacia dev
# 4. Espera al menos 1 revisión aprobada
# 5. Squash and merge a dev (el reviewer hace el merge)
```

### 5.3 Convención de commits (Conventional Commits)

| Prefijo | Cuándo usarlo |
|---|---|
| `feat:` | Nueva funcionalidad. Ej: `feat: add daily chain mode` |
| `fix:` | Corrección de bug. Ej: `fix: timer not resetting on correct guess` |
| `chore:` | Mantenimiento, dependencias. Ej: `chore: update next.js to 14.2` |
| `docs:` | Cambios en documentación. Ej: `docs: update SRS with standin rules` |
| `refactor:` | Refactorización sin cambio de comportamiento. |
| `test:` | Añadir o corregir tests. |

---

## 6. Tests

### 6.1 Ejecutar los tests

```bash
npm run test           # unit tests (Vitest)
npm run test:e2e       # end-to-end (Playwright)
npm run test:coverage  # reporte de cobertura
```

### 6.2 Qué testear

- **OBLIGATORIO** — Toda lógica de negocio en `packages/game-logic` (`validateConnection`, reglas de stand-in, etc.) debe tener tests unitarios. La cobertura de este paquete **no debe bajar del 90%**.
- **OBLIGATORIO** — Los endpoints de API deben tener tests de integración que cubran casos de éxito y de error.
- **RECOMENDADO** — Los componentes críticos de UI (`TimerCircle`, `SearchInput`) deben tener tests de render básicos.
- **E2E** — Al menos un flujo completo de partida vs bot debe estar cubierto por un test de Playwright.

---

## 7. Estructura de un PR Ideal

### 7.1 Descripción obligatoria

Todo Pull Request debe incluir:

- **¿Qué hace este PR?** — Descripción breve del cambio.
- **¿Por qué?** — Contexto: qué problema resuelve o qué feature implementa.
- **¿Cómo probarlo?** — Pasos concretos para verificar el cambio en local.
- **Screenshots / Videos** — Obligatorio si hay cambios de UI.
- **Issue relacionado** — Referencia al issue de GitHub (`#123`).

### 7.2 Checklist del autor antes de abrir el PR

- [ ] He probado el cambio en móvil (o en DevTools con viewport 390px).
- [ ] He actualizado los tests correspondientes.
- [ ] `npm run test` pasa sin errores.
- [ ] No hay `console.log` de debug en el código.
- [ ] Las variables de entorno nuevas están documentadas en `.env.example`.

---

## 8. Decisiones Técnicas Clave (ADRs)

### ADR-001: Socket.io en servidor separado, no en Vercel

**Contexto:** Vercel Serverless Functions no soportan WebSockets persistentes. Las conexiones se cierran tras ~10 segundos de inactividad.

**Decisión:** El servidor Socket.io vive en Railway como un proceso Node.js independiente.

**Consecuencias:** Mayor complejidad de despliegue (dos servicios en lugar de uno), pero WebSockets completamente funcionales sin limitaciones.

---

### ADR-002: Temporizador del servidor como fuente de verdad

**Contexto:** Si el temporizador corre en el cliente, un jugador malintencionado puede manipularlo (throttling del reloj del navegador, DevTools).

**Decisión:** El servidor Socket.io gestiona el temporizador. El cliente solo recibe eventos de tick para actualizar la UI.

**Consecuencias:** Mayor tráfico de WebSocket (un evento por segundo), pero resistente a cheating.

---

### ADR-003: Grafo de conexiones no expuesto en API pública

**Contexto:** Si existe un endpoint que devuelva todos los vecinos de un nodo, los jugadores pueden pre-computar cadenas óptimas antes de cada partida.

**Decisión:** La API solo expone la validación de una conexión concreta (`POST /api/match/verify`), nunca la lista de vecinos.

**Consecuencias:** El autocompletado busca jugadores por nombre (no "qué jugadores son vecinos de X"), lo que mantiene la integridad del juego.

---

## 9. Contacto y Canales

| Canal | Uso |
|---|---|
| **GitHub Issues** | Bugs y tareas. Usar la etiqueta correspondiente. |
| **GitHub Discussions** | Discusiones de diseño y propuestas de features. |
| **Discord (#valix-dev)** | Comunicación de equipo en tiempo real. |
| **`docs/decisions/`** | Decisiones de producto documentadas en el repo. |
