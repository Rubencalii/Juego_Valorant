-- schema.sql
-- SpikeLink.gg - Core Database Schema (PostgreSQL)

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TEAMS TABLE
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    region VARCHAR(50),
    icon_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- PLAYERS TABLE
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    nickname VARCHAR(100) NOT NULL UNIQUE,
    aliases TEXT[] DEFAULT '{}',
    real_name VARCHAR(255),
    country_code VARCHAR(10),
    image_url TEXT,
    twitter_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ROSTERS TABLE (Edge in the connection graph)
CREATE TABLE rosters (
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
);

-- USERS TABLE (App Accounts)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nickname VARCHAR(50) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email VARCHAR(255) UNIQUE,
    avatar_url TEXT,
    elo INTEGER DEFAULT 1000,
    provider VARCHAR(50), -- google, discord (optional)
    provider_id VARCHAR(255),
    last_nick_change TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- MATCHES TABLE
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mode VARCHAR(50) NOT NULL, -- bot, pvp_private, pvp_ranked, daily
    player1_id UUID REFERENCES users(id),
    player2_id UUID REFERENCES users(id),
    winner_id UUID REFERENCES users(id),
    chain_length INTEGER DEFAULT 0,
    chain_nodes INTEGER[], -- References to players(id) used in the chain
    duration_secs INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- INDEXES
CREATE INDEX idx_players_nickname ON players (nickname);
-- GIN index for fuzzy searching if we want to search aliases/real names too
CREATE INDEX idx_players_aliases ON players USING GIN (aliases);
CREATE INDEX idx_rosters_player_id ON rosters (player_id);
CREATE INDEX idx_rosters_team_id ON rosters (team_id);
