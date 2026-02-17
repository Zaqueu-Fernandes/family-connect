
-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE

-- chat_participants
DROP POLICY IF EXISTS "Participants can view chat members" ON public.chat_participants;
DROP POLICY IF EXISTS "Participants can add members" ON public.chat_participants;
DROP POLICY IF EXISTS "Participants can remove members" ON public.chat_participants;

CREATE POLICY "Participants can view chat members" ON public.chat_participants FOR SELECT TO authenticated USING (is_chat_participant(auth.uid(), chat_id));
CREATE POLICY "Participants can add members" ON public.chat_participants FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id) OR is_chat_participant(auth.uid(), chat_id));
CREATE POLICY "Participants can remove members" ON public.chat_participants FOR DELETE TO authenticated USING (is_chat_participant(auth.uid(), chat_id));

-- chats
DROP POLICY IF EXISTS "Participants can view chats" ON public.chats;
DROP POLICY IF EXISTS "Authenticated can create chats" ON public.chats;
DROP POLICY IF EXISTS "Participants can update chats" ON public.chats;
DROP POLICY IF EXISTS "Participants can delete chats" ON public.chats;

CREATE POLICY "Participants can view chats" ON public.chats FOR SELECT TO authenticated USING (is_chat_participant(auth.uid(), id));
CREATE POLICY "Authenticated can create chats" ON public.chats FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Participants can update chats" ON public.chats FOR UPDATE TO authenticated USING (is_chat_participant(auth.uid(), id));
CREATE POLICY "Participants can delete chats" ON public.chats FOR DELETE TO authenticated USING (is_chat_participant(auth.uid(), id));

-- messages
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
DROP POLICY IF EXISTS "Sender can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Sender can delete own messages" ON public.messages;

CREATE POLICY "Participants can view messages" ON public.messages FOR SELECT TO authenticated USING (is_chat_participant(auth.uid(), chat_id));
CREATE POLICY "Participants can send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK ((auth.uid() = sender_id) AND is_chat_participant(auth.uid(), chat_id));
CREATE POLICY "Sender can update own messages" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = sender_id);
CREATE POLICY "Sender can delete own messages" ON public.messages FOR DELETE TO authenticated USING (auth.uid() = sender_id);

-- profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- user_roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
