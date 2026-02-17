import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Phone, User, Search, Plus, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNotificationSound, useBrowserNotifications } from "@/hooks/use-notifications";

interface ChatItem {
  id: string;
  name: string | null;
  is_group: boolean;
  last_message?: string;
  last_message_time?: string;
  avatar_url?: string;
  other_user_name?: string;
}

export default function ChatList() {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const playSound = useNotificationSound();
  const { requestPermission, showNotification } = useBrowserNotifications();

  useEffect(() => {
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(!!data);
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadChats();
    requestPermission();

    const channel = supabase
      .channel("chat-list-updates")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as { sender_id: string; encrypted_content?: string };
        if (msg.sender_id !== user.id) {
          playSound();
          showNotification("WhatsZak", msg.encrypted_content ?? "Nova mensagem", () => {
            window.focus();
          });
        }
        loadChats();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const loadChats = async () => {
    if (!user) return;

    const { data: participantChats } = await supabase
      .from("chat_participants")
      .select("chat_id")
      .eq("user_id", user.id);

    if (!participantChats?.length) {
      setChats([]);
      setLoading(false);
      return;
    }

    const chatIds = participantChats.map((p) => p.chat_id);

    const { data: chatData } = await supabase
      .from("chats")
      .select("id, name, is_group")
      .in("id", chatIds);

    if (!chatData) {
      setLoading(false);
      return;
    }

    // Get last message for each chat
    const enrichedChats: ChatItem[] = [];

    for (const chat of chatData) {
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("encrypted_content, created_at")
        .eq("chat_id", chat.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let otherUserName = chat.name;
      let avatarUrl: string | undefined;

      if (!chat.is_group) {
        const { data: participants } = await supabase
          .from("chat_participants")
          .select("user_id")
          .eq("chat_id", chat.id)
          .neq("user_id", user.id)
          .limit(1);

        if (participants?.[0]) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name, avatar_url")
            .eq("id", participants[0].user_id)
            .single();

          if (profile) {
            otherUserName = profile.name;
            avatarUrl = profile.avatar_url ?? undefined;
          }
        }
      }

      enrichedChats.push({
        id: chat.id,
        name: chat.name,
        is_group: chat.is_group,
        last_message: lastMsg?.encrypted_content ?? undefined,
        last_message_time: lastMsg?.created_at ?? undefined,
        avatar_url: avatarUrl,
        other_user_name: otherUserName ?? undefined,
      });
    }

    enrichedChats.sort((a, b) => {
      if (!a.last_message_time) return 1;
      if (!b.last_message_time) return -1;
      return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
    });

    setChats(enrichedChats);
    setLoading(false);
  };

  const filteredChats = chats.filter((c) =>
    (c.other_user_name ?? c.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">WhatsZak</h1>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary/80"
            onClick={() => navigate("/new-chat")}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-primary-foreground/60" />
          <Input
            placeholder="Pesquisar conversa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 bg-primary/80 pl-10 text-primary-foreground placeholder:text-primary-foreground/60 focus-visible:ring-0"
          />
        </div>
      </header>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <MessageCircle className="mb-3 h-12 w-12" />
            <p>Nenhuma conversa ainda</p>
            <Button variant="link" onClick={() => navigate("/new-chat")} className="mt-2">
              Iniciar nova conversa
            </Button>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const initials = (chat.other_user_name ?? chat.name ?? "?")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <button
                key={chat.id}
                className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-accent"
                onClick={() => navigate(`/chat/${chat.id}`)}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={chat.avatar_url} />
                  <AvatarFallback className="bg-primary/20 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold truncate">{chat.other_user_name ?? chat.name ?? "Chat"}</p>
                    {chat.last_message_time && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {formatDistanceToNow(new Date(chat.last_message_time), {
                          addSuffix: false,
                          locale: ptBR,
                        })}
                      </span>
                    )}
                  </div>
                  {chat.last_message && (
                    <p className="text-sm text-muted-foreground truncate">{chat.last_message}</p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Bottom nav */}
      <nav className="flex items-center justify-around border-t border-border bg-card py-2">
        <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto text-primary" onClick={() => navigate("/")}>
          <MessageCircle className="h-5 w-5" />
          <span className="text-xs">Chats</span>
        </Button>
        <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto text-muted-foreground" disabled>
          <Phone className="h-5 w-5" />
          <span className="text-xs">Chamadas</span>
        </Button>
        <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto text-muted-foreground" onClick={() => navigate("/profile")}>
          <User className="h-5 w-5" />
          <span className="text-xs">Perfil</span>
        </Button>
        {isAdmin && (
          <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto text-muted-foreground" onClick={() => navigate("/admin")}>
            <Shield className="h-5 w-5" />
            <span className="text-xs">Admin</span>
          </Button>
        )}
      </nav>
    </div>
  );
}
