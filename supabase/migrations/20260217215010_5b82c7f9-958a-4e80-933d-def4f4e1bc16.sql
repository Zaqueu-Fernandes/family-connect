
-- Table to store FCM push tokens per user/device
CREATE TABLE public.push_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  token text NOT NULL,
  platform text NOT NULL DEFAULT 'web',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Enable RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can see their own tokens
CREATE POLICY "push_tokens_select_own" ON public.push_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "push_tokens_insert_own" ON public.push_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "push_tokens_update_own" ON public.push_tokens
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "push_tokens_delete_own" ON public.push_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Service role needs to read all tokens for sending push (edge function uses service role)
-- No extra policy needed since edge functions use service role key which bypasses RLS

-- Enable realtime (optional, not strictly needed)
-- Trigger for updated_at
CREATE TRIGGER update_push_tokens_updated_at
  BEFORE UPDATE ON public.push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
