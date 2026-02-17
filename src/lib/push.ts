import { supabase } from "@/integrations/supabase/client";

/**
 * Send a push notification to a recipient via the send-push edge function.
 * Fires and forgets — errors are logged but don't block the caller.
 */
export async function sendPushToUser(
  recipientId: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  try {
    await supabase.functions.invoke("send-push", {
      body: { recipient_id: recipientId, title, body, data },
    });
  } catch (err) {
    console.error("Push notification failed:", err);
  }
}
