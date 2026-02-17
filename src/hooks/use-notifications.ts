import { useCallback, useEffect, useRef } from "react";

// Create a short notification sound using AudioContext
function createNotificationSound(): () => void {
  return () => {
    try {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      // WhatsApp-like two-tone notification
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
      oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.08); // ~C#6

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.25);
    } catch {
      // AudioContext not available
    }
  };
}

export function useNotificationSound() {
  const playRef = useRef(createNotificationSound());
  return playRef.current;
}

export function useBrowserNotifications() {
  const permissionRef = useRef<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      permissionRef.current = Notification.permission;
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    const result = await Notification.requestPermission();
    permissionRef.current = result;
    return result === "granted";
  }, []);

  const showNotification = useCallback(
    (title: string, body: string, onClick?: () => void) => {
      if (
        !("Notification" in window) ||
        Notification.permission !== "granted" ||
        document.hasFocus()
      ) {
        return;
      }

      const options: NotificationOptions & { renotify?: boolean } = {
        body,
        icon: "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
        tag: "whatzak-message",
        renotify: true,
      };
      const notification = new Notification(title, options as NotificationOptions);

      if (onClick) {
        notification.onclick = () => {
          window.focus();
          onClick();
          notification.close();
        };
      }
    },
    []
  );

  return { requestPermission, showNotification };
}
