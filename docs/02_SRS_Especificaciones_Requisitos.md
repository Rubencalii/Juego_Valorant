# SPIKELINK.GG — Software Requirements Specification (SRS)

> Versión 1.0

---

## 1. Introducción

### 1.1 Propósito

Este documento describe los requisitos funcionales, no funcionales y de interfaz del sistema SpikeLink.gg. Está dirigido al equipo de desarrollo y sirve como contrato entre el producto y la implementación técnica.

### 1.2 Alcance

SpikeLink.gg es una aplicación web que permite a usuarios jugar, competir y mejorar en un minijuego de conexiones basado en el ecosistema competitivo de Valorant. El sistema abarca la experiencia del jugador, el motor de juego, el sistema de matchmaking y el ranking.

### 1.3 Definiciones

| Término | Definición |
|---|---|
| **Nodo** | Un jugador profesional en el grafo de conexiones. |
| **Arista** | Vínculo entre dos nodos que indica que compartieron equipo oficial. |
| **Core Loop** | Ciclo principal del juego: recibir jugador → nombrar compañero → verificar → siguiente turno. |
| **Cadena** | Secuencia de nodos conectados sin repetición, construida durante una partida. |
| **ETL** | Extract, Transform, Load. Proceso de extracción y normalización de datos de fuentes externas. |
| **Stand-in** | Jugador sustituto temporal que juega al menos un mapa oficial con el equipo. |

---

## 2. Requisitos Funcionales

### 2.1 Autenticación y Perfiles

- **RF-01** — El sistema permite el registro e inicio de sesión mediante OAuth (Google, Discord).
- **RF-02** — Cada usuario tiene un perfil con nickname, avatar, estadísticas acumuladas e historial de partidas.
- **RF-03** — Los usuarios pueden actualizar su nickname una vez cada 30 días.
- **RF-04** — Las partidas jugadas sin sesión iniciada no se guardan en ranking.

### 2.2 Modos de Juego

- **RF-05** — **Modo Entrenamiento** — el usuario juega contra un bot que elige un nodo aleatorio válido de entre los compañeros del nodo activo.
- **RF-06** — **Modo Cadena del Día** — cadena fija generada diariamente a las 00:00 UTC. El objetivo es maximizar la longitud de la cadena. Todos los usuarios comparten el mismo nodo inicial.
- **RF-07** — **Modo 1v1 Privado** — el usuario genera un link de sala con código único. El invitado accede y la partida comienza cuando ambos están listos.
- **RF-08** — **Modo Matchmaking** — el sistema empareja a dos usuarios en cola con ELO similar en menos de 30 segundos. Si no hay rival disponible, ofrece jugar contra el bot.

### 2.3 Core Loop y Motor de Juego

- **RF-09** — Al inicio de cada partida, el sistema asigna un nodo de inicio aleatorio con al menos 5 aristas activas, para garantizar jugabilidad.
- **RF-10** — El usuario dispone de 15 segundos para introducir el nombre de un compañero válido del nodo activo.
- **RF-11** — El campo de búsqueda ofrece autocompletado con hasta 5 sugerencias, activado tras el primer carácter introducido.
- **RF-12** — El sistema acepta coincidencias por nickname exacto, nickname parcial (mínimo 3 chars) o nombre real.
- **RF-13** — El sistema verifica la validez de la conexión consultando la tabla `Rosters`. Una conexión es válida si ambos jugadores coinciden en el mismo `team_id` con solapamiento de fechas, o si el jugador fue stand-in oficial (mínimo 1 mapa jugado).
- **RF-14** — Si la conexión es **válida**: el temporizador se reinicia, el nodo activo cambia al jugador adivinado, y se pasa el turno al rival.
- **RF-15** — Si la conexión es **inválida** (razones: `NEVER_PLAYED`, `ALREADY_USED`, `NOT_FOUND`): se muestra feedback visual y se descuenta 5 segundos del temporizador como penalización.
- **RF-16** — El juego termina cuando: (a) se agota el temporizador, (b) se acumulan 3 respuestas incorrectas, o (c) el rival se desconecta más de 10 segundos (derrota automática para el desconectado).
- **RF-17** — Al finalizar, se muestra la cadena completa construida con los compañeros compartidos de cada conexión.

### 2.4 Ranking y Estadísticas

- **RF-18** — El sistema mantiene un ELO por jugador actualizado al finalizar cada partida PvP.
- **RF-19** — Existe un ranking global paginado, un ranking semanal y un ranking de amigos.
- **RF-20** — Las estadísticas de perfil incluyen: partidas totales, winrate, racha máxima (longitud de cadena), conexión más rara usada (basada en frecuencia de uso global) y jugador favorito (nodo más frecuente en sus cadenas).
- **RF-21** — El Modo Cadena del Día tiene su propio ranking diario ordenado por longitud de cadena y tiempo empleado (desempate).

---

