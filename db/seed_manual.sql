-- Sentinels
INSERT INTO teams (id, name, region) VALUES (1, 'Sentinels', 'Americas') ON CONFLICT DO NOTHING;
-- Fnatic
INSERT INTO teams (id, name, region) VALUES (2, 'Fnatic', 'EMEA') ON CONFLICT DO NOTHING;
-- LOUD
INSERT INTO teams (id, name, region) VALUES (3, 'LOUD', 'Americas') ON CONFLICT DO NOTHING;

-- Players
INSERT INTO players (id, nickname, real_name, country_code, image_url, aliases) VALUES
(1, 'TenZ', 'Tyson Ngo', 'CA', 'https://liquipedia.net/commons/images/thumb/c/c7/TenZ_at_Masters_Madrid_2024.jpg/600px-TenZ_at_Masters_Madrid_2024.jpg', ARRAY['TenZ']),
(2, 'zekken', 'Zachary Patrone', 'US', 'https://liquipedia.net/commons/images/thumb/7/75/Zekken_at_Masters_Madrid_2024.jpg/600px-Zekken_at_Masters_Madrid_2024.jpg', ARRAY['zekken']),
(3, 'Sacy', 'Gustavo Rossi', 'BR', 'https://liquipedia.net/commons/images/thumb/0/0d/Sacy_at_Masters_Madrid_2024.jpg/600px-Sacy_at_Masters_Madrid_2024.jpg', ARRAY['Sacy']),
(4, 'johnqt', 'Mohamed Amine Ouarid', 'MA', 'https://liquipedia.net/commons/images/thumb/6/6f/Johnqt_at_Masters_Madrid_2024.jpg/600px-Johnqt_at_Masters_Madrid_2024.jpg', ARRAY['johnqt']),
(5, 'Zellsis', 'Jordan Montemurro', 'US', 'https://liquipedia.net/commons/images/thumb/d/d4/Zellsis_at_Masters_Madrid_2024.jpg/600px-Zellsis_at_Masters_Madrid_2024.jpg', ARRAY['Zellsis']),
(6, 'Boaster', 'Jake Howlett', 'GB', 'https://liquipedia.net/commons/images/thumb/f/f6/Boaster_at_VCT_2023_LOCK_IN_S%C3%A3o_Paulo.jpg/600px-Boaster_at_VCT_2023_LOCK_IN_S%C3%A3o_Paulo.jpg', ARRAY['Boaster']),
(7, 'Derke', 'Nikita Sirmitev', 'FI', 'https://liquipedia.net/commons/images/thumb/6/69/Derke_at_VCT_2023_LOCK_IN_S%C3%A3o_Paulo.jpg/600px-Derke_at_VCT_2023_LOCK_IN_S%C3%A3o_Paulo.jpg', ARRAY['Derke']),
(8, 'Alfajer', 'Emir Ali Beder', 'TR', 'https://liquipedia.net/commons/images/thumb/1/18/Alfajer_at_VCT_2023_LOCK_IN_S%C3%A3o_Paulo.jpg/600px-Alfajer_at_VCT_2023_LOCK_IN_S%C3%A3o_Paulo.jpg', ARRAY['Alfajer']),
(9, 'Chronicle', 'Timofey Khromov', 'RU', 'https://liquipedia.net/commons/images/thumb/5/58/Chronicle_at_VCT_2023_LOCK_IN_S%C3%A3o_Paulo.jpg/600px-Chronicle_at_VCT_2023_LOCK_IN_S%C3%A3o_Paulo.jpg', ARRAY['Chronicle']),
(10, 'Leo', 'Leo Jannesson', 'SE', 'https://liquipedia.net/commons/images/thumb/c/ca/Leo_at_VCT_2023_LOCK_IN_S%C3%A3o_Paulo.jpg/600px-Leo_at_VCT_2023_LOCK_IN_S%C3%A3o_Paulo.jpg', ARRAY['Leo']),
(11, 'Less', 'Felipe Basso', 'BR', 'https://liquipedia.net/commons/images/thumb/9/91/Less_at_Masters_Madrid_2024.jpg/600px-Less_at_Masters_Madrid_2024.jpg', ARRAY['Less']),
(12, 'Saadhak', 'Matias Delipetro', 'AR', 'https://liquipedia.net/commons/images/thumb/f/fa/Saadhak_at_Masters_Madrid_2024.jpg/600px-Saadhak_at_Masters_Madrid_2024.jpg', ARRAY['Saadhak']),
(13, 'cauanzin', 'Cauan Pereira', 'BR', 'https://liquipedia.net/commons/images/thumb/1/1a/Cauanzin_at_Masters_Madrid_2024.jpg/600px-Cauanzin_at_Masters_Madrid_2024.jpg', ARRAY['cauanzin']),
(14, 'tuyz', 'Arthur Andrade', 'BR', 'https://liquipedia.net/commons/images/thumb/e/e0/Tuyz_at_Masters_Madrid_2024.jpg/600px-Tuyz_at_Masters_Madrid_2024.jpg', ARRAY['tuyz']),
(15, 'qck', 'Gabriel Lima', 'BR', 'https://liquipedia.net/commons/images/thumb/a/a2/Qck_at_Masters_Madrid_2024.jpg/600px-Qck_at_Masters_Madrid_2024.jpg', ARRAY['qck']),
(16, 'pANcada', 'Bryan Luna', 'BR', 'https://liquipedia.net/commons/images/thumb/0/07/PANcada_at_VCT_2023_LOCK_IN_S%C3%A3o_Paulo.jpg/600px-PANcada_at_VCT_2023_LOCK_IN_S%C3%A3o_Paulo.jpg', ARRAY['pANcada'])
ON CONFLICT DO NOTHING;

-- Reset sequence for players
SELECT setval('players_id_seq', (SELECT MAX(id) FROM players));
SELECT setval('teams_id_seq', (SELECT MAX(id) FROM teams));

-- Rosters (Sentinels 2024)
INSERT INTO rosters (player_id, team_id, year_start, is_standin, role, maps_played) VALUES
(1, 1, 2024, false, 'Player', 20),
(2, 1, 2024, false, 'Player', 20),
(3, 1, 2024, false, 'Player', 20),
(4, 1, 2024, false, 'Player', 20),
(5, 1, 2024, false, 'Player', 20),
(16, 1, 2023, false, 'Player', 15) -- pANcada on SEN 2023
ON CONFLICT DO NOTHING;

-- Rosters (Fnatic 2024)
INSERT INTO rosters (player_id, team_id, year_start, is_standin, role, maps_played) VALUES
(6, 2, 2024, false, 'Player', 20),
(7, 2, 2024, false, 'Player', 20),
(8, 2, 2024, false, 'Player', 20),
(9, 2, 2024, false, 'Player', 20),
(10, 2, 2024, false, 'Player', 20)
ON CONFLICT DO NOTHING;

-- Rosters (LOUD 2024)
INSERT INTO rosters (player_id, team_id, year_start, is_standin, role, maps_played) VALUES
(11, 3, 2024, false, 'Player', 20),
(12, 3, 2024, false, 'Player', 20),
(13, 3, 2024, false, 'Player', 20),
(14, 3, 2024, false, 'Player', 20),
(15, 3, 2024, false, 'Player', 20),
(16, 3, 2022, false, 'Player', 30), -- pANcada on LOUD 2022
(3, 3, 2022, false, 'Player', 30)  -- Sacy on LOUD 2022
ON CONFLICT DO NOTHING;
