import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, User, Shield, PhoneIncoming, PhoneOutgoing, PhoneMissed, Video } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CallRecord {
  id: string;
  caller_id: string;
  callee_id: string;
  status: string;
  created_at: string;
  ended_at: string | null;
  peerName: string;
  peerAvatar?: string;
  isOutgoing: boolean;
}

export default function CallHistory() {
  const { user } = useAuth();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(!!data);
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadCalls();
  }, [user]);

  const loadCalls = async () => {
    if (!user) return;

    const { data: callsData } = await supabase
      .from("calls")
      .select("id, caller_id, callee_id, status, created_at, ended_at")
      .or(`caller_id.eq.${user.id},callee_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!callsData?.length) {
      setCalls([]);
      setLoading(false);
      return;
    }

    const peerIds = new Set<string>();
    for (const c of callsData) {
      peerIds.add(c.caller_id === user.id ? c.callee_id : c.caller_id);
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, avatar_url")
      .in("id", [...peerIds]);

    const profileMap = new Map<string, { name: string; avatar_url: string | null }>();
    for (const p of profiles ?? []) {
      profileMap.set(p.id, { name: p.name, avatar_url: p.avatar_url });
    }

    const enriched: CallRecord[] = callsData.map((c) => {
      const isOutgoing = c.caller_id === user.id;
      const peerId = isOutgoing ? c.callee_id : c.caller_id;
      const profile = profileMap.get(peerId);
      return {
        id: c.id,
        caller_id: c.caller_id,
        callee_id: c.callee_id,
        status: c.status,
        created_at: c.created_at,
        ended_at: c.ended_at,
        peerName: profile?.name ?? "Usuário",
        peerAvatar: profile?.avatar_url ?? undefined,
        isOutgoing,
      };
    });

    setCalls(enriched);
    setLoading(false);
  };

  const getCallIcon = (call: CallRecord) => {
    const isMissed = call.status === "rejected" || (call.status === "ended" && !call.ended_at);
    if (isMissed && !call.isOutgoing) {
      return <PhoneMissed className="h-4 w-4 text-destructive" />;
    }
    if (call.isOutgoing) {
      return <PhoneOutgoing className="h-4 w-4 text-primary" />;
    }
    return <PhoneIncoming className="h-4 w-4 text-green-500" />;
  };

  const getCallLabel = (call: CallRecord) => {
    const isMissed = call.status === "rejected" || (call.status === "ended" && !call.ended_at);
    if (isMissed && !call.isOutgoing) return "Perdida";
    if (call.status === "rejected") return "Recusada";
    if (call.isOutgoing) return "Efetuada";
    return "Recebida";
  };

  const getDuration = (call: CallRecord) => {
    if (!call.ended_at) return null;
    const start = new Date(call.created_at).getTime();
    const end = new Date(call.ended_at).getTime();
    const seconds = Math.round((end - start) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="bg-primary px-4 py-3 text-primary-foreground">
        <h1 className="text-xl font-bold">Chamadas</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Phone className="mb-3 h-12 w-12" />
            <p>Nenhuma chamada recente</p>
          </div>
        ) : (
          calls.map((call) => {
            const initials = call.peerName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={call.id}
                className="flex w-full items-center gap-3 border-b border-border px-4 py-3"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={call.peerAvatar} />
                  <AvatarFallback className="bg-primary/20 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="font-semibold truncate">{call.peerName}</p>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    {getCallIcon(call)}
                    <span>{getCallLabel(call)}</span>
                    {getDuration(call) && (
                      <span className="text-xs">· {getDuration(call)}</span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(call.created_at), {
                    addSuffix: false,
                    locale: ptBR,
                  })}
                </span>
              </div>
            );
          })
        )}
      </div>

      <nav className="flex items-center justify-around border-t border-border bg-card py-2">
        <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto text-muted-foreground" onClick={() => navigate("/")}>
          <MessageCircle className="h-5 w-5" />
          <span className="text-xs">Chats</span>
        </Button>
        <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto text-primary" onClick={() => navigate("/calls")}>
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
