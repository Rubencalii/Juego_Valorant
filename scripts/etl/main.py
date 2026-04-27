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
DB_PASS = os.getenv("DB_PASS", "postgres_password")
DB_PORT = os.getenv("DB_PORT", "5432")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

# List of top teams to scrape (VLR.gg team IDs)
TOP_TEAMS = [
    # Americas
    2, 188, 120, 1034, 11058, 2359, 6961, 2355, 2406, 7386,
    # EMEA
    2593, 474, 1184, 2059, 8877, 12694, 397, 6392, 1001, 4210,
    # Pacific
    624, 14, 17, 8185, 5448, 878, 4050, 466, 278, 282,
    # China
    1120, 12010, 1119, 731, 13576, 11985, 11981
]

def get_vct_team_ids():
    """Fetches VCT team IDs from rankings for all major regions."""
    regions = ["north-america", "europe", "asia-pacific", "china", "brazil", "latin-america-north", "latin-america-south", "korea", "japan"]
    all_ids = []
    print("Fetching global team IDs from rankings...")
    for region in regions:
        url = f"https://www.vlr.gg/rankings/{region}"
        try:
            res = requests.get(url, headers=HEADERS)
            soup = BeautifulSoup(res.content, "html.parser")
            # Find the top 20 teams in each region
            team_rows = soup.find_all("div", class_="rank-item")[:20]
            for row in team_rows:
                link = row.find("a", class_="rank-item-team")
                if link:
                    t_id = link['href'].split('/')[2]
                    all_ids.append(int(t_id))
            print(f"  > Found {len(team_rows)} teams in {region}")
        except Exception as e:
            print(f"  > Error fetching {region}: {e}")
    return list(set(all_ids))

def get_db_connection():
    """Establish and return a connection to the PostgreSQL database."""
    return psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        port=DB_PORT
    )

def fix_schema(cur):
    """Ensures vlr_id exists and removes conflicting unique constraints."""
    try:
        cur.execute("ALTER TABLE players ADD COLUMN IF NOT EXISTS vlr_id TEXT UNIQUE;")
        cur.execute("ALTER TABLE players DROP CONSTRAINT IF EXISTS players_nickname_key;")
        cur.execute("ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_name_key;")
    except Exception as e:
        print(f"Schema update notice: {e}")

def fetch_vlr_player_details(player_id):
    """Fetch details and HISTORY from a player's VLR page."""
    url = f"https://www.vlr.gg/player/{player_id}"
    try:
        response = requests.get(url, headers=HEADERS)
        soup = BeautifulSoup(response.content, "html.parser")
        
        # Image
        avatar_container = soup.find("div", class_="wf-avatar")
        img_tag = avatar_container.find("img") if avatar_container else None
        image_url = None
        if img_tag and 'src' in img_tag.attrs:
            src = img_tag['src']
            image_url = f"https:{src}" if src.startswith("//") else (f"https://www.vlr.gg{src}" if src.startswith("/") else src)
            if "ph/sil.png" in image_url: image_url = None
        
        # Country
        country_tag = soup.find("i", class_="flag")
        country_code = None
        if country_tag:
            for cls in country_tag.get('class', []):
                if cls.startswith('mod-'):
                    country_code = cls.replace('mod-', '').upper()
                    break

        # History
        history = []
        team_links = soup.find_all("a", class_="wf-module-item")
        for link in team_links:
            href = link.get('href', '')
            if '/team/' in href:
                t_id = href.split('/')[2]
                try:
                    # Some historical teams are just text, others are blocks
                    name_div = link.find("div", style=lambda v: True)
                    name_text = link.find_all("div")[1].find("div").text.strip()
                    history.append({"id": t_id, "name": name_text})
                except: continue

        # Role and Status
        role = None
        status_tag = soup.find("div", class_="player-header-role")
        if status_tag:
            role = status_tag.text.strip()
        
        # Check if retired (often in the header or subtext)
        is_retired = "Retired" in soup.text
        if is_retired:
            role = "Retired"

        return {"image_url": image_url, "country_code": country_code, "history": history, "role": role}
    except Exception as e:
        print(f"Error fetching player {player_id}: {e}")
        return {}

def populate_database():
    """Scrape VLR.gg and populate the PostgreSQL database with DEEP connections."""
    conn = get_db_connection()
    cur = conn.cursor()
    print("Initializing production database tables...")
    fix_schema(cur)
    conn.commit()
    
    dynamic_teams = get_vct_team_ids()
    target_teams = list(set(TOP_TEAMS + dynamic_teams))
    
    print(f"Starting GLOBAL ETL for {len(target_teams)} teams...")
    
    for team_id in target_teams:
        try:
            url = f"https://www.vlr.gg/team/{team_id}"
            res = requests.get(url, headers=HEADERS)
            soup = BeautifulSoup(res.content, "html.parser")
            title_tag = soup.find("h1", class_="wf-title")
            if not title_tag: continue
            team_name = title_tag.text.strip()
            
            print(f"\n--- Processing Team: {team_name} ---")
            
            cur.execute("INSERT INTO teams (id, name, region) VALUES (%s, %s, %s) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name", (team_id, team_name, "VLR_GLOBAL"))
            
            player_cards = soup.find_all("div", class_="team-roster-item")
            for card in player_cards:
                vlr_link = card.find("a")
                if not vlr_link: continue
                p_vlr_id = vlr_link['href'].split('/')[2]
                p_nick = card.find("div", class_="team-roster-item-name-alias").text.strip()
                p_real = card.find("div", class_="team-roster-item-name-real").text.strip() if card.find("div", class_="team-roster-item-name-real") else None
                
                print(f"  > Player: {p_nick} (VLR: {p_vlr_id})")
                details = fetch_vlr_player_details(p_vlr_id)
                
                cur.execute("""
                    INSERT INTO players (vlr_id, nickname, real_name, country_code, image_url)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (vlr_id) DO UPDATE SET
                        nickname = EXCLUDED.nickname,
                        real_name = EXCLUDED.real_name,
                        image_url = COALESCE(EXCLUDED.image_url, players.image_url),
                        country_code = EXCLUDED.country_code
                    RETURNING id
                """, (p_vlr_id, p_nick, p_real, details.get("country_code"), details.get("image_url")))
                player_db_id = cur.fetchone()[0]
                
                # History (Bridges)
                for hist in details.get("history", []):
                    h_team_id, h_team_name = hist['id'], hist['name']
                    # Historical teams insert: handle ID conflict only (name can be duplicate with different ID)
                    cur.execute("INSERT INTO teams (id, name, region) VALUES (%s, %s, %s) ON CONFLICT (id) DO NOTHING", (h_team_id, h_team_name, "VLR_HISTORY"))
                    cur.execute("INSERT INTO rosters (player_id, team_id, year_start, role) VALUES (%s, %s, 2024, %s) ON CONFLICT DO NOTHING", (player_db_id, h_team_id, details.get("role")))
            
            conn.commit()
            time.sleep(1)
        except Exception as e:
            print(f"Error processing team {team_id}: {e}")
            conn.rollback()

    cur.close()
    conn.close()
    print("\nDEEP ETL complete. Global connections established.")

if __name__ == "__main__":
    populate_database()
