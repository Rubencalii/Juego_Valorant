import postgres from './web/node_modules/postgres/src/index.js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Función simple para leer el .env.local sin depender de dotenv
function getDatabaseUrl() {
  try {
    const envPath = join(process.cwd(), 'web', '.env.local');
    const content = readFileSync(envPath, 'utf8');
    const match = content.match(/DATABASE_URL=(.+)/);
    return match ? match[1].trim() : null;
  } catch (e) {
    return null;
  }
}

const dbUrl = getDatabaseUrl();

if (!dbUrl || dbUrl.includes('localhost')) {
  console.error("❌ ERROR: No se ha encontrado una DATABASE_URL de producción en web/.env.local");
  console.error("Por favor, copia la URL de Neon/Vercel en tu archivo .env.local antes de correr este script.");
  process.exit(1);
}

const sql = postgres(dbUrl, {
  ssl: 'require'
});

async function init() {
  console.log("🚀 Iniciando creación de tablas en la base de datos de producción...");
  
  try {
    const commands = [
      `CREATE TABLE IF NOT EXISTS teams (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          region VARCHAR(50),
          icon_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      )`,
      `CREATE TABLE IF NOT EXISTS players (
          id SERIAL PRIMARY KEY,
          nickname VARCHAR(100) NOT NULL UNIQUE,
          aliases TEXT[] DEFAULT '{}',
          real_name VARCHAR(255),
          country_code VARCHAR(10),
          image_url TEXT,
          twitter_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      )`,
      `CREATE TABLE IF NOT EXISTS rosters (
          id SERIAL PRIMARY KEY,
          player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
          team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
          role VARCHAR(50),
          is_standin BOOLEAN DEFAULT FALSE,
          maps_played INTEGER DEFAULT 0,
          year_start INTEGER,
          year_end INTEGER,
          source_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      )`,
      `CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          nickname VARCHAR(50) NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          email VARCHAR(255) UNIQUE,
          avatar_url TEXT,
          elo INTEGER DEFAULT 1000,
          total_points INTEGER DEFAULT 0,
          title VARCHAR(100) DEFAULT 'AGENTE NOVATO',
          banner_color VARCHAR(20) DEFAULT '#FF4655',
          provider VARCHAR(50),
          provider_id VARCHAR(255),
          last_nick_change TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      )`,
      `CREATE TABLE IF NOT EXISTS matches (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          mode VARCHAR(50) NOT NULL,
          player1_id UUID REFERENCES users(id),
          player2_id UUID REFERENCES users(id),
          winner_id UUID REFERENCES users(id),
          chain_length INTEGER DEFAULT 0,
          chain_nodes INTEGER[],
          duration_secs INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      )`,
      `CREATE INDEX IF NOT EXISTS idx_players_nickname ON players (nickname)`,
      `CREATE INDEX IF NOT EXISTS idx_rosters_player_id ON rosters (player_id)`,
      `CREATE INDEX IF NOT EXISTS idx_rosters_team_id ON rosters (team_id)`
    ];

    for (const cmd of commands) {
      await sql.unsafe(cmd);
      console.log("✅ Comando ejecutado");
    }

    console.log("\n✨ ¡Base de datos de producción inicializada con éxito!");
  } catch (error) {
    console.error("❌ Error durante la inicialización:", error);
  } finally {
    await sql.end();
  }
}

init();