## 3. Requisitos No Funcionales

### 3.1 Rendimiento

- **RNF-01** — El endpoint `/api/players?q=` debe responder en menos de **100ms** (percentil 95).
- **RNF-02** — El endpoint `/api/match/verify` debe responder en menos de **200ms** (percentil 95).
- **RNF-03** — La latencia de WebSocket entre dos clientes no debe superar los **300ms** en condiciones normales de red.
- **RNF-04** — La aplicación debe soportar al menos **500 partidas concurrentes** en el lanzamiento inicial.

### 3.2 Disponibilidad y Fiabilidad

- **RNF-05** — Disponibilidad objetivo del **99.5% mensual**.
- **RNF-06** — El servidor de sockets debe reintentar reconectar al cliente hasta 3 veces con backoff exponencial antes de declarar desconexión.
- **RNF-07** — El estado de la partida debe persistirse en Redis con TTL de 30 minutos para recuperación ante fallos.

### 3.3 Seguridad

- **RNF-08** — Toda validación de jugadas se realiza en el servidor. El cliente nunca es fuente de verdad.
- **RNF-09** — Los endpoints de partida requieren autenticación JWT válida o token de sesión anónima con rate limiting.
- **RNF-10** — Rate limiting: máximo **60 requests/minuto** por IP en endpoints de juego. Máximo **10 requests/minuto** en `/api/players`.
- **RNF-11** — El sistema no expone el grafo completo de conexiones en ningún endpoint público para evitar que los usuarios pre-computen estrategias.

### 3.4 Usabilidad y Accesibilidad

- **RNF-12** — El diseño es Mobile-First. El 100% de las funcionalidades son accesibles desde pantallas de **375px de ancho mínimo**.
- **RNF-13** — El teclado virtual del móvil no debe ocultar el temporizador ni el campo de input. El layout se adapta con viewport units dinámicas (`dvh`).
- **RNF-14** — El input de búsqueda tiene `spellcheck="false"`, `autocorrect="off"`, `autocapitalize="off"` y `autocomplete="off"`.
- **RNF-15** — Los colores de feedback cumplen el contraste mínimo **WCAG 2.1 AA**.
- **RNF-16** — La aplicación carga el core loop en menos de **3 segundos** en conexiones 3G (First Contentful Paint < 1.5s).

---

## 4. Requisitos de Interfaz

### 4.1 Interfaz de Usuario

- **RUI-01** — Pantalla de juego: muestra el nodo activo (foto + nickname + equipo actual), el temporizador circular, el campo de búsqueda y el historial de la cadena.
- **RUI-02** — El temporizador cambia de color: verde (>10s), naranja (5–10s), rojo pulsante (<5s).
- **RUI-03** — Al conectar correctamente se muestra una animación de "conexión" que visualiza el arista entre nodos.
- **RUI-04** — Los errores muestran el motivo: "Nunca jugaron juntos", "Jugador ya usado" o "Jugador no encontrado".
- **RUI-05** — La pantalla de resultado muestra el grafo completo de la cadena construida.

### 4.2 Endpoints de API Interna

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/players` | `GET` | Autocompletado. Param: `q` (string). Devuelve array de hasta 5 jugadores. |
| `/api/match/verify` | `POST` | Valida una conexión. Body: `currentPlayerId`, `guessedPlayerName`. |
| `/api/match/start` | `POST` | Inicia una nueva partida. Devuelve el nodo inicial y el ID de sesión. |
| `/api/match/daily` | `GET` | Devuelve el nodo inicial de la Cadena del Día y el ranking diario. |
| `/api/ranking` | `GET` | Ranking global/semanal/amigos. Params: `scope`, `page`, `limit`. |

#### Respuestas de `/api/match/verify`

```json
// Éxito
{ "valid": true, "sharedTeam": "LOUD", "newPlayerId": 456 }

// Error
{ "valid": false, "reason": "NEVER_PLAYED" | "ALREADY_USED" | "NOT_FOUND" }
```

---

## 5. Reglas de Negocio

- **RN-01** — Dos jugadores están conectados si y solo si han pertenecido al mismo equipo durante al menos un torneo o split oficial (incluyendo playoffs).
- **RN-02** — Los equipos de academia de una organización **no** cuentan como conexión con el equipo principal, a menos que el jugador haya jugado un mapa oficial con el equipo principal.
- **RN-03** — Un stand-in cuenta como conexión válida si ha jugado al menos **un mapa oficial** verificado en Liquipedia/VLR.
- **RN-04** — Los cambios de nickname de un jugador no crean nodos separados. El sistema mantiene un historial de aliases para el autocompletado.
- **RN-05** — Un jugador no puede ser usado dos veces en la misma cadena, independientemente de si llegó por rutas distintas.
- **RN-06** — El nodo inicial de cada partida se selecciona con al menos **5 aristas activas** para garantizar que no existan dead-ends inmediatos.
