export interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent';
  class: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceWithStudent {
  id: string;
  student_id: string;
  student_name: string;
  date: string;
  status: 'present' | 'absent';
  class: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceStats {
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: number;
}