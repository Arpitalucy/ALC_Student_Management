import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter,
  Download,
  AlertCircle
} from 'lucide-react';
import StudentTable from './StudentTable';
import AddStudentModal from './AddStudentModal';
import { studentService } from '../services/studentService';

interface StudentManagementProps {
  onSelectStudent: (studentId: string) => void;
}

const StudentManagement: React.FC<StudentManagementProps> = ({ onSelectStudent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    newThisMonth: 0,
    avgAttendance: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [refreshTrigger]);

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const students = await studentService.getAllStudents();
      
      const total = students.length;
      const active = students.filter(s => s.fee_status !== 'not started').length;
      
      // Calculate new students this month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const newThisMonth = students.filter(s => {
        const enrollmentDate = new Date(s.enrollment_date);
        return enrollmentDate.getMonth() === currentMonth && 
               enrollmentDate.getFullYear() === currentYear;
      }).length;
      
      // Calculate average attendance
      const avgAttendance = total > 0 
        ? students.reduce((sum, s) => sum + s.attendance, 0) / total 
        : 0;

      setStats({
        total,
        active,
        newThisMonth,
        avgAttendance: Math.round(avgAttendance * 10) / 10
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleStudentAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const statsData = [
    { 
      title: 'Total Students', 
      value: statsLoading ? '...' : stats.total.toString(), 
      change: '+12%', 
      color: 'blue' 
    },
    { 
      title: 'Active Students', 
      value: statsLoading ? '...' : stats.active.toString(), 
      change: '+8%', 
      color: 'green' 
    },
    { 
      title: 'New This Month', 
      value: statsLoading ? '...' : stats.newThisMonth.toString(), 
      change: '+15%', 
      color: 'purple' 
    },
    { 
      title: 'Avg. Attendance', 
      value: statsLoading ? '...' : `${stats.avgAttendance}%`, 
      change: '+2.1%', 
      color: 'orange' 
    }
  ];

  const getStatColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-700',
      green: 'bg-green-50 text-green-700',
      purple: 'bg-purple-50 text-purple-700',
      orange: 'bg-orange-50 text-orange-700'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
          <p className="text-gray-600 mt-1">Manage and monitor all students in your institution</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          <span>Add Student</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-sm text-green-600 mt-2">{stat.change} from last month</p>
              </div>
              <div className={`w-12 h-12 rounded-lg ${getStatColor(stat.color)} flex items-center justify-center`}>
                <div className="w-6 h-6 rounded-full bg-current opacity-20"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search students by name, ID, or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            />
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">Filter</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <Download className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <StudentTable 
          searchTerm={searchTerm}
          sortConfig={sortConfig}
          setSortConfig={setSortConfig}
          onSelectStudent={onSelectStudent}
          refreshTrigger={refreshTrigger}
        />
      </div>

      {/* Add Student Modal */}
      <AddStudentModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onStudentAdded={handleStudentAdded}
      />
    </div>
  );
};

export default StudentManagement;