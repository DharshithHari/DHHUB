import { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

interface Schedule {
  id: string;
  batchId: string;
  date: string;
  time: string;
  title: string;
}

interface CalendarProps {
  batchId?: string;
  isDark?: boolean;
}

export function Calendar({ batchId, isDark }: CalendarProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedules();
  }, [batchId]);

  useEffect(() => {
    const handler = (e: any) => {
      // If batchId provided in event, only reload for matching batch
      try {
        const detailBatchId = e?.detail?.batchId;
        if (!detailBatchId || detailBatchId === batchId) {
          loadSchedules();
        }
      } catch (err) {
        loadSchedules();
      }
    };

    window.addEventListener('schedules-updated', handler as EventListener);
    return () => window.removeEventListener('schedules-updated', handler as EventListener);
  }, [batchId]);

  const loadSchedules = async () => {
    try {
      const response = await api.getSchedules(batchId);
      setSchedules(response.schedules || []);
    } catch (error) {
      console.error('Failed to load schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingSchedules = schedules
    .filter(s => new Date(s.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

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
        <CalendarIcon className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
        <h3 className={isDark ? 'text-white' : 'text-gray-900'}>Upcoming Classes</h3>
      </div>

      {upcomingSchedules.length === 0 ? (
        <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          No upcoming classes scheduled
        </p>
      ) : (
        <div className="space-y-3">
          {upcomingSchedules.map((schedule) => (
            <div
              key={schedule.id}
              className={`p-4 rounded-lg border ${
                isDark
                  ? 'bg-gray-700 border-gray-600'
                  : 'bg-indigo-50 border-indigo-200'
              }`}
            >
              <div className={`mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {schedule.title}
              </div>
              <div className={`flex items-center gap-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  {new Date(schedule.date).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {schedule.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
