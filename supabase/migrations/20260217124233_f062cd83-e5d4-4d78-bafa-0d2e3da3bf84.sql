
-- Drop all restrictive policies and recreate as permissive

-- CHAT_PARTICIPANTS
DROP POLICY IF EXISTS "Participants can add members" ON public.chat_participants;
DROP POLICY IF EXISTS "Participants can remove members" ON public.chat_participants;
DROP POLICY IF EXISTS "Participants can view chat members" ON public.chat_participants;

CREATE POLICY "Participants can view chat members" ON public.chat_participants FOR SELECT USING (is_chat_participant(auth.uid(), chat_id));
CREATE POLICY "Participants can add members" ON public.chat_participants FOR INSERT WITH CHECK ((auth.uid() = user_id) OR is_chat_participant(auth.uid(), chat_id));
CREATE POLICY "Participants can remove members" ON public.chat_participants FOR DELETE USING (is_chat_participant(auth.uid(), chat_id));

-- CHATS
DROP POLICY IF EXISTS "Authenticated can create chats" ON public.chats;
DROP POLICY IF EXISTS "Participants can delete chats" ON public.chats;
DROP POLICY IF EXISTS "Participants can update chats" ON public.chats;
DROP POLICY IF EXISTS "Participants can view chats" ON public.chats;

CREATE POLICY "Participants can view chats" ON public.chats FOR SELECT USING (is_chat_participant(auth.uid(), id));
CREATE POLICY "Authenticated can create chats" ON public.chats FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Participants can update chats" ON public.chats FOR UPDATE USING (is_chat_participant(auth.uid(), id));
CREATE POLICY "Participants can delete chats" ON public.chats FOR DELETE USING (is_chat_participant(auth.uid(), id));

-- MESSAGES
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
DROP POLICY IF EXISTS "Sender can delete own messages" ON public.messages;
DROP POLICY IF EXISTS "Sender can update own messages" ON public.messages;

CREATE POLICY "Participants can view messages" ON public.messages FOR SELECT USING (is_chat_participant(auth.uid(), chat_id));
CREATE POLICY "Participants can send messages" ON public.messages FOR INSERT WITH CHECK ((auth.uid() = sender_id) AND is_chat_participant(auth.uid(), chat_id));
CREATE POLICY "Sender can update own messages" ON public.messages FOR UPDATE USING (auth.uid() = sender_id);
CREATE POLICY "Sender can delete own messages" ON public.messages FOR DELETE USING (auth.uid() = sender_id);

-- PROFILES
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- USER_ROLES
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
