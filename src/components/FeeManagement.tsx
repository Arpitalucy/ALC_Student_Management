import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter,
  Calendar,
  Download,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Users,
  CreditCard,
  FileText
} from 'lucide-react';
import { feeService } from '../services/feeService';
import { FeeRecordWithStudent, MonthlyFeeStats } from '../types/fee';

const FeeManagement: React.FC = () => {
  const [feeRecords, setFeeRecords] = useState<FeeRecordWithStudent[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<FeeRecordWithStudent[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [classes, setClasses] = useState<string[]>([]);
  const [availableMonths, setAvailableMonths] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<MonthlyFeeStats>({
    totalStudents: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0,
    notStartedCount: 0,
    paidPercentage: 0,
    pendingPercentage: 0,
    totalAmount: 0,
    collectedAmount: 0
  });

  useEffect(() => {
    initializeData();
    loadClasses();
    loadAvailableMonths();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      loadFeeRecords();
    }
  }, [selectedMonth, selectedClass]);

  useEffect(() => {
    filterRecords();
  }, [feeRecords, searchTerm]);

  const initializeData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Ensure current month records exist
      await feeService.ensureCurrentMonthRecords();
      
      // Set current month as default
      const currentMonth = new Date().toISOString().slice(0, 7);
      setSelectedMonth(currentMonth);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize data');
    } finally {
      setLoading(false);
    }
  };

  const loadFeeRecords = async () => {
    if (!selectedMonth) return;

    try {
      setLoading(true);
      setError(null);
      const data = await feeService.getFeeRecordsByMonth(selectedMonth, selectedClass || undefined);
      setFeeRecords(data);
      
      // Load stats for the selected month and class
      const statsData = await feeService.getMonthlyFeeStats(selectedMonth, selectedClass || undefined);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fee records');
    } finally {
      setLoading(false);
    }
  };
  const loadClasses = async () => {
    try {
      setClasses(['Grade-6', 'Grade-7', 'Grade-8']);
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  const loadAvailableMonths = async () => {
    try {
      const months = await feeService.getAvailableMonths();
      setAvailableMonths(months);
    } catch (err) {
      console.error('Failed to load available months:', err);
    }
  };

  const filterRecords = () => {
    let filtered = feeRecords;
    
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.student_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRecords(filtered);
  };

  const handleStatusChange = async (studentId: string, newStatus: string) => {
    try {
      await feeService.updateFeeRecordStatus(
        studentId, 
        selectedMonth, 
        newStatus as 'paid' | 'pending' | 'overdue' | 'not started'
      );
      
      // Update local state
      setFeeRecords(prev => 
        prev.map(record => 
          record.student_id === studentId 
            ? { ...record, status: newStatus as any }
            : record
        )
      );
      
      // Reload stats
      const statsData = await feeService.getMonthlyFeeStats(selectedMonth, selectedClass || undefined);
      setStats(statsData);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update fee status');
    }
  };

  const handleDownloadInvoice = (record: FeeRecordWithStudent) => {
    // Create a simple invoice content
    const invoiceContent = `
INVOICE

Student: ${record.student_name}
Class: ${record.student_class}
Email: ${record.student_email}
Month: ${record.month_name} ${record.year}

Fee Amount: $${record.amount}
Status: ${record.status.charAt(0).toUpperCase() + record.status.slice(1)}
Due Date: ${new Date(record.due_date).toLocaleDateString()}
${record.paid_date ? `Paid Date: ${new Date(record.paid_date).toLocaleDateString()}` : ''}

Generated on: ${new Date().toLocaleDateString()}
    `;

    // Create and download the file
    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${record.student_name.replace(/\s+/g, '-').toLowerCase()}-${record.month}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading fee management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fee Management</h1>
          <p className="text-gray-600 mt-1">Track and manage student fee payments</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${stats.totalAmount}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Collected</p>
              <p className="text-2xl font-bold text-green-600 mt-1">${stats.collectedAmount}</p>
              <p className="text-sm text-green-600 mt-1">{stats.paidPercentage}%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Students</p>
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
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pendingCount}</p>
              <p className="text-sm text-yellow-600 mt-1">{stats.pendingPercentage}%</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-48"
              >
                <option value="">Select Month</option>
                {availableMonths.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-48"
            >
              <option value="">All Classes</option>
              {classes.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Fee Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Fee Status {selectedMonth && availableMonths.find(m => m.value === selectedMonth)?.label} {selectedClass && `- ${selectedClass}`}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fee Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {getInitials(record.student_name)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{record.student_name}</p>
                        <p className="text-sm text-gray-500">{record.student_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{record.student_class}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900">{record.amount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={record.status}
                      onChange={(e) => handleStatusChange(record.student_id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-blue-500 ${getFeeStatusColor(record.status)}`}
                    >
                      <option value="not started">Not Started</option>
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDownloadInvoice(record)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                      title="Download Invoice"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && !loading && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No fee records found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeeManagement;