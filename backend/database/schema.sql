-- 1. Active & Historical Lectures
CREATE TABLE lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  professor_name TEXT NOT NULL DEFAULT 'Unknown',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  source_url TEXT,                        -- YouTube URL, NULL for live lectures
  status TEXT NOT NULL DEFAULT 'ready',   -- 'processing' | 'ready' | 'failed'
  error TEXT
);

-- 2. Aggregated Cognitive Telemetry (Every 2s interval)
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  rolling_average NUMERIC(4, 2) NOT NULL, -- Range: 0.00 to 10.00
  sample_count INT NOT NULL
);

-- 3. Q&A Logs & Escalated Questions
CREATE TABLE chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  question TEXT NOT NULL,
  ai_answer TEXT,
  quote TEXT,
  is_escalated BOOLEAN DEFAULT FALSE,
  quote_start_sec DOUBLE PRECISION,       -- where in the video the quote is
  video_time_sec DOUBLE PRECISION,        -- playback position when asked
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX chat_logs_lecture_idx ON chat_logs (lecture_id, created_at);

-- 4. Post-Lecture Summaries & Artifacts
CREATE TABLE summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
  notes_markdown TEXT NOT NULL,
  key_takeaways JSONB DEFAULT '[]'::jsonb,
  generated_visuals JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 5. Persistent Transcript (live audio chunks or YouTube segments)
CREATE TABLE transcript_segments (
  id BIGSERIAL PRIMARY KEY,
  lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  start_sec DOUBLE PRECISION,  -- position in the video; NULL for live audio
  end_sec DOUBLE PRECISION,
  text TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'live', -- 'live' | 'youtube'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX transcript_segments_video_idx ON transcript_segments (lecture_id, start_sec);
CREATE INDEX transcript_segments_time_idx ON transcript_segments (lecture_id, created_at);
