
-- Drop ALL existing policies on all tables
DROP POLICY IF EXISTS "Participants can view chat members" ON public.chat_participants;
DROP POLICY IF EXISTS "Participants can add members" ON public.chat_participants;
DROP POLICY IF EXISTS "Participants can remove members" ON public.chat_participants;

DROP POLICY IF EXISTS "Participants can view chats" ON public.chats;
DROP POLICY IF EXISTS "Authenticated can create chats" ON public.chats;
DROP POLICY IF EXISTS "Participants can update chats" ON public.chats;
DROP POLICY IF EXISTS "Participants can delete chats" ON public.chats;

DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
DROP POLICY IF EXISTS "Sender can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Sender can delete own messages" ON public.messages;

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- Recreate ALL policies (default is PERMISSIVE, do NOT use AS PERMISSIVE/RESTRICTIVE keywords)
CREATE POLICY "chat_participants_select" ON public.chat_participants FOR SELECT TO authenticated USING (public.is_chat_participant(auth.uid(), chat_id));
CREATE POLICY "chat_participants_insert" ON public.chat_participants FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id) OR public.is_chat_participant(auth.uid(), chat_id));
CREATE POLICY "chat_participants_delete" ON public.chat_participants FOR DELETE TO authenticated USING (public.is_chat_participant(auth.uid(), chat_id));

CREATE POLICY "chats_select" ON public.chats FOR SELECT TO authenticated USING (public.is_chat_participant(auth.uid(), id));
CREATE POLICY "chats_insert" ON public.chats FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "chats_update" ON public.chats FOR UPDATE TO authenticated USING (public.is_chat_participant(auth.uid(), id));
CREATE POLICY "chats_delete" ON public.chats FOR DELETE TO authenticated USING (public.is_chat_participant(auth.uid(), id));

CREATE POLICY "messages_select" ON public.messages FOR SELECT TO authenticated USING (public.is_chat_participant(auth.uid(), chat_id));
CREATE POLICY "messages_insert" ON public.messages FOR INSERT TO authenticated WITH CHECK ((auth.uid() = sender_id) AND public.is_chat_participant(auth.uid(), chat_id));
CREATE POLICY "messages_update" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = sender_id);
CREATE POLICY "messages_delete" ON public.messages FOR DELETE TO authenticated USING (auth.uid() = sender_id);

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "user_roles_select_admin" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
