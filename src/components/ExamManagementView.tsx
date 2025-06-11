import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical,
  Edit,
  Trash2,
  Info,
  BookOpen,
  Users,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { examService } from '../services/examService';
import { ExamWithStats } from '../types/exam';
import AddExamModal from './AddExamModal';
import ExamDetailsView from './ExamDetailsView';

interface ExamManagementViewProps {
  selectedClass: string;
  selectedSubject: string;
  onDataUpdate: () => void;
}

const ExamManagementView: React.FC<ExamManagementViewProps> = ({ 
  selectedClass, 
  selectedSubject,
  onDataUpdate 
}) => {
  const [exams, setExams] = useState<ExamWithStats[]>([]);
  const [filteredExams, setFilteredExams] = useState<ExamWithStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadExamData();
  }, [selectedClass, selectedSubject, refreshTrigger]);

  useEffect(() => {
    filterExams();
  }, [exams, searchTerm]);

  const loadExamData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [examsData, subjectsData] = await Promise.all([
        examService.getAllExams(selectedClass, selectedSubject),
        examService.getAvailableSubjects()
      ]);

      setExams(examsData);
      setSubjects(subjectsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exam data');
    } finally {
      setLoading(false);
    }
  };

  const filterExams = () => {
    let filtered = exams;

    if (searchTerm) {
      filtered = filtered.filter(exam =>
        exam.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredExams(filtered);
  };

  const handleDeleteExam = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this exam? This will also delete all associated marks.')) {
      return;
    }

    try {
      await examService.deleteExam(examId);
      setRefreshTrigger(prev => prev + 1);
      setDropdownOpen(null);
      onDataUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete exam');
    }
  };

  const handleExamAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    onDataUpdate();
  };

  const handleBackFromDetails = () => {
    setSelectedExamId(null);
    setRefreshTrigger(prev => prev + 1);
    onDataUpdate();
  };

  if (selectedExamId) {
    return <ExamDetailsView examId={selectedExamId} onBack={handleBackFromDetails} />;
  }

  const getExamStats = () => {
    const totalExams = exams.length;
    const avgPerformance = totalExams > 0 
      ? Math.round(exams.reduce((sum, exam) => sum + (exam.avg_marks / exam.total_marks * 100), 0) / totalExams)
      : 0;
    const totalStudents = exams.reduce((sum, exam) => sum + exam.num_students, 0);

    return { totalExams, avgPerformance, totalStudents };
  };

  const stats = getExamStats();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Exam Management - {selectedSubject}</h2>
          <p className="text-gray-600 mt-1">Manage exams and track student performance for {selectedClass}</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Exam</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Exams</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalExams}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Avg Performance</p>
              <p className="text-2xl font-bold text-green-900">{stats.avgPerformance}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Total Attempts</p>
              <p className="text-2xl font-bold text-purple-900">{stats.totalStudents}</p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search exams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Exams Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Exam Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Marks
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg Marks
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Students
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredExams.map((exam) => (
              <tr key={exam.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{exam.name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(exam.exam_date).toLocaleDateString()}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900">{exam.subject}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-gray-900">{exam.total_marks}</span>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{exam.avg_marks}</span>
                    <div className="text-xs text-gray-500">
                      {exam.total_marks > 0 ? Math.round((exam.avg_marks / exam.total_marks) * 100) : 0}%
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-gray-900">{exam.num_students}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => setSelectedExamId(exam.id)}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                    title="View Details"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="relative">
                    <button
                      onClick={() => setDropdownOpen(dropdownOpen === exam.id ? null : exam.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                    {dropdownOpen === exam.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                        <div className="py-1">
                          <button 
                            onClick={() => {
                              setSelectedExamId(exam.id);
                              setDropdownOpen(null);
                            }}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            <Info className="w-4 h-4" />
                            <span>View Details</span>
                          </button>
                          <button className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                            <Edit className="w-4 h-4" />
                            <span>Edit Exam</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteExam(exam.id)}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Exam</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredExams.length === 0 && !loading && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm 
              ? 'No exams found matching your criteria.' 
              : `No exams created yet for ${selectedSubject}. Click "Add Exam" to get started.`
            }
          </p>
        </div>
      )}

      {/* Add Exam Modal */}
      <AddExamModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onExamAdded={handleExamAdded}
        classes={[selectedClass]}
        subjects={[selectedSubject]}
      />
    </div>
  );
};

export default ExamManagementView;