-- Run this once in the Supabase SQL editor on an existing database.
-- (schema.sql already includes these changes for fresh setups.)

ALTER TABLE lectures ADD COLUMN IF NOT EXISTS source_url TEXT;           -- YouTube URL, NULL for live lectures
ALTER TABLE lectures ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ready'; -- 'processing' | 'ready' | 'failed'
ALTER TABLE lectures ADD COLUMN IF NOT EXISTS error TEXT;
ALTER TABLE lectures ALTER COLUMN professor_name SET DEFAULT 'Unknown';

CREATE TABLE IF NOT EXISTS transcript_segments (
  id BIGSERIAL PRIMARY KEY,
  lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  start_sec DOUBLE PRECISION,  -- position in the video; NULL for live audio
  end_sec DOUBLE PRECISION,
  text TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'live', -- 'live' | 'youtube'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS transcript_segments_video_idx ON transcript_segments (lecture_id, start_sec);
CREATE INDEX IF NOT EXISTS transcript_segments_time_idx ON transcript_segments (lecture_id, created_at);

ALTER TABLE chat_logs ADD COLUMN IF NOT EXISTS quote_start_sec DOUBLE PRECISION; -- where in the video the quote is
ALTER TABLE chat_logs ADD COLUMN IF NOT EXISTS video_time_sec DOUBLE PRECISION;  -- playback position when asked
CREATE INDEX IF NOT EXISTS chat_logs_lecture_idx ON chat_logs (lecture_id, created_at);
