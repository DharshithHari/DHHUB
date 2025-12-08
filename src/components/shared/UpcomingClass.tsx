import { useEffect, useState } from 'react';
import { api } from '../../utils/api';

interface Schedule {
  id: string;
  batchId: string;
  date: string;
  time: string;
  title: string;
  meetLink?: string;
}

interface Props {
  batchId?: string;
  isDark?: boolean;
}

export function UpcomingClass({ batchId, isDark }: Props) {
  const [next, setNext] = useState<Schedule | null>(null);

  const load = async () => {
    if (!batchId) {
      setNext(null);
      return;
    }

    try {
      const res = await api.getSchedules(batchId);
      const schedules: Schedule[] = res.schedules || [];
      const upcoming = schedules
        .filter(s => new Date(s.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setNext(upcoming[0] || null);
    } catch (err) {
      console.error('Failed to load upcoming class', err);
      setNext(null);
    }
  };

  useEffect(() => {
    load();

    const handler = (e: any) => {
      try {
        const detailBatchId = e?.detail?.batchId;
        if (!detailBatchId || detailBatchId === batchId) load();
      } catch (err) {
        load();
      }
    };

    window.addEventListener('schedules-updated', handler as EventListener);
    window.addEventListener('batch-updated', handler as EventListener);
    return () => {
      window.removeEventListener('schedules-updated', handler as EventListener);
      window.removeEventListener('batch-updated', handler as EventListener);
    };
  }, [batchId]);

  if (!batchId) return (
    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
      <h4 className="text-sm font-medium">Upcoming Class</h4>
      <p className="text-sm text-gray-500">No batch assigned</p>
    </div>
  );

  return (
    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
      <h4 className="text-sm font-medium">Upcoming Class</h4>
      {next ? (
        <div className="mt-2">
          <div className="font-semibold">{next.title}</div>
          <div className="text-sm text-gray-500">{new Date(next.date).toLocaleDateString()} • {next.time}</div>
          {next.meetLink && (
            <div className="mt-3">
              <a href={next.meetLink} target="_blank" rel="noopener noreferrer" className="inline-block px-3 py-1 bg-indigo-600 text-white rounded">
                Join Meeting
              </a>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500 mt-2">No upcoming classes</p>
      )}
    </div>
  );
}

export default UpcomingClass;
