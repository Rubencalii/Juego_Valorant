# SPIKELINK.GG — Roadmap & Plan de Proyecto

---

## Visión del Producto

El objetivo del roadmap es lanzar un producto jugable, adictivo y estable en **4 semanas de desarrollo**, iterando desde un MVP funcional de un solo jugador hasta un sistema PvP completo con ranking. Cada fase tiene entregables tangibles que pueden testearse de forma independiente.

---

## Fase 1 — Ingeniería de Datos
### Semana 1 · Objetivo: Grafo de conexiones limpio y consultable

### Tareas

- [ ] Estudiar la API de Liquipedia (Semantic MediaWiki) y VLR.gg. Documentar rate limits, campos disponibles y cobertura histórica.
- [ ] Diseñar y aplicar el schema de PostgreSQL (`players`, `teams`, `rosters`). Ejecutar las migraciones en Supabase dev.
- [ ] Escribir el script ETL en Python: extracción de rosters por región (EMEA, Americas, Pacific).
- [ ] Implementar la lógica de deduplicación: resolver aliases de nicknames, detectar stand-ins con `maps_played`.
- [ ] Definir las reglas de negocio sobre stand-ins y academias. Documentarlas en el SRS.
- [ ] Ejecutar el primer volcado completo. **Target: >500 jugadores, >100 equipos.**
- [ ] Script de sanity check: verificar que no hay nodos aislados y que las fechas son coherentes.
- [ ] Implementar el índice de búsqueda full-text en PostgreSQL y verificar que las queries de autocompletado responden en <100ms.

### Criterios de Aceptación

- El grafo tiene al menos 500 nodos con al menos 2 aristas cada uno.
- Las queries de autocompletado por nickname parcial responden en <100ms.
- La función `validateConnection` retorna resultados correctos para un conjunto de 20 casos de prueba manuales.

### ⚠️ Riesgo Principal

La calidad de los datos de Liquipedia varía por región. Los datos de PCS (Pacífico) y CN pueden estar incompletos. **Mitigación:** priorizar EMEA y Americas para el MVP y expandir en fases posteriores.

---

## Fase 2 — MVP Single Player
### Semana 2 · Objetivo: Juego completo vs Bot, desplegable y testeable

### Tareas

- [ ] Configurar el monorepo: Next.js 14 + Tailwind + shadcn/ui + `packages/game-logic` + `packages/db` (Prisma).
- [ ] Configurar i18n con `next-intl`: diccionarios `es`, `en`, `fr`. Verificar que los nicknames no se procesan por el sistema de traducción.
- [ ] Construir componentes visuales: `PlayerCard`, `TimerCircle`, `SearchInput` (con atributos de input blindado), `ChainHistory`, `ConnectionToast`.
- [ ] Implementar la lógica del Bot: dado el nodo activo, selecciona un nodo aleatorio de entre sus vecinos no usados.
- [ ] Implementar la API Route `POST /api/match/verify` con validación Zod y la función `validateConnection` del paquete compartido.
- [ ] Implementar `GET /api/players` con búsqueda fuzzy y debounce de 150ms en el cliente.
- [ ] Implementar el **Modo Cadena del Día**: generación diaria del nodo inicial con seed de la fecha, persistencia del progreso en `localStorage`.
- [ ] Añadir NextAuth.js con providers Google y Discord. Implementar la tabla `users` y el guardado de estadísticas post-partida.
- [ ] Pruebas en iOS Safari y Chrome Android: verificar que el teclado virtual no tapa el input ni el temporizador.

### Criterios de Aceptación

- Una partida vs bot completa funciona de inicio a fin sin errores de consola.
- El Modo Cadena del Día es jugable y guarda el progreso entre sesiones.
- El diseño es correcto en iPhone 12 (390px) y Pixel 7 (412px).
- La autenticación con Google y Discord funciona en local y en Vercel preview.

---

## Fase 3 — Multijugador Online
### Semana 3 · Objetivo: PvP en tiempo real funcional y estable

### Tareas

