
-- Table to store WebRTC call signaling data
CREATE TABLE public.calls (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  caller_id uuid NOT NULL,
  callee_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'ringing', -- ringing, answered, ended, rejected
  offer jsonb,
  answer jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone
);

-- ICE candidates table
CREATE TABLE public.call_ice_candidates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id uuid NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  candidate jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_ice_candidates ENABLE ROW LEVEL SECURITY;

-- Calls policies: only caller and callee can access
CREATE POLICY "calls_select" ON public.calls FOR SELECT
  USING (auth.uid() = caller_id OR auth.uid() = callee_id);

CREATE POLICY "calls_insert" ON public.calls FOR INSERT
  WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "calls_update" ON public.calls FOR UPDATE
  USING (auth.uid() = caller_id OR auth.uid() = callee_id);

-- ICE candidates policies
CREATE POLICY "ice_select" ON public.call_ice_candidates FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.calls c WHERE c.id = call_id AND (c.caller_id = auth.uid() OR c.callee_id = auth.uid())
  ));

CREATE POLICY "ice_insert" ON public.call_ice_candidates FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM public.calls c WHERE c.id = call_id AND (c.caller_id = auth.uid() OR c.callee_id = auth.uid())
  ));

-- Enable realtime for signaling
ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_ice_candidates;
