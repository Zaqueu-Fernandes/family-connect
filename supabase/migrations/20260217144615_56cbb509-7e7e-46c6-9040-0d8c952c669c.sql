
-- Create a function that creates a chat and adds both participants atomically
CREATE OR REPLACE FUNCTION public.create_private_chat(_other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _chat_id uuid;
  _current_user_id uuid := auth.uid();
BEGIN
  IF _current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if a 1:1 chat already exists between these users
  SELECT cp1.chat_id INTO _chat_id
  FROM chat_participants cp1
  JOIN chat_participants cp2 ON cp1.chat_id = cp2.chat_id
  JOIN chats c ON c.id = cp1.chat_id
  WHERE cp1.user_id = _current_user_id
    AND cp2.user_id = _other_user_id
    AND c.is_group = false
  LIMIT 1;

  IF _chat_id IS NOT NULL THEN
    RETURN _chat_id;
  END IF;

  -- Create the chat
  INSERT INTO chats (is_group, created_by)
  VALUES (false, _current_user_id)
  RETURNING id INTO _chat_id;

  -- Add both participants
  INSERT INTO chat_participants (chat_id, user_id) VALUES (_chat_id, _current_user_id);
  INSERT INTO chat_participants (chat_id, user_id) VALUES (_chat_id, _other_user_id);

  RETURN _chat_id;
END;
$$;