- [ ] Configurar el servidor Socket.io en Railway: dockerizar, configurar CORS y health checks.
- [ ] Implementar el sistema de Salas: generación de room codes, join por código, estado de "sala llena" (máx 2 jugadores).
- [ ] Implementar el protocolo de eventos completo (`match:join`, `match:start`, `match:guess`, `match:result`, `match:timeout`, `match:end`, `match:opponent_dc`).
- [ ] Implementar la gestión del temporizador **en el servidor** (fuente de verdad para evitar cheating por manipulación de clock del cliente).
- [ ] Persistir el estado de partida en Redis con TTL de 30 minutos. Implementar la reconexión: si un jugador se desconecta, tiene 10 segundos para volver antes de recibir derrota automática.
- [ ] Implementar el sistema de Matchmaking: cola en Redis, emparejamiento por ELO (±200 puntos), timeout de 30s → oferta de jugar vs bot.
- [ ] Calcular y actualizar ELO al finalizar partidas PvP. Implementar la tabla `matches`.
- [ ] Implementar los endpoints de Ranking (`GET /api/ranking`) con los scopes `global`, `weekly` y `friends`.
- [ ] Tests de carga básicos: simular 50 partidas concurrentes y verificar que el servidor no degrada.

### Criterios de Aceptación

- Dos navegadores en la misma red local pueden jugar una partida completa sin desincronizaciones.
- Una desconexión y reconexión en <10s no interrumpe la partida.
- El ELO se actualiza correctamente al finalizar la partida.
- El matchmaking empareja a dos usuarios en cola en <30s.

---

## Fase 4 — Pulido y Lanzamiento
### Semana 4 · Objetivo: Producto listo para producción y crecimiento orgánico

### Tareas

- [ ] Implementar animaciones de feedback: animación de conexión entre nodos (Framer Motion), pulso rojo en temporizador crítico, shake en error.
- [ ] Añadir pantalla de resultado con visualización del grafo de la cadena (D3.js o SVG simple).
- [ ] Implementar botón de compartir resultado de la Cadena del Día (imagen generada con `html-to-image`, compartible en redes).
- [ ] Perfil de usuario completo: estadísticas, historial de partidas, conexión más rara, jugador favorito.
- [ ] Pruebas exhaustivas en dispositivos físicos: iPhone SE (375px), iPhone 14 Pro Max (430px), Samsung Galaxy S23.
- [ ] Configurar Sentry para captura de errores de frontend y del socket server.
- [ ] Configurar Vercel Analytics y el primer dashboard de métricas (DAU, partidas por día, modo más jugado).
- [ ] Hardening de seguridad: rate limiting con Upstash Ratelimit, validación exhaustiva de inputs en todos los endpoints.
- [ ] SEO básico: meta tags, Open Graph para la Cadena del Día, sitemap.
- [ ] Deploy a producción: dominio `spikelink.gg`, certificado SSL, variables de entorno de producción.

### Criterios de Aceptación

- Lighthouse score >= 85 en Performance, Accessibility y SEO en móvil.
- Zero errores de consola en un flujo completo en producción.
- La imagen compartible de la Cadena del Día se genera y descarga correctamente en iOS Safari.

---

## Backlog Post-Lanzamiento (v2)

- **Torneos** — brackets automáticos, modo eliminatoria directa.
- **Logros y badges** — "Primera conexión de 10", "Experto EMEA", "Encontró una conexión usada por menos del 1% de jugadores".
- **Modo desafío** — un usuario reta a otro con una cadena específica que debe completarse.
- **Expansión de datos** — añadir PCS (Pacífico) y CN al grafo completo.
- **App PWA** — icono en home screen, notificación push para la Cadena del Día.
- **API pública documentada (v1)** — para que la comunidad construya herramientas.

---

## Resumen de Hitos

| Fase | Semana | Entregable Principal |
|---|---|---|
| **Fase 1** | Semana 1 | Grafo de conexiones limpio en DB. ETL funcional. |
| **Fase 2** | Semana 2 | MVP Single Player jugable. Modo Cadena del Día. Deploy en Vercel. |
| **Fase 3** | Semana 3 | PvP en tiempo real con matchmaking y ranking ELO. |
| **Fase 4** | Semana 4 | Producto lanzado en producción. Animaciones, SEO, Sentry. |
