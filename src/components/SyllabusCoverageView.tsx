import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  BookOpen,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';
import { syllabusService } from '../services/syllabusService';
import { SyllabusChapter, CreateSyllabusChapterData } from '../types/syllabus';

interface SyllabusCoverageViewProps {
  selectedClass: string;
  selectedSubject: string;
  subjects: string[];
  onDataUpdate: () => void;
}

const SyllabusCoverageView: React.FC<SyllabusCoverageViewProps> = ({ 
  selectedClass, 
  selectedSubject,
  subjects, 
  onDataUpdate 
}) => {
  const [chapters, setChapters] = useState<SyllabusChapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');

  const [newChapter, setNewChapter] = useState<CreateSyllabusChapterData>({
    class: selectedClass,
    subject: selectedSubject,
    chapter_name: '',
    physical_class_conducted: false,
    chapter_end_test_status: false,
    notes_distribution_status: 'Undistributed',
    revision_status: false
  });

  useEffect(() => {
    if (selectedSubject) {
      loadChapters();
    }
  }, [selectedSubject, selectedClass]);

  const loadChapters = async () => {
    if (!selectedSubject) return;

    try {
      setLoading(true);
      setError(null);
      const data = await syllabusService.getSyllabusByClassAndSubject(selectedClass, selectedSubject);
      setChapters(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chapters');
    } finally {
      setLoading(false);
    }
  };

  const handleAddChapter = async () => {
    try {
      setError(null);
      await syllabusService.createSyllabusChapter({
        ...newChapter,
        class: selectedClass,
        subject: selectedSubject
      });
      
      setSuccess('Chapter added successfully!');
      setIsAddingChapter(false);
      setNewChapter({
        class: selectedClass,
        subject: selectedSubject,
        chapter_name: '',
        physical_class_conducted: false,
        chapter_end_test_status: false,
        notes_distribution_status: 'Undistributed',
        revision_status: false
      });
      
      await loadChapters();
      onDataUpdate();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add chapter');
    }
  };

  const handleUpdateChapter = async (chapterId: string, field: keyof SyllabusChapter, value: any) => {
    try {
      setError(null);
      await syllabusService.updateSyllabusChapter(chapterId, { [field]: value });
      
      // Update local state
      setChapters(prev => prev.map(chapter => 
        chapter.id === chapterId ? { ...chapter, [field]: value } : chapter
      ));
      
      onDataUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update chapter');
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('Are you sure you want to delete this chapter?')) {
      return;
    }

    try {
      setError(null);
      await syllabusService.deleteSyllabusChapter(chapterId);
      setChapters(prev => prev.filter(chapter => chapter.id !== chapterId));
      onDataUpdate();
      setSuccess('Chapter deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete chapter');
    }
  };

  const isChapterCompleted = (chapter: SyllabusChapter) => {
    return chapter.physical_class_conducted &&
           chapter.chapter_end_test_status &&
           chapter.notes_distribution_status === 'Distributed' &&
           chapter.revision_status;
  };

  const filteredChapters = chapters.filter(chapter => {
    const matchesSearch = chapter.chapter_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'completed') {
      return matchesSearch && isChapterCompleted(chapter);
    } else if (filterStatus === 'pending') {
      return matchesSearch && !isChapterCompleted(chapter);
    }
    
    return matchesSearch;
  });

  const getCompletionStats = () => {
    const total = chapters.length;
    const completed = chapters.filter(isChapterCompleted).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  };

  const stats = getCompletionStats();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Syllabus Coverage - {selectedSubject}</h2>
          <p className="text-gray-600 mt-1">Track chapter-wise progress for {selectedClass}</p>
        </div>
        <button
          onClick={() => setIsAddingChapter(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Chapter</span>
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Chapters</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Completed</p>
              <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Progress</p>
              <p className="text-2xl font-bold text-purple-900">{stats.percentage}%</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center">
              <span className="text-purple-600 font-bold text-sm">{stats.percentage}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search chapters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Chapters</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Add Chapter Form */}
      {isAddingChapter && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add New Chapter - {selectedSubject}</h3>
            <button
              onClick={() => setIsAddingChapter(false)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chapter Name
              </label>
              <input
                type="text"
                value={newChapter.chapter_name}
                onChange={(e) => setNewChapter(prev => ({ ...prev, chapter_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter chapter name"
              />
            </div>
            
            <div className="md:col-span-2 flex justify-end space-x-3">
              <button
                onClick={() => setIsAddingChapter(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddChapter}
                disabled={!newChapter.chapter_name.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Add Chapter</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chapters Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Chapter Name
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Physical Class
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Chapter Test
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes Distribution
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Revision
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredChapters.map((chapter) => (
              <tr key={chapter.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{chapter.chapter_name}</div>
                </td>
                
                <td className="px-6 py-4 text-center">
                  <select
                    value={chapter.physical_class_conducted ? 'Yes' : 'No'}
                    onChange={(e) => handleUpdateChapter(chapter.id, 'physical_class_conducted', e.target.value === 'Yes')}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </td>
                
                <td className="px-6 py-4 text-center">
                  <select
                    value={chapter.chapter_end_test_status ? 'Yes' : 'No'}
                    onChange={(e) => handleUpdateChapter(chapter.id, 'chapter_end_test_status', e.target.value === 'Yes')}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </td>
                
                <td className="px-6 py-4 text-center">
                  <select
                    value={chapter.notes_distribution_status}
                    onChange={(e) => handleUpdateChapter(chapter.id, 'notes_distribution_status', e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Undistributed">Undistributed</option>
                    <option value="Distributed">Distributed</option>
                  </select>
                </td>
                
                <td className="px-6 py-4 text-center">
                  <select
                    value={chapter.revision_status ? 'Yes' : 'No'}
                    onChange={(e) => handleUpdateChapter(chapter.id, 'revision_status', e.target.value === 'Yes')}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </td>
                
                <td className="px-6 py-4 text-center">
                  {isChapterCompleted(chapter) ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <XCircle className="w-3 h-3 mr-1" />
                      Pending
                    </span>
                  )}
                </td>
                
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDeleteChapter(chapter.id)}
                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors duration-150"
                    title="Delete Chapter"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredChapters.length === 0 && !loading && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm || filterStatus !== 'all' 
              ? 'No chapters found matching your criteria.' 
              : `No chapters added yet for ${selectedSubject}. Click "Add Chapter" to get started.`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default SyllabusCoverageView;