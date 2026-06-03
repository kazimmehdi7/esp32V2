-- Align user_activities columns with codebase expectations and design doc
ALTER TABLE public.user_activities RENAME COLUMN overall_progress TO user_progress;

-- Safely drop default, convert completed from JSONB array to text[], and apply new default
ALTER TABLE public.user_activities ALTER COLUMN completed DROP DEFAULT;
ALTER TABLE public.user_activities 
  ALTER COLUMN completed TYPE text[] USING translate(completed::text, '[]', '{}')::text[];
ALTER TABLE public.user_activities ALTER COLUMN completed SET DEFAULT '{}'::text[];

-- Convert last_active to text (ISO string)
ALTER TABLE public.user_activities ALTER COLUMN last_active TYPE text;

-- Create kit_codes table for physical kit registration and access control
CREATE TABLE IF NOT EXISTS public.kit_codes (
  code         text          PRIMARY KEY,
  kit_type     text          NOT NULL DEFAULT 'esp32',
  redeemed_by  uuid          REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_at  timestamp with time zone,
  expires_at   timestamp with time zone,
  is_active    boolean       DEFAULT true
);

-- Enable RLS on kit_codes
ALTER TABLE public.kit_codes ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own redeemed codes
CREATE POLICY "Users can read their own redeemed codes" 
  ON public.kit_codes FOR SELECT 
  USING (auth.uid() = redeemed_by);

-- Future-proof user_progress with a course_id column for multi-course capabilities
ALTER TABLE public.user_progress 
  ADD COLUMN IF NOT EXISTS course_id text NOT NULL DEFAULT 'esp32';

-- Drop the old unique constraint and add a new one including course_id
ALTER TABLE public.user_progress
  DROP CONSTRAINT IF EXISTS user_progress_user_id_level_id_lesson_id_step_id_key;

ALTER TABLE public.user_progress
  ADD CONSTRAINT user_progress_user_id_course_id_level_id_lesson_id_step_id_key
  UNIQUE (user_id, course_id, level_id, lesson_id, step_id);
