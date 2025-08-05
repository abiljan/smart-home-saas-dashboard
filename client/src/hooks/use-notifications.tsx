import { useCallback, useEffect, useState } from "react";

interface NotificationOptions {
  body?: string;
  icon?: string;
  tag?: string;
  badge?: string;
  silent?: boolean;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(() => 
    typeof window !== 'undefined' && 'Notification' in window 
      ? Notification.permission 
      : 'denied'
  );
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window);
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      console.warn('Browser notifications are not supported');
      return false;
    }

    if (permission === 'granted') {
      return true;
    }

    if (permission === 'denied') {
      console.warn('Notification permission has been denied');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        // Show a test notification
        new Notification('Smart Home SaaS Dashboard', {
          body: 'Notifications enabled! You\'ll receive alerts for critical events.',
          icon: '/favicon.ico',
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported, permission]);

  const showNotification = useCallback((
    title: string,
    options: NotificationOptions = {}
  ) => {
    if (!isSupported) {
      console.warn('Browser notifications are not supported');
      return null;
    }

    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        ...options,
      });

      // Auto-close after 5 seconds unless it's a critical alert
      if (!options.tag?.includes('critical')) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }, [isSupported, permission]);

  const showCriticalAlert = useCallback((title: string, message: string) => {
    const notification = showNotification(title, {
      body: message,
      tag: 'critical_alert',
      badge: '/favicon.ico',
    });

    // Play alert sound if available
    try {
      const audio = new Audio('/alert.mp3');
      audio.play().catch(() => {
        // Silently fail if sound can't be played
      });
    } catch (error) {
      // Silently fail if audio is not available
    }

    return notification;
  }, [showNotification]);

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    showCriticalAlert,
  };
}
