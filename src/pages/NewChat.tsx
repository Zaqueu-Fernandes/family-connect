import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Search } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  avatar_url: string | null;
}

export default function NewChat() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, name, avatar_url")
      .neq("id", user?.id ?? "");

    if (data) setUsers(data);
    setLoading(false);
  };

  const startChat = async (otherUserId: string) => {
    if (!user || creating) return;
    setCreating(true);

    // Check if a 1:1 chat already exists
    const { data: myChats } = await supabase
      .from("chat_participants")
      .select("chat_id")
      .eq("user_id", user.id);

    if (myChats) {
      for (const { chat_id } of myChats) {
        const { data: chat } = await supabase
          .from("chats")
          .select("id, is_group")
          .eq("id", chat_id)
          .eq("is_group", false)
          .single();

        if (chat) {
          const { data: otherParticipant } = await supabase
            .from("chat_participants")
            .select("user_id")
            .eq("chat_id", chat_id)
            .eq("user_id", otherUserId)
            .maybeSingle();

          if (otherParticipant) {
            navigate(`/chat/${chat_id}`);
            return;
          }
        }
      }
    }

    // Create new chat
    const { data: newChat, error } = await supabase
      .from("chats")
      .insert({ is_group: false, created_by: user.id })
      .select("id")
      .single();

    if (error || !newChat) {
      setCreating(false);
      return;
    }

    // Add both participants
    await supabase.from("chat_participants").insert([
      { chat_id: newChat.id, user_id: user.id },
      { chat_id: newChat.id, user_id: otherUserId },
    ]);

    navigate(`/chat/${newChat.id}`);
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center gap-3 bg-primary px-4 py-3 text-primary-foreground">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-primary-foreground hover:bg-primary/80">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Nova Conversa</h1>
      </header>

      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="text-center py-20 text-muted-foreground">Nenhum contato encontrado</p>
        ) : (
          filteredUsers.map((u) => {
            const initials = u.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <button
                key={u.id}
                className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-accent"
                onClick={() => startChat(u.id)}
                disabled={creating}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={u.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <p className="font-semibold">{u.name}</p>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
