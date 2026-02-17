
-- Add reply_to_id to messages for reply/quote feature
ALTER TABLE public.messages
ADD COLUMN reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL;

-- Add deleted_at for "delete for everyone"
ALTER TABLE public.messages
ADD COLUMN deleted_at timestamp with time zone;

-- Table for "delete for me" (per-user message hiding)
CREATE TABLE public.message_deletions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

ALTER TABLE public.message_deletions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own deletions"
ON public.message_deletions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deletions"
ON public.message_deletions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_message_deletions_user ON public.message_deletions(user_id, message_id);
CREATE INDEX idx_messages_reply_to ON public.messages(reply_to_id);
