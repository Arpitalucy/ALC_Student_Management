import React, { useState, useEffect } from 'react';
import { 
  BookOpen,
  Users,
  TrendingUp,
  BarChart3,
  Plus,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  Target,
  Award
} from 'lucide-react';
import { examService } from '../services/examService';
import { syllabusService } from '../services/syllabusService';
import { ExamWithStats } from '../types/exam';
import { SyllabusProgress } from '../types/syllabus';
import SyllabusCoverageView from './SyllabusCoverageView';
import ExamManagementView from './ExamManagementView';

const AcademicsManagement: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [activeView, setActiveView] = useState<'syllabus' | 'exams'>('syllabus');
  const [classes, setClasses] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [syllabusProgress, setSyllabusProgress] = useState<SyllabusProgress[]>([]);
  const [examStats, setExamStats] = useState<{ totalExams: number; avgPerformance: number }>({
    totalExams: 0,
    avgPerformance: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadClassData();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0]);
    }
  }, [subjects]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load available classes from both syllabus and students
      const [syllabusClasses, examClasses] = await Promise.all([
        syllabusService.getAvailableClasses(),
        examService.getAvailableClasses()
      ]);
      
      // Combine and deduplicate classes
      const allClasses = [...new Set([...syllabusClasses, ...examClasses])];
      setClasses(allClasses);
      
      // Set first class as default if available
      if (allClasses.length > 0 && !selectedClass) {
        setSelectedClass(allClasses[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const loadClassData = async () => {
    if (!selectedClass) return;

    try {
      setLoading(true);
      setError(null);

      // Load subjects for the selected class
      const classSubjects = await syllabusService.getAvailableSubjects(selectedClass);
      
      // If no subjects from syllabus, use default subjects
      const defaultSubjects = ['Mathematics', 'Science', 'English', 'Social Science', 'Computer Science'];
      const finalSubjects = classSubjects.length > 0 ? classSubjects : defaultSubjects;
      
      setSubjects(finalSubjects);

      // Load syllabus progress for each subject
      const progressPromises = finalSubjects.map(subject => 
        syllabusService.calculateSyllabusProgress(selectedClass, subject)
      );
      const progressData = await Promise.all(progressPromises);
      setSyllabusProgress(progressData);

      // Load exam statistics
      const exams = await examService.getAllExams(selectedClass);
      const totalExams = exams.length;
      const avgPerformance = totalExams > 0 
        ? Math.round(exams.reduce((sum, exam) => sum + (exam.avg_marks / exam.total_marks * 100), 0) / totalExams)
        : 0;
      
      setExamStats({ totalExams, avgPerformance });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load class data');
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallSyllabusProgress = () => {
    if (syllabusProgress.length === 0) return 0;
    const totalProgress = syllabusProgress.reduce((sum, progress) => sum + progress.progressPercentage, 0);
    return Math.round(totalProgress / syllabusProgress.length);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100';
    if (percentage >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading academic data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Academic Management</h1>
          <p className="text-gray-600 mt-1">Track syllabus coverage and exam performance</p>
        </div>
      </div>

      {/* Class Selector */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <Users className="w-5 h-5 text-gray-500" />
          <label htmlFor="class-select" className="text-sm font-medium text-gray-700">
            Select Class:
          </label>
          <select
            id="class-select"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-48"
          >
            <option value="">Choose a class</option>
            {classes.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedClass && (
        <>
          {/* Metric Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setActiveView('syllabus')}
              className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                activeView === 'syllabus'
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <BookOpen className={`w-6 h-6 ${activeView === 'syllabus' ? 'text-blue-600' : 'text-gray-500'}`} />
                    <h3 className={`text-lg font-semibold ${activeView === 'syllabus' ? 'text-blue-900' : 'text-gray-900'}`}>
                      Syllabus Progress
                    </h3>
                  </div>
                  <p className={`text-3xl font-bold ${activeView === 'syllabus' ? 'text-blue-600' : 'text-gray-600'}`}>
                    {calculateOverallSyllabusProgress()}%
                  </p>
                  <p className={`text-sm ${activeView === 'syllabus' ? 'text-blue-700' : 'text-gray-500'}`}>
                    Overall completion rate
                  </p>
                </div>
                <Target className={`w-8 h-8 ${activeView === 'syllabus' ? 'text-blue-500' : 'text-gray-400'}`} />
              </div>
            </button>

            <button
              onClick={() => setActiveView('exams')}
              className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                activeView === 'exams'
                  ? 'border-green-500 bg-green-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <Award className={`w-6 h-6 ${activeView === 'exams' ? 'text-green-600' : 'text-gray-500'}`} />
                    <h3 className={`text-lg font-semibold ${activeView === 'exams' ? 'text-green-900' : 'text-gray-900'}`}>
                      Exam Progress
                    </h3>
                  </div>
                  <p className={`text-3xl font-bold ${activeView === 'exams' ? 'text-green-600' : 'text-gray-600'}`}>
                    {examStats.avgPerformance}%
                  </p>
                  <p className={`text-sm ${activeView === 'exams' ? 'text-green-700' : 'text-gray-500'}`}>
                    Average performance ({examStats.totalExams} exams)
                  </p>
                </div>
                <BarChart3 className={`w-8 h-8 ${activeView === 'exams' ? 'text-green-500' : 'text-gray-400'}`} />
              </div>
            </button>
          </div>

          {/* Subject Tabs */}
          {subjects.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Subject Overview - {selectedClass}</h2>
              </div>
              
              {/* Subject Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {subjects.map((subject) => (
                    <button
                      key={subject}
                      onClick={() => setSelectedSubject(subject)}
                      className={`py-4 px-1 font-medium text-sm transition-colors duration-150 relative ${
                        selectedSubject === subject
                          ? 'text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {subject}
                      {selectedSubject === subject && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
              
              {/* Subject Progress Cards */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjects.map((subject) => {
                    const progress = syllabusProgress.find(p => p.subject === subject);
                    const progressPercentage = progress?.progressPercentage || 0;
                    
                    return (
                      <div 
                        key={subject} 
                        className={`rounded-lg p-4 border-2 cursor-pointer transition-all duration-200 ${
                          selectedSubject === subject 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 bg-gray-50 hover:border-blue-300'
                        }`}
                        onClick={() => setSelectedSubject(subject)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className={`font-medium ${selectedSubject === subject ? 'text-blue-900' : 'text-gray-900'}`}>
                            {subject}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProgressColor(progressPercentage)}`}>
                            {progressPercentage}%
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Syllabus</span>
                            <span>{progress?.completedChapters || 0}/{progress?.totalChapters || 0}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(progressPercentage)}`}
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <BookOpen className="w-3 h-3" />
                            <span>Syllabus: {progressPercentage}%</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>Exams: {examStats.avgPerformance}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Content Views */}
          {selectedSubject && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {activeView === 'syllabus' ? (
                <SyllabusCoverageView 
                  selectedClass={selectedClass} 
                  selectedSubject={selectedSubject}
                  subjects={subjects}
                  onDataUpdate={loadClassData}
                />
              ) : (
                <ExamManagementView 
                  selectedClass={selectedClass}
                  selectedSubject={selectedSubject}
                  onDataUpdate={loadClassData}
                />
              )}
            </div>
          )}
        </>
      )}

      {!selectedClass && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Class</h3>
          <p className="text-gray-500">Choose a class from the dropdown above to view academic progress and manage syllabus coverage.</p>
        </div>
      )}
    </div>
  );
};

export default AcademicsManagement;