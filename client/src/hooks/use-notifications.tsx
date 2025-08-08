import { useState, useCallback } from "react";

interface NotificationOptions {
  body?: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" ? Notification.permission : "default"
  );

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      // Notifications are not supported in this browser
      return "denied";
    }

    if (permission === "granted") {
      return "granted";
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      // Failed to request notification permission - silently handle the error
      return "denied";
    }
  }, [permission]);

  const showNotification = useCallback(
    (title: string, options: NotificationOptions = {}) => {
      if (typeof window === "undefined" || !("Notification" in window)) {
        // Notifications are not supported
        return null;
      }

      if (permission !== "granted") {
        // Notification permission has been denied
        return null;
      }

      try {
        const notification = new Notification(title, {
          body: options.body,
          icon: options.icon || "/favicon.ico",
          tag: options.tag,
          requireInteraction: options.requireInteraction || false,
        });

        // Auto-close notification after 5 seconds unless requireInteraction is true
        if (!options.requireInteraction) {
          setTimeout(() => {
            notification.close();
          }, 5000);
        }

        return notification;
      } catch (error) {
        // Failed to show notification - silently handle the error
        return null;
      }
    },
    [permission]
  );

  return {
    permission,
    requestPermission,
    showNotification,
    isSupported: typeof window !== "undefined" && "Notification" in window,
  };
}