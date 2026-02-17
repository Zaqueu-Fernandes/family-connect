import { useEffect, useRef } from "react";

/**
 * Generates a continuous ringtone using AudioContext.
 * - "incoming": classic phone ring pattern (ring-pause-ring)
 * - "outgoing": single tone beep pattern (beep-pause)
 */
export function useRingtone(
  active: boolean,
  type: "incoming" | "outgoing" = "incoming"
) {
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) {
      // Cleanup
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      if (ctxRef.current) {
        ctxRef.current.close().catch(() => {});
        ctxRef.current = null;
      }
      return;
    }

    try {
      const ctx = new AudioContext();
      ctxRef.current = ctx;

      const playTone = () => {
        if (ctx.state === "closed") return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === "incoming") {
          // Classic ring: two-tone alternating
          osc.type = "sine";
          const now = ctx.currentTime;
          osc.frequency.setValueAtTime(440, now);        // A4
          osc.frequency.setValueAtTime(480, now + 0.15);  // slightly higher
          osc.frequency.setValueAtTime(440, now + 0.3);
          osc.frequency.setValueAtTime(480, now + 0.45);
          gain.gain.setValueAtTime(0.35, now);
          gain.gain.setValueAtTime(0.35, now + 0.6);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
          osc.start(now);
          osc.stop(now + 0.7);
        } else {
          // Outgoing: single calm beep
          osc.type = "sine";
          const now = ctx.currentTime;
          osc.frequency.setValueAtTime(425, now); // standard ringback tone
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.setValueAtTime(0.2, now + 0.8);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
          osc.start(now);
          osc.stop(now + 0.9);
        }
      };

      // Play immediately then repeat
      playTone();
      const interval = type === "incoming" ? 1500 : 3000;
      intervalRef.current = setInterval(playTone, interval);
    } catch {
      // AudioContext not available
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      if (ctxRef.current) {
        ctxRef.current.close().catch(() => {});
        ctxRef.current = null;
      }
    };
  }, [active, type]);
}
