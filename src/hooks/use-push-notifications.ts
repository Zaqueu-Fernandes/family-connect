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
        if (!token) {
          console.warn("FCM token not available (permission denied or unsupported browser)");
          return;
        }

        console.log("FCM token obtained, saving...");

        // Upsert token using raw SQL to avoid type issues
        const { error } = await supabase.from("push_tokens" as any).upsert(
          { user_id: userId, token, platform: "web" } as any,
          { onConflict: "user_id,token" }
        );

        if (error) {
          console.error("Failed to save push token:", error);
          // Fallback: try insert
          const { error: insertError } = await supabase.from("push_tokens" as any).insert(
            { user_id: userId, token, platform: "web" } as any
          );
          if (insertError) {
            // May be duplicate, that's fine
            if (!insertError.message?.includes("duplicate")) {
              console.error("Push token insert also failed:", insertError);
            }
          }
        }

        console.log("FCM token registered successfully");
      } catch (err) {
        console.error("Push registration failed:", err);
      }
    };

    register();
  }, [userId]);

  // Handle foreground messages - data-only messages put title/body in payload.data
  useEffect(() => {
    const unsub = onForegroundMessage((payload: any) => {
      const title = payload.data?.title || payload.notification?.title;
      const body = payload.data?.body || payload.notification?.body;
      if (title) {
        playSound();
        toast(title, { description: body });
      }
    });
    return unsub;
  }, [playSound]);
}
