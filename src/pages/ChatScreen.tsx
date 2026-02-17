import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send } from "lucide-react";
import { useNotificationSound, useBrowserNotifications } from "@/hooks/use-notifications";
import MessageBubble from "@/components/chat/MessageBubble";
import AttachmentPicker from "@/components/chat/AttachmentPicker";
import AudioRecorder from "@/components/chat/AudioRecorder";
import { toast } from "@/hooks/use-toast";

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

  const uploadFile = async (file: Blob, ext: string): Promise<string | null> => {
    if (!user) return null;
    const fileName = `${user.id}/${chatId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("media")
      .upload(fileName, file);
    if (error) {
      console.error("Upload error:", error);
      return null;
    }
    const { data: urlData } = supabase.storage
      .from("media")
      .getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const getSignedUrl = async (path: string): Promise<string | null> => {
    const { data } = await supabase.storage
      .from("media")
      .createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
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

  const handleFileSelected = async (file: File, type: "image" | "file") => {
    if (!chatId || !user || sending) return;
    setSending(true);

    const ext = file.name.split(".").pop() ?? "bin";
    const filePath = `${user.id}/${chatId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("media").upload(filePath, file);
    if (error) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
      setSending(false);
      return;
    }

    const signedUrl = await getSignedUrl(filePath);

    await supabase.from("messages").insert({
      chat_id: chatId,
      sender_id: user.id,
      encrypted_content: type === "file" ? file.name : null,
      message_type: type,
      media_url: signedUrl,
    });

    setSending(false);
  };

  const handleAudioRecorded = async (blob: Blob) => {
    if (!chatId || !user) return;
    setSending(true);

    const filePath = `${user.id}/${chatId}/${Date.now()}.webm`;

    const { error } = await supabase.storage.from("media").upload(filePath, blob);
    if (error) {
      toast({ title: "Erro ao enviar áudio", description: error.message, variant: "destructive" });
      setSending(false);
      return;
    }

    const signedUrl = await getSignedUrl(filePath);

    await supabase.from("messages").insert({
      chat_id: chatId,
      sender_id: user.id,
      message_type: "audio",
      media_url: signedUrl,
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
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            content={msg.encrypted_content}
            mediaUrl={msg.media_url}
            messageType={msg.message_type}
            isMine={msg.sender_id === user?.id}
            createdAt={msg.created_at}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-1 border-t border-border bg-card px-2 py-2">
        <AttachmentPicker onFileSelected={handleFileSelected} disabled={sending} />
        {newMessage.trim() ? (
          <>
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
          </>
        ) : (
          <>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Mensagem"
              className="flex-1 rounded-full"
            />
            <AudioRecorder onRecorded={handleAudioRecorded} disabled={sending} />
          </>
        )}
      </div>
    </div>
  );
}
