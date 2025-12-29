import { useState } from 'react';
import { BookOpen, Plus, Trash2, Edit } from 'lucide-react';

interface BatchManagementProps {
  batches: any[];
  teachers: any[];
  students: any[];
  isDark: boolean;
  onLoadData: () => void;
  onCreateBatch: (batch: any) => Promise<void>;
  onUpdateBatch: (batchId: string, updates: any) => Promise<void>;
  onDeleteBatch: (batchId: string) => Promise<void>;
  onAddStudentToBatch: (batchId: string, studentId: string) => Promise<void>;
  onRemoveStudentFromBatch: (batchId: string, studentId: string) => Promise<void>;
}

export function BatchManagement({
  batches,
  teachers,
  students,
  isDark,
  onCreateBatch,
  onUpdateBatch,
  onDeleteBatch,
  onAddStudentToBatch,
  onRemoveStudentFromBatch,
}: BatchManagementProps) {
  const [showNewBatch, setShowNewBatch] = useState(false);
  const [newBatch, setNewBatch] = useState({ name: '', teacherId: '', meetLink: '' });
  const [editingBatch, setEditingBatch] = useState<any>(null);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateBatch(newBatch);
    setNewBatch({ name: '', teacherId: '', meetLink: '' });
    setShowNewBatch(false);
  };

  const handleUpdateBatch = async (batchId: string) => {
    if (!editingBatch) return;
    await onUpdateBatch(batchId, editingBatch);
    setEditingBatch(null);
  };

  return (
    <div className={`relative overflow-hidden ${isDark ? 'bg-gray-800/60' : 'bg-white'} p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50`}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
      <div className="relative">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Batch Management</h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Manage your class batches and assignments</p>
          </div>
          <button
            onClick={() => setShowNewBatch(!showNewBatch)}
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-2xl hover:from-indigo-600 hover:to-indigo-700 hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">New Batch</span>
          </button>
        </div>

        {showNewBatch && (
          <form onSubmit={handleCreateBatch} className="mb-6 p-4 border border-indigo-200 rounded-lg bg-indigo-50">
            <h3 className="mb-4">Create New Batch</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Batch Name</label>
                <input
                  type="text"
                  value={newBatch.name}
                  onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Assign Teacher</label>
                <select
                  value={newBatch.teacherId}
                  onChange={(e) => setNewBatch({ ...newBatch, teacherId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">No teacher assigned</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.username})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Google Meet Link</label>
                <input
                  type="url"
                  value={newBatch.meetLink}
                  onChange={(e) => setNewBatch({ ...newBatch, meetLink: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="https://meet.google.com/..."
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  Create
                </button>
                <button type="button" onClick={() => setShowNewBatch(false)} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {batches.map((batch) => (
            <div key={batch.id} className={`p-4 border rounded-lg transition-all duration-300 hover:shadow-md ${
              isDark
                ? 'border-gray-600 bg-gray-700/50 hover:bg-gray-700'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}>
              {editingBatch?.id === batch.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editingBatch.name}
                    onChange={(e) => setEditingBatch({ ...editingBatch, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                  <select
                    value={editingBatch.teacherId || ''}
                    onChange={(e) => setEditingBatch({ ...editingBatch, teacherId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="">No teacher</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <input
                    type="url"
                    value={editingBatch.meetLink || ''}
                    onChange={(e) => setEditingBatch({ ...editingBatch, meetLink: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="Google Meet link"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateBatch(batch.id)}
                      className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingBatch(null)}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="mb-1">{batch.name}</h3>
                      <p className="text-sm text-gray-600">
                        Teacher: {teachers.find(t => t.id === batch.teacherId)?.name || 'Not assigned'}
                      </p>
                      {batch.meetLink && (
                        <p className="text-sm text-indigo-600 mt-1">
                          <a href={batch.meetLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            Meet Link
                          </a>
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingBatch(batch)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteBatch(batch.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm mb-2">Students ({batch.studentIds?.length || 0}):</p>
                    <div className="space-y-2 mb-3">
                      {students.filter(s => batch.studentIds?.includes(s.id)).map(student => (
                        <div key={student.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                          <span className="text-sm">{student.name}</span>
                          <button
                            onClick={() => onRemoveStudentFromBatch(batch.id, student.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          onAddStudentToBatch(batch.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="">Add student...</option>
                      {students.filter(s => !batch.studentIds?.includes(s.id)).map(student => (
                        <option key={student.id} value={student.id}>{student.name} ({student.username})</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          ))}
          
          {batches.length === 0 && (
            <p className="text-center py-12 text-gray-500">
              No batches yet. Create one to get started!
            </p>
          )}
        </div>
        </div>
    </div>
  );
}
