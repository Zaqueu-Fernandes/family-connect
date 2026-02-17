import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface IncomingCall {
  id: string;
  chat_id: string;
  caller_id: string;
  callerName: string;
  callerAvatar?: string;
}

export function useIncomingCalls(userId: string | undefined) {
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`incoming-calls-${userId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "calls",
        filter: `callee_id=eq.${userId}`,
      }, async (payload) => {
        const call = payload.new as any;
        if (call.status !== "ringing") return;

        // Get caller profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("id", call.caller_id)
          .single();

        setIncomingCall({
          id: call.id,
          chat_id: call.chat_id,
          caller_id: call.caller_id,
          callerName: profile?.name ?? "Usuário",
          callerAvatar: profile?.avatar_url ?? undefined,
        });
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "calls",
        filter: `callee_id=eq.${userId}`,
      }, (payload) => {
        const call = payload.new as any;
        if (call.status === "ended" || call.status === "rejected" || call.status === "answered") {
          // Clear incoming call if it was ended/rejected by caller or already answered
          setIncomingCall((prev) => (prev?.id === call.id ? null : prev));
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const dismissIncoming = () => setIncomingCall(null);

  return { incomingCall, dismissIncoming };
}
