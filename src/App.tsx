import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import AuthForm from './components/AuthForm';
import Sidebar from './components/Sidebar';
import StudentManagement from './components/StudentManagement';
import StudentProfile from './components/StudentProfile';
import AttendanceManagement from './components/AttendanceManagement';
import FeeManagement from './components/FeeManagement';
import AcademicsManagement from './components/AcademicsManagement';
import EventManagement from './components/EventManagement';
import AdminManagement from './components/AdminManagement';
import ProfileManagement from './components/ProfileManagement';

function App() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('students');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onAuthSuccess={() => {}} />;
  }

  const renderContent = () => {
    if (selectedStudentId) {
      return <StudentProfile studentId={selectedStudentId} onBack={() => setSelectedStudentId(null)} />;
    }
    
    switch (activeSection) {
      case 'students':
        return <StudentManagement onSelectStudent={setSelectedStudentId} />;
      case 'attendance':
        return <AttendanceManagement />;
      case 'fees':
        return <FeeManagement />;
      case 'academics':
        return <AcademicsManagement />;
      case 'events':
        return <EventManagement />;
      case 'admin':
        return <AdminManagement />;
      case 'profile':
        return <ProfileManagement />;
      default:
        return <StudentManagement onSelectStudent={setSelectedStudentId} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;