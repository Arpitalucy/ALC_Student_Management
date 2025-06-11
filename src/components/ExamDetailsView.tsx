import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Download,
  Edit3,
  Users,
  BookOpen,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { examService } from '../services/examService';
import { ExamDetailsData, ExamMarkWithStudent } from '../types/exam';

interface ExamDetailsViewProps {
  examId: string;
  onBack: () => void;
}

const ExamDetailsView: React.FC<ExamDetailsViewProps> = ({ examId, onBack }) => {
  const [examData, setExamData] = useState<ExamDetailsData | null>(null);
  const [marks, setMarks] = useState<ExamMarkWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [editingMode, setEditingMode] = useState(false);

  useEffect(() => {
    loadExamDetails();
  }, [examId]);

  const loadExamDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await examService.getExamDetails(examId);
      setExamData(data);
      setMarks(data.marks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exam details');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId: string, newMark: number) => {
    setMarks(prev => 
      prev.map(mark => 
        mark.student_id === studentId 
          ? { ...mark, marks_obtained: newMark, is_absent: false }
          : mark
      )
    );
  };

  const handleAbsentToggle = (studentId: string, isAbsent: boolean) => {
    setMarks(prev => 
      prev.map(mark => 
        mark.student_id === studentId 
          ? { ...mark, is_absent: isAbsent, marks_obtained: isAbsent ? -1 : 0 }
          : mark
      )
    );
  };

  const handleSaveMarks = async () => {
    try {
      setSaving(true);
      setError(null);

      const marksToSave = marks.map(mark => ({
        student_id: mark.student_id,
        marks_obtained: mark.marks_obtained,
        is_absent: mark.is_absent
      }));

      await examService.saveExamMarks(examId, marksToSave);
      
      setSuccess(true);
      setEditingMode(false);
      setTimeout(() => setSuccess(false), 3000);
      
      // Reload data to get updated stats
      await loadExamDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!examData) return;

    const csvContent = [
      ['Student Name', 'Total Marks', 'Student Marks', 'Percentage', 'Status'],
      ...marks.map(mark => [
        mark.student_name,
        examData.exam.total_marks.toString(),
        mark.is_absent ? 'Absent' : mark.marks_obtained.toString(),
        mark.is_absent ? 'N/A' : ((mark.marks_obtained / examData.exam.total_marks) * 100).toFixed(2) + '%',
        mark.is_absent ? 'Absent' : 'Present'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${examData.exam.name.replace(/\s+/g, '-').toLowerCase()}-marks.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const calculateStats = () => {
    if (!examData || marks.length === 0) {
      return { avgMarks: 0, avgPercentage: 0, totalStudents: 0, passCount: 0, presentCount: 0, absentCount: 0 };
    }

    const totalStudents = marks.length;
    const presentStudents = marks.filter(mark => !mark.is_absent);
    const absentStudents = marks.filter(mark => mark.is_absent);
    
    const totalMarks = presentStudents.reduce((sum, mark) => sum + mark.marks_obtained, 0);
    const avgMarks = presentStudents.length > 0 ? totalMarks / presentStudents.length : 0;
    const avgPercentage = (avgMarks / examData.exam.total_marks) * 100;
    const passCount = presentStudents.filter(mark => (mark.marks_obtained / examData.exam.total_marks) * 100 >= 40).length;

    return {
      avgMarks: Math.round(avgMarks * 10) / 10,
      avgPercentage: Math.round(avgPercentage * 10) / 10,
      totalStudents,
      passCount,
      presentCount: presentStudents.length,
      absentCount: absentStudents.length
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam details...</p>
        </div>
      </div>
    );
  }

  if (error || !examData) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium mb-2">Error loading exam details</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{examData.exam.name}</h1>
            <p className="text-gray-600 mt-1">
              {examData.exam.class} • {examData.exam.subject} • {new Date(examData.exam.exam_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownloadCSV}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV</span>
          </button>
          {editingMode ? (
            <button
              onClick={handleSaveMarks}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Marks</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setEditingMode(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Marks</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalStudents}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Present</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.presentCount}</p>
              <p className="text-sm text-gray-500">{stats.absentCount} absent</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-green-600 opacity-20"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Marks</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.avgMarks}</p>
              <p className="text-sm text-gray-500">of present students</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average %</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.avgPercentage}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pass Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.presentCount > 0 ? Math.round((stats.passCount / stats.presentCount) * 100) : 0}%
              </p>
              <p className="text-sm text-gray-500">{stats.passCount} passed</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-orange-600 opacity-20"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <Save className="w-3 h-3 text-white" />
          </div>
          <p className="text-green-700 text-sm">Marks saved successfully!</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Marks Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Student Marks</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Name
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Marks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Marks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {marks.map((mark) => {
                const percentage = mark.is_absent ? 0 : (mark.marks_obtained / examData.exam.total_marks) * 100;
                const grade = percentage >= 90 ? 'A+' : 
                             percentage >= 80 ? 'A' : 
                             percentage >= 70 ? 'B+' : 
                             percentage >= 60 ? 'B' : 
                             percentage >= 50 ? 'C+' : 
                             percentage >= 40 ? 'C' : mark.is_absent ? 'ABS' : 'F';
                
                const gradeColor = mark.is_absent ? 'text-gray-600 bg-gray-100' :
                                  percentage >= 80 ? 'text-green-600 bg-green-100' :
                                  percentage >= 60 ? 'text-blue-600 bg-blue-100' :
                                  percentage >= 40 ? 'text-yellow-600 bg-yellow-100' :
                                  'text-red-600 bg-red-100';

                return (
                  <tr key={mark.student_id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {mark.student_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{mark.student_name}</p>
                          <p className="text-sm text-gray-500">{mark.student_class}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {editingMode ? (
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={mark.is_absent}
                            onChange={(e) => handleAbsentToggle(mark.student_id, e.target.checked)}
                            className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Absent</span>
                        </label>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          mark.is_absent ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {mark.is_absent ? 'Absent' : 'Present'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{examData.exam.total_marks}</span>
                    </td>
                    <td className="px-6 py-4">
                      {editingMode && !mark.is_absent ? (
                        <input
                          type="number"
                          value={mark.marks_obtained}
                          onChange={(e) => handleMarkChange(mark.student_id, parseFloat(e.target.value) || 0)}
                          min="0"
                          max={examData.exam.total_marks}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-900">
                          {mark.is_absent ? 'N/A' : mark.marks_obtained}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {mark.is_absent ? 'N/A' : `${percentage.toFixed(1)}%`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${gradeColor}`}>
                        {grade}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {marks.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No students found in this class.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamDetailsView;