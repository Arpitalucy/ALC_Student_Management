import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Edit3, 
  Save, 
  X, 
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Student } from '../types/student';
import { studentService } from '../services/studentService';
import { attendanceService } from '../services/attendanceService';
import { feeService } from '../services/feeService';
import { examService } from '../services/examService';

interface StudentProfileProps {
  studentId: string;
  onBack: () => void;
}

interface PersonalDetails {
  name: string;
  phone: string;
  email: string;
  address: string;
  class: string;
}

const StudentProfile: React.FC<StudentProfileProps> = ({ studentId, onBack }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<{[key: string]: 'present' | 'absent'}>({});
  const [feeRecords, setFeeRecords] = useState<any[]>([]);
  const [examRecords, setExamRecords] = useState<any[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [feeLoading, setFeeLoading] = useState(false);
  const [examLoading, setExamLoading] = useState(false);

  const [personalDetails, setPersonalDetails] = useState<PersonalDetails>({
    name: '',
    phone: '',
    email: '',
    address: '',
    class: ''
  });

  useEffect(() => {
    loadStudent();
  }, [studentId]);

  useEffect(() => {
    if (activeTab === 'attendance' && student) {
      loadAttendanceData();
    } else if (activeTab === 'fees' && student) {
      loadFeeData();
    } else if (activeTab === 'academic' && student) {
      loadExamData();
    }
  }, [activeTab, student, currentDate]);

  const loadStudent = async () => {
    try {
      setLoading(true);
      setError(null);
      const studentData = await studentService.getStudentById(studentId);
      
      if (!studentData) {
        setError('Student not found');
        return;
      }

      setStudent(studentData);
      setPersonalDetails({
        name: studentData.name,
        phone: studentData.phone,
        email: studentData.email,
        address: studentData.address || '',
        class: studentData.class
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load student');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceData = async () => {
    if (!student) return;
    
    try {
      setAttendanceLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // Get attendance records for the current month
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
      
      // This would need a new service method to get attendance by date range
      // For now, we'll simulate with existing data
      const records: {[key: string]: 'present' | 'absent'} = {};
      
      // Simulate some attendance data for the current month
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        // Randomly assign attendance for demo (in real app, fetch from database)
        if (Math.random() > 0.2) { // 80% attendance rate
          records[dateKey] = 'present';
        } else {
          records[dateKey] = 'absent';
        }
      }
      
      setAttendanceRecords(records);
    } catch (err) {
      console.error('Failed to load attendance data:', err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const loadFeeData = async () => {
    if (!student) return;
    
    try {
      setFeeLoading(true);
      // Get fee records for this student
      const currentMonth = new Date().toISOString().slice(0, 7);
      const records = await feeService.getFeeRecordsByMonth(currentMonth);
      const studentFeeRecords = records.filter(record => record.student_id === student.id);
      setFeeRecords(studentFeeRecords);
    } catch (err) {
      console.error('Failed to load fee data:', err);
    } finally {
      setFeeLoading(false);
    }
  };

  const loadExamData = async () => {
    if (!student) return;
    
    try {
      setExamLoading(true);
      // Get exam records for this student's class
      const exams = await examService.getAllExams(student.class);
      
      // Get marks for each exam
      const examRecordsWithMarks = await Promise.all(
        exams.map(async (exam) => {
          try {
            const examDetails = await examService.getExamDetails(exam.id);
            const studentMark = examDetails.marks.find(mark => mark.student_id === student.id);
            return {
              ...exam,
              marks_obtained: studentMark?.marks_obtained || 0,
              is_absent: studentMark?.is_absent || false,
              percentage: studentMark && !studentMark.is_absent 
                ? Math.round((studentMark.marks_obtained / exam.total_marks) * 100)
                : 0
            };
          } catch {
            return {
              ...exam,
              marks_obtained: 0,
              is_absent: false,
              percentage: 0
            };
          }
        })
      );
      
      setExamRecords(examRecordsWithMarks);
    } catch (err) {
      console.error('Failed to load exam data:', err);
    } finally {
      setExamLoading(false);
    }
  };

  const handleAttendanceChange = async (dateKey: string, status: 'present' | 'absent') => {
    if (!student) return;
    
    try {
      // Update attendance in database
      await attendanceService.markAttendance(student.id, dateKey, status, student.class);
      
      // Update local state
      setAttendanceRecords(prev => ({
        ...prev,
        [dateKey]: status
      }));
    } catch (err) {
      alert('Failed to update attendance: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleFeeStatusChange = async (recordId: string, newStatus: string) => {
    try {
      const record = feeRecords.find(r => r.id === recordId);
      if (!record) return;
      
      await feeService.updateFeeRecordStatus(
        record.student_id, 
        record.month, 
        newStatus as 'paid' | 'pending' | 'overdue' | 'not started'
      );
      
      // Reload fee data
      await loadFeeData();
    } catch (err) {
      alert('Failed to update fee status: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal Details' },
    { id: 'academic', label: 'Academic Record' },
    { id: 'attendance', label: 'Attendance History' },
    { id: 'fees', label: 'Fee Management' }
  ];

  const handlePersonalSave = async () => {
    try {
      if (student) {
        await studentService.updateStudent(student.id, {
          name: personalDetails.name,
          phone: personalDetails.phone,
          email: personalDetails.email,
          address: personalDetails.address,
          class: personalDetails.class
        });
        setEditingPersonal(false);
        loadStudent(); // Refresh student data
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update student');
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day);
      const status = attendanceRecords[dateKey];
      
      days.push(
        <button
          key={day}
          onClick={() => {
            const newStatus = status === 'present' ? 'absent' : 'present';
            handleAttendanceChange(dateKey, newStatus);
          }}
          className={`h-12 w-12 rounded-lg flex items-center justify-center text-sm font-medium cursor-pointer transition-all duration-150 ${
            status === 'present' 
              ? 'bg-green-500 text-white hover:bg-green-600 shadow-md' 
              : status === 'absent'
              ? 'bg-red-400 text-white hover:bg-red-500 shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const getFeeStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'not started':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium mb-2">Error loading student profile</p>
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
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
          <p className="text-gray-600 mt-1">Student ID: {student.id.slice(0, 8)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 font-medium text-sm transition-colors duration-150 relative ${
                activeTab === tab.id
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {activeTab === 'personal' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Personal Details</h2>
              <button
                onClick={() => editingPersonal ? handlePersonalSave() : setEditingPersonal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150"
              >
                {editingPersonal ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                <span>{editingPersonal ? 'Save' : 'Edit'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                {editingPersonal ? (
                  <input
                    type="text"
                    value={personalDetails.name}
                    onChange={(e) => setPersonalDetails(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{personalDetails.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                {editingPersonal ? (
                  <input
                    type="tel"
                    value={personalDetails.phone}
                    onChange={(e) => setPersonalDetails(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{personalDetails.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                {editingPersonal ? (
                  <input
                    type="email"
                    value={personalDetails.email}
                    onChange={(e) => setPersonalDetails(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{personalDetails.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                {editingPersonal ? (
                  <textarea
                    value={personalDetails.address}
                    onChange={(e) => setPersonalDetails(prev => ({ ...prev, address: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter address"
                  />
                ) : (
                  <p className="text-gray-900">{personalDetails.address || 'No address provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class/Program</label>
                {editingPersonal ? (
                  <input
                    type="text"
                    value={personalDetails.class}
                    onChange={(e) => setPersonalDetails(prev => ({ ...prev, class: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{personalDetails.class}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'academic' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Academic Record</h2>
            
            {examLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-600">Loading exam records...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Exam
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Marks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Obtained Marks
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Percentage
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {examRecords.map((exam) => (
                      <tr key={exam.id}>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{exam.name}</p>
                            <p className="text-sm text-gray-500">{new Date(exam.exam_date).toLocaleDateString()}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">{exam.subject}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">{exam.total_marks}</span>
                        </td>
                        <td className="px-6 py-4">
                          {exam.is_absent ? (
                            <span className="text-sm text-red-600">Absent</span>
                          ) : (
                            <span className="text-sm text-gray-900">{exam.marks_obtained}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {exam.is_absent ? (
                            <span className="text-sm text-red-600">N/A</span>
                          ) : (
                            <span className="text-sm font-medium text-gray-900">{exam.percentage}%</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {examRecords.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No exam records found for this student.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Attendance History</h2>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">{student.attendance}%</div>
                <div className="text-sm text-gray-600">
                  Current attendance rate
                </div>
              </div>
            </div>

            {/* Calendar Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h3 className="text-lg font-medium text-gray-900">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {attendanceLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-600">Loading attendance data...</span>
              </div>
            ) : (
              /* Calendar */
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="grid grid-cols-7 gap-1 text-center mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-sm font-medium text-gray-700 py-3">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {renderCalendar()}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center justify-center space-x-6 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-600">Present (Click to toggle)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-400 rounded"></div>
                <span className="text-sm text-gray-600">Absent (Click to toggle)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-white border border-gray-200 rounded"></div>
                <span className="text-sm text-gray-600">No Record</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fees' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Fee Management</h2>
            
            {feeLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-gray-600">Loading fee records...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {feeRecords.map((record) => (
                      <tr key={record.id}>
                        <td className="px-6 py-4">
                          <span className="text-gray-900 font-medium">{record.month_name} {record.year}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-900">${record.amount}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-900">{new Date(record.due_date).toLocaleDateString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={record.status}
                            onChange={(e) => handleFeeStatusChange(record.id, e.target.value)}
                            className={`px-3 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-blue-500 ${getFeeStatusColor(record.status)}`}
                          >
                            <option value="not started">Not Started</option>
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="overdue">Overdue</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {feeRecords.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No fee records found for this student.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;