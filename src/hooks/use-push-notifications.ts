import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { requestFCMToken, onForegroundMessage } from "@/lib/firebase";
import { useNotificationSound } from "@/hooks/use-notifications";
import { toast } from "sonner";

export function usePushNotifications(userId: string | undefined) {
  const registeredRef = useRef(false);
  const playSound = useNotificationSound();

  useEffect(() => {
    if (!userId || registeredRef.current) return;
    registeredRef.current = true;

    const register = async () => {
      try {
        const token = await requestFCMToken();
        if (!token) return;

        // Upsert token
        await supabase.from("push_tokens" as any).upsert(
          { user_id: userId, token, platform: "web" },
          { onConflict: "user_id,token" }
        );

        console.log("FCM token registered");
      } catch (err) {
        console.error("Push registration failed:", err);
      }
    };

    register();
  }, [userId]);

  // Handle foreground messages
  useEffect(() => {
    const unsub = onForegroundMessage((payload: any) => {
      const { title, body } = payload.notification || {};
      if (title) {
        playSound();
        toast(title, { description: body });
      }
    });
    return unsub;
  }, [playSound]);
}
