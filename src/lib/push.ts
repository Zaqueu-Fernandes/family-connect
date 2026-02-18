import { supabase } from "@/integrations/supabase/client";

/**
 * Send a push notification to a recipient via the send-push edge function.
 * Logs results for debugging.
 */
export async function sendPushToUser(
  recipientId: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  try {
    console.log("[PUSH] Sending push to", recipientId, "title:", title);
    const { data: responseData, error } = await supabase.functions.invoke("send-push", {
      body: { recipient_id: recipientId, title, body, data },
    });

    if (error) {
      console.error("[PUSH] Edge function error:", error);
      return;
    }

    console.log("[PUSH] Response:", responseData);
  } catch (err) {
    console.error("[PUSH] Push notification failed:", err);
  }
}
