import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';
import { WS_BASE_URL } from '../api/config';
import type { Notification } from '../appTypes';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  rawNotifications: Notification[];
  markNotificationsAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const fetchNotifs = async () => {
      try {
        const res = await api.getNotifications();
        if (res?.notifications) setNotifications(res.notifications);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000); // Less frequent polling since we have WS

    let ws: WebSocket;
    const connectWs = () => {
      try {
        // WS_BASE_URL is e.g. "wss://backend.com/api" or "ws://localhost:8000/api"
        ws = new WebSocket(`${WS_BASE_URL}/ws/notifications/${user.id}`);
        ws.onmessage = (event) => {
          try {
            const newNotif = JSON.parse(event.data);
            setNotifications(prev => [newNotif, ...prev]);
          } catch (e) {
            console.error("WS parse error", e);
          }
        };
        ws.onclose = () => {
          setTimeout(connectWs, 3000);
        };
        ws.onerror = (e) => {
          console.error("WebSocket error:", e);
          ws.close();
        };
      } catch (err) {
        console.error("Failed to establish WebSocket connection:", err);
        // Fallback: the 30s polling in useEffect will still work
      }
    };
    connectWs();

    return () => {
      clearInterval(interval);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [user]);

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    api.markNotificationsRead().catch(console.error);
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      rawNotifications: notifications,
      markNotificationsAsRead 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
