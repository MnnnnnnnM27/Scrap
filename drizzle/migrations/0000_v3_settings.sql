ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS typeliner boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS spellcheck boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS slash_commands boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS confirm_trash boolean NOT NULL DEFAULT false;
UPDATE public.user_settings SET font = 'default' WHERE font NOT IN ('default','cursive','switzer','google-sans','literata');