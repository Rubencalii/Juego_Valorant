import os
import time
import requests
from bs4 import BeautifulSoup
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection details
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "spikelink")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "postgres_password") # Using the exact .env value
DB_PORT = os.getenv("DB_PORT", "5432")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

# Top VLR Teams (ID: Name)
TOP_TEAMS = {
    "2": "Sentinels",
    "104": "Fnatic",
    "6961": "LOUD",
    "624": "Paper Rex",
    "8185": "DRX",
    "2359": "Leviatán",
    "2355": "KRÜ Esports",
    "4210": "Natus Vincere",
    "1001": "Team Heretics",
    "17": "Gen.G Esports"
}

def get_db_connection():
    """Establish and return a connection to the PostgreSQL database."""
    return psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        port=DB_PORT
    )

def fetch_vlr_team(team_id):
    """Fetch active players from a VLR team page."""
    url = f"https://www.vlr.gg/team/{team_id}"
    response = requests.get(url, headers=HEADERS)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.text, "html.parser")
    players = []
    
    # Active roster players
    roster_items = soup.select('.team-roster-item > a')
    for item in roster_items:
        href = item.get('href')
        if not href:
            continue
            
        alias_div = item.select_one('.team-roster-item-name-alias')
        if not alias_div:
            continue
            
        nickname = alias_div.text.strip()
        player_url = f"https://www.vlr.gg{href}"
        
        players.append({
            "nickname": nickname,
            "player_url": player_url,
            "role": "Player"
        })
        
    return players

def fetch_vlr_player(player_url):
    """Fetch detailed info (image, real name, country) from VLR player page."""
    response = requests.get(player_url, headers=HEADERS)
    if response.status_code != 200:
        return {}
        
    soup = BeautifulSoup(response.text, "html.parser")
    data = {"image_url": None, "real_name": None, "country_code": None}
    
    # Image
    avatar_img = soup.select_one('.wf-avatar img')
    if avatar_img and avatar_img.get('src'):
        src = avatar_img['src']
        if "owcdn.net" in src:
            data["image_url"] = f"https:{src}" if src.startswith('//') else src
            
    # Real Name
    real_name_div = soup.select_one('.player-real-name')
    if real_name_div:
        data["real_name"] = real_name_div.text.strip()
        
    # Country (usually inside an i.flag tag)
    flag_i = soup.select_one('.player-header i.flag')
    if flag_i and flag_i.get('class'):
        # Extract country code from classes like 'flag', 'mod-us'
        classes = flag_i.get('class')
        for c in classes:
            if c.startswith('mod-') and len(c) == 6:
                data["country_code"] = c.replace('mod-', '').upper()
                break
                
    return data

def load_to_database(team_name, players_data):
    """Inserts teams, players, and rosters into PostgreSQL."""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Insert Team
        cur.execute("""
            INSERT INTO teams (name, region) 
            VALUES (%s, %s)
            ON CONFLICT (name) DO UPDATE SET region = EXCLUDED.region
            RETURNING id;
        """, (team_name, "Global"))
        team_id = cur.fetchone()[0]
        
        for p in players_data:
            # Insert Player
            cur.execute("""
                INSERT INTO players (nickname, real_name, country_code, image_url, aliases)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (nickname) DO UPDATE 
                SET real_name = EXCLUDED.real_name,
                    country_code = EXCLUDED.country_code,
                    image_url = EXCLUDED.image_url
                RETURNING id;
            """, (p['nickname'], p.get('real_name'), p.get('country_code'), p.get('image_url'), [p['nickname']]))
            player_id = cur.fetchone()[0]
            
            # Insert Roster
            cur.execute("""
                INSERT INTO rosters (player_id, team_id, year_start, is_standin, role, maps_played)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING;
            """, (player_id, team_id, 2024, False, p.get('role', 'Player'), 10))
            
        conn.commit()
        print(f"Successfully loaded team {team_name} and its players into DB.")
    except Exception as e:
        conn.rollback()
        print(f"Error loading data for {team_name}: {e}")
    finally:
        cur.close()
        conn.close()

def main():
    print("--- SpikeLink.gg ETL Script (VLR.gg) ---")
    
    for team_id, team_name in TOP_TEAMS.items():
        print(f"\nProcessing Team: {team_name}")
        try:
            players = fetch_vlr_team(team_id)
            print(f"Found {len(players)} active players for {team_name}.")
            
            for player in players:
                print(f"  Fetching player: {player['nickname']}...")
                details = fetch_vlr_player(player["player_url"])
                player.update(details)
                # Polite small delay
                time.sleep(0.5)
                
            load_to_database(team_name, players)
        except Exception as e:
            print(f"Failed processing {team_name}: {e}")
        
    print("\nETL process completed successfully.")

if __name__ == '__main__':
    main()
