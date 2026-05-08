-- ============================================================
-- D&D Companion — Supabase Schema
-- Пусни това в Supabase > SQL Editor
-- ============================================================

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  code        TEXT PRIMARY KEY,
  dm_name     TEXT,
  map_url     TEXT,
  map_config  JSONB DEFAULT '{"x":0,"y":0,"scale":1}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Players table
CREATE TABLE IF NOT EXISTS room_players (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code      TEXT REFERENCES rooms(code) ON DELETE CASCADE,
  player_name    TEXT NOT NULL,
  character_name TEXT DEFAULT '',
  hp             INTEGER DEFAULT 10,
  max_hp         INTEGER DEFAULT 10,
  ac             INTEGER DEFAULT 10,
  str_score      INTEGER DEFAULT 10,
  dex_score      INTEGER DEFAULT 10,
  con_score      INTEGER DEFAULT 10,
  int_score      INTEGER DEFAULT 10,
  wis_score      INTEGER DEFAULT 10,
  cha_score      INTEGER DEFAULT 10,
  character_data JSONB DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_code, player_name)
);

-- Initiative tracker
CREATE TABLE IF NOT EXISTS initiative_tracker (
  room_code     TEXT PRIMARY KEY REFERENCES rooms(code) ON DELETE CASCADE,
  entries       JSONB DEFAULT '[]'::jsonb,
  current_index INTEGER DEFAULT 0,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security (open for now — lock down later) ──
ALTER TABLE rooms             ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players      ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiative_tracker ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_rooms"       ON rooms              FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_players"     ON room_players       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_initiative"  ON initiative_tracker FOR ALL USING (true) WITH CHECK (true);

-- ── Enable Realtime ──
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE initiative_tracker;

-- ── Storage bucket for maps ──
-- В Supabase dashboard: Storage > Create bucket "dnd-maps" > Public: YES
