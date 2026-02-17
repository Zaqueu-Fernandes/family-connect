
-- Add view_once support to messages
ALTER TABLE public.messages ADD COLUMN view_once boolean NOT NULL DEFAULT false;
ALTER TABLE public.messages ADD COLUMN viewed_at timestamp with time zone;
