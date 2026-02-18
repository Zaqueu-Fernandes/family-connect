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
    
    // Get current session to verify auth
    const { data: session } = await supabase.auth.getSession();
    console.log("[PUSH] Auth session exists:", !!session?.session);
    
    if (!session?.session) {
      console.error("[PUSH] No active session, cannot invoke edge function");
      return;
    }

    const { data: responseData, error } = await supabase.functions.invoke("send-push", {
      body: { recipient_id: recipientId, title, body, data },
    });

    if (error) {
      console.error("[PUSH] Edge function error:", JSON.stringify(error));
      return;
    }

    console.log("[PUSH] Response:", JSON.stringify(responseData));
  } catch (err: any) {
    console.error("[PUSH] Push notification failed:", err?.message || err);
  }
}
