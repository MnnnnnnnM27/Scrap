ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS toolbar_side text NOT NULL DEFAULT 'right',
  ADD COLUMN IF NOT EXISTS show_ask_gemini boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ghost_autocomplete boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_word_count boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS canvas_width text NOT NULL DEFAULT 'standard';

ALTER TABLE public.user_settings
  DROP CONSTRAINT IF EXISTS user_settings_toolbar_side_check;
ALTER TABLE public.user_settings
  ADD CONSTRAINT user_settings_toolbar_side_check CHECK (toolbar_side IN ('left','right'));

ALTER TABLE public.user_settings
  DROP CONSTRAINT IF EXISTS user_settings_canvas_width_check;
ALTER TABLE public.user_settings
  ADD CONSTRAINT user_settings_canvas_width_check CHECK (canvas_width IN ('narrow','standard','wide'));