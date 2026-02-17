
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(_chat_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_chat_participant(auth.uid(), _chat_id) THEN
    RAISE EXCEPTION 'Not a participant';
  END IF;

  UPDATE messages
  SET is_read = true
  WHERE chat_id = _chat_id
    AND is_read = false
    AND sender_id <> auth.uid();
END;
$$;
