import { useState } from 'react';
import { api } from '../../utils/api';
import { Sparkles } from 'lucide-react';

interface DemoDataSeederProps {
  onComplete: () => void;
}

export function DemoDataSeeder({ onComplete }: DemoDataSeederProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const seedDemoData = async () => {
    setLoading(true);
    try {
      // Create demo teachers
      setStatus('Creating demo teachers...');
      const teacher1 = await api.createUser({
        username: 'john.smith',
        password: 'teacher123',
        role: 'teacher',
        name: 'John Smith'
      });

      const teacher2 = await api.createUser({
        username: 'sarah.jones',
        password: 'teacher123',
        role: 'teacher',
        name: 'Sarah Jones'
      });

      // Create demo batches
      setStatus('Creating demo batches...');
      const batch1 = await api.createBatch({
        name: 'Python Fundamentals',
        teacherId: teacher1.user.id,
        meetLink: 'https://meet.google.com/example-python'
      });

      const batch2 = await api.createBatch({
        name: 'Web Development Bootcamp',
        teacherId: teacher2.user.id,
        meetLink: 'https://meet.google.com/example-webdev'
      });

      // Create demo students
      setStatus('Creating demo students...');
      const students = await Promise.all([
        api.createUser({
          username: 'alex.chen',
          password: 'student123',
          role: 'student',
          name: 'Alex Chen',
          batchId: batch1.batch.id
        }),
        api.createUser({
          username: 'maria.garcia',
          password: 'student123',
          role: 'student',
          name: 'Maria Garcia',
          batchId: batch1.batch.id
        }),
        api.createUser({
          username: 'james.wilson',
          password: 'student123',
          role: 'student',
          name: 'James Wilson',
          batchId: batch2.batch.id
        }),
        api.createUser({
          username: 'emma.brown',
          password: 'student123',
          role: 'student',
          name: 'Emma Brown',
          batchId: batch2.batch.id
        })
      ]);

      // Update batches with student IDs
      setStatus('Assigning students to batches...');
      await api.updateBatch(batch1.batch.id, {
        studentIds: [students[0].user.id, students[1].user.id]
      });

      await api.updateBatch(batch2.batch.id, {
        studentIds: [students[2].user.id, students[3].user.id]
      });

      // Create demo schedules
      setStatus('Creating demo schedules...');
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      await Promise.all([
        api.createSchedule({
          batchId: batch1.batch.id,
          date: tomorrow.toISOString().split('T')[0],
          time: '10:00',
          title: 'Python Variables and Data Types'
        }),
        api.createSchedule({
          batchId: batch1.batch.id,
          date: nextWeek.toISOString().split('T')[0],
          time: '10:00',
          title: 'Python Functions and Loops'
        }),
        api.createSchedule({
          batchId: batch2.batch.id,
          date: tomorrow.toISOString().split('T')[0],
          time: '14:00',
          title: 'HTML & CSS Basics'
        }),
        api.createSchedule({
          batchId: batch2.batch.id,
          date: nextWeek.toISOString().split('T')[0],
          time: '14:00',
          title: 'JavaScript Introduction'
        })
      ]);

      // Create demo assignments
      setStatus('Creating demo assignments...');
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + 5);

      await Promise.all([
        api.createAssignment({
          batchId: batch1.batch.id,
          title: 'Build a Calculator',
          description: 'Create a simple calculator program that can add, subtract, multiply, and divide two numbers.',
          dueDate: dueDate.toISOString().split('T')[0],
          createdBy: teacher1.user.id
        }),
        api.createAssignment({
          batchId: batch2.batch.id,
          title: 'Personal Portfolio Website',
          description: 'Design and build a personal portfolio website using HTML and CSS.',
          dueDate: dueDate.toISOString().split('T')[0],
          createdBy: teacher2.user.id
        })
      ]);

      // Create demo notification
      setStatus('Creating demo notification...');
      await api.createNotification({
        senderId: 'admin:Dharshith24',
        senderName: 'Admin',
        targetRole: 'all',
        message: 'Welcome to DH Learning! This is a demo platform with sample data. Feel free to explore all features.'
      });

      setStatus('Demo data created successfully! ✅');
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error) {
      console.error('Failed to seed demo data:', error);
      setStatus('Failed to create demo data. Check console for errors.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl border-2 border-dashed border-indigo-300">
      <div className="flex items-start gap-4">
        <div className="bg-indigo-100 p-3 rounded-lg">
          <Sparkles className="w-6 h-6 text-indigo-600" />
        </div>
        <div className="flex-1">
          <h3 className="mb-2">Quick Demo Setup</h3>
          <p className="text-gray-600 mb-4">
            Create sample data to explore the platform:
          </p>
          <ul className="text-sm text-gray-600 mb-4 space-y-1">
            <li>• 2 Teachers (john.smith, sarah.jones)</li>
            <li>• 2 Batches (Python & Web Development)</li>
            <li>• 4 Students assigned to batches</li>
            <li>• 4 Upcoming class schedules</li>
            <li>• 2 Sample assignments</li>
            <li>• 1 Welcome notification</li>
          </ul>
          <p className="text-sm text-gray-500 mb-4">
            All demo accounts use password: <code className="bg-gray-100 px-2 py-1 rounded">teacher123</code> or <code className="bg-gray-100 px-2 py-1 rounded">student123</code>
          </p>
          
          {status && (
            <div className="bg-white p-3 rounded-lg border border-indigo-200 mb-4">
              <p className="text-sm text-indigo-700">{status}</p>
            </div>
          )}
          
          <button
            onClick={seedDemoData}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? 'Creating Demo Data...' : 'Create Demo Data'}
          </button>
        </div>
      </div>
    </div>
  );
}
