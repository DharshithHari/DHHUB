import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { Bell } from 'lucide-react';

interface Notification {
  id: string;
  senderId: string;
  senderName: string;
  targetRole: string;
  message: string;
  timestamp: string;
}

interface NotificationsProps {
  role: string;
  batchId?: string;
  userId?: string;
  isDark?: boolean;
}

export function Notifications({ role, batchId, userId, isDark }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  // delete action removed per request

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [role, batchId]);

  const loadNotifications = async () => {
    try {
      const response = await api.getNotifications(role, batchId, (userId as any) || undefined);
      setNotifications(response.notifications || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <div className="animate-pulse space-y-4">
          <div className={`h-6 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/3`}></div>
          <div className={`h-20 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded`}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
      <div className="flex items-center gap-2 mb-4">
        <Bell className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
        <h3 className={isDark ? 'text-white' : 'text-gray-900'}>Notifications</h3>
      </div>

      {notifications.length === 0 ? (
        <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          No notifications yet
        </p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border ${
                isDark
                  ? 'bg-gray-700 border-gray-600'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className={`text-sm ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                    {notification.senderName}
                  </span>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {new Date(notification.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* delete button removed */}
                </div>
              </div>
              <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                {notification.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
