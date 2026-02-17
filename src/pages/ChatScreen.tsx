import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send } from "lucide-react";
import { format } from "date-fns";
import { useNotificationSound, useBrowserNotifications } from "@/hooks/use-notifications";

interface Message {
  id: string;
  sender_id: string;
  encrypted_content: string | null;
  message_type: string;
  media_url: string | null;
  created_at: string;
}

interface ChatInfo {
  name: string;
  avatar_url?: string;
  is_group: boolean;
}

export default function ChatScreen() {
  const { chatId } = useParams<{ chatId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const playSound = useNotificationSound();
  const { showNotification } = useBrowserNotifications();

  useEffect(() => {
    if (!chatId || !user) return;
    loadChatInfo();
    loadMessages();
    markAsRead();

    const channel = supabase
      .channel(`chat-${chatId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `chat_id=eq.${chatId}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages((prev) => [...prev, newMsg]);
        if (newMsg.sender_id !== user?.id) {
          playSound();
          showNotification(
            chatInfo?.name ?? "Nova mensagem",
            newMsg.encrypted_content ?? "Mídia"
          );
          // Mark as read since user is viewing the chat
          supabase
            .from("messages")
            .update({ is_read: true })
            .eq("id", newMsg.id)
            .then();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [chatId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChatInfo = async () => {
    if (!chatId || !user) return;

    const { data: chat } = await supabase
      .from("chats")
      .select("name, is_group")
      .eq("id", chatId)
      .single();

    if (!chat) return;

    if (chat.is_group) {
      setChatInfo({ name: chat.name ?? "Grupo", is_group: true });
    } else {
      const { data: participants } = await supabase
        .from("chat_participants")
        .select("user_id")
        .eq("chat_id", chatId)
        .neq("user_id", user.id)
        .limit(1);

      if (participants?.[0]) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("id", participants[0].user_id)
          .single();

        setChatInfo({
          name: profile?.name ?? "Usuário",
          avatar_url: profile?.avatar_url ?? undefined,
          is_group: false,
        });
      }
    }
  };

  const loadMessages = async () => {
    if (!chatId) return;

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (data) setMessages(data);
  };

  const markAsRead = async () => {
    if (!chatId || !user) return;
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("chat_id", chatId)
      .eq("is_read", false)
      .neq("sender_id", user.id);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !chatId || !user || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    await supabase.from("messages").insert({
      chat_id: chatId,
      sender_id: user.id,
      encrypted_content: content,
      message_type: "text",
    });

    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const initials = chatInfo?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  return (
    <div className="flex min-h-screen flex-col bg-chat-bg">
      {/* Header */}
      <header className="flex items-center gap-3 bg-primary px-3 py-2 text-primary-foreground">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-primary-foreground hover:bg-primary/80">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-10 w-10">
          <AvatarImage src={chatInfo?.avatar_url} />
          <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold">{chatInfo?.name ?? "..."}</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {messages.map((msg) => {
          const isMine = msg.sender_id === user?.id;
          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 shadow-sm ${
                  isMine
                    ? "bg-chat-bubble-sent rounded-tr-none"
                    : "bg-chat-bubble-received rounded-tl-none"
                }`}
              >
                <p className="text-sm break-words">{msg.encrypted_content}</p>
                <p className={`text-[10px] mt-1 text-right text-muted-foreground`}>
                  {format(new Date(msg.created_at), "HH:mm")}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-border bg-card px-3 py-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Mensagem"
          className="flex-1 rounded-full"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!newMessage.trim() || sending}
          className="rounded-full h-10 w-10"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
