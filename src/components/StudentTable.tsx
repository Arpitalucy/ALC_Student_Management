import React, { useState, useEffect } from 'react';
import { 
  ArrowUpDown, 
  Phone, 
  Mail, 
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  AlertCircle
} from 'lucide-react';
import { Student } from '../types/student';
import { studentService } from '../services/studentService';
import EditStudentModal from './EditStudentModal';

interface StudentTableProps {
  searchTerm: string;
  sortConfig: { key: string; direction: string };
  setSortConfig: (config: { key: string; direction: string }) => void;
  onSelectStudent: (studentId: string) => void;
  refreshTrigger: number;
}

const StudentTable: React.FC<StudentTableProps> = ({ 
  searchTerm, 
  sortConfig, 
  setSortConfig, 
  onSelectStudent,
  refreshTrigger 
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  useEffect(() => {
    loadStudents();
  }, [refreshTrigger]);

  useEffect(() => {
    if (searchTerm) {
      searchStudents();
    } else {
      loadStudents();
    }
  }, [searchTerm]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await studentService.getAllStudents();
      setStudents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const searchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await studentService.searchStudents(searchTerm);
      setStudents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search students');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student?')) {
      return;
    }

    try {
      await studentService.deleteStudent(studentId);
      setStudents(prev => prev.filter(student => student.id !== studentId));
      setDropdownOpen(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete student');
    }
  };

  const handleStudentUpdated = () => {
    loadStudents(); // Refresh the student list
    setEditingStudent(null);
  };
  const sortedStudents = [...students].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortConfig.key) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'class':
        aValue = a.class.toLowerCase();
        bValue = b.class.toLowerCase();
        break;
      case 'attendance':
        aValue = a.attendance;
        bValue = b.attendance;
        break;
      case 'fee_amount':
        aValue = a.fee_amount;
        bValue = b.fee_amount;
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: string) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
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
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAttendanceColor = (attendance: number) => {
    if (attendance >= 90) return 'text-green-600 bg-green-100';
    if (attendance >= 80) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium mb-2">Error loading students</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadStudents}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 text-left">
              <button
                onClick={() => handleSort('name')}
                className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
              >
                <span>Student Name</span>
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </th>
            <th className="px-6 py-4 text-left">
              <button
                onClick={() => handleSort('class')}
                className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
              >
                <span>Class</span>
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </th>
            <th className="px-6 py-4 text-left">
              <button
                onClick={() => handleSort('attendance')}
                className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
              >
                <span>Attendance</span>
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </th>
            <th className="px-6 py-4 text-left">
              <button
                onClick={() => handleSort('fee_amount')}
                className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
              >
                <span>Fee Status</span>
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedStudents.map((student) => (
            <tr key={student.id} className="hover:bg-gray-50 transition-colors duration-150">
              <td className="px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">{getInitials(student.name)}</span>
                  </div>
                  <div>
                    <button 
                      onClick={() => onSelectStudent(student.id)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-150"
                    >
                      {student.name}
                    </button>
                    <div className="text-sm text-gray-500">ID: {student.id.slice(0, 8)}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">{student.class}</div>
                <div className="text-sm text-gray-500">Enrolled: {new Date(student.enrollment_date).toLocaleDateString()}</div>
              </td>
              <td className="px-6 py-4">
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAttendanceColor(student.attendance)}`}>
                  {student.attendance}%
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="space-y-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFeeStatusColor(student.fee_status)}`}>
                    {student.fee_status.charAt(0).toUpperCase() + student.fee_status.slice(1)}
                  </span>
                  <div className="text-sm font-medium text-gray-900">${student.fee_amount}</div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{student.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{student.phone}</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(dropdownOpen === student.id ? null : student.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>
                  {dropdownOpen === student.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                      <div className="py-1">
                        <button 
                          onClick={() => {
                            onSelectStudent(student.id);
                            setDropdownOpen(null);
                          }}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                        </button>
                        <button 
                          onClick={() => {
                            setEditingStudent(student);
                            setDropdownOpen(null);
                          }}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit Student</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteStudent(student.id)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete Student</span>
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
        {sortedStudents.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No students found matching your search criteria.</p>
          </div>
        )}
      </div>

      {/* Edit Student Modal */}
      {editingStudent && (
        <EditStudentModal 
          isOpen={true}
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onStudentUpdated={handleStudentUpdated}
        />
      )}
    </>
  );
};

export default StudentTable;