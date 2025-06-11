import { supabase } from '../lib/supabase';
import { AttendanceRecord, AttendanceWithStudent, AttendanceStats } from '../types/attendance';

export const attendanceService = {
  async getAttendanceByClassAndDate(className: string, date: string): Promise<AttendanceWithStudent[]> {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        students!inner(name)
      `)
      .eq('class', className)
      .eq('date', date)
      .order('students(name)', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch attendance: ${error.message}`);
    }

    return (data || []).map(record => ({
      id: record.id,
      student_id: record.student_id,
      student_name: record.students.name,
      date: record.date,
      status: record.status,
      class: record.class,
      created_at: record.created_at,
      updated_at: record.updated_at
    }));
  },

  async getStudentsWithAttendance(className: string, date: string): Promise<AttendanceWithStudent[]> {
    // First get all students in the class
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name')
      .eq('class', className)
      .order('name', { ascending: true });

    if (studentsError) {
      throw new Error(`Failed to fetch students: ${studentsError.message}`);
    }

    if (!students || students.length === 0) {
      return [];
    }

    // Get existing attendance records for the date
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .eq('class', className)
      .eq('date', date);

    if (attendanceError) {
      throw new Error(`Failed to fetch attendance records: ${attendanceError.message}`);
    }

    // Create a map of existing attendance records
    const attendanceMap = new Map();
    (attendanceRecords || []).forEach(record => {
      attendanceMap.set(record.student_id, record);
    });

    // Combine students with their attendance status
    return students.map(student => {
      const existingRecord = attendanceMap.get(student.id);
      return {
        id: existingRecord?.id || '',
        student_id: student.id,
        student_name: student.name,
        date: date,
        status: existingRecord?.status || 'absent',
        class: className,
        created_at: existingRecord?.created_at || '',
        updated_at: existingRecord?.updated_at || ''
      };
    });
  },

  async markAttendance(studentId: string, date: string, status: 'present' | 'absent', className: string): Promise<AttendanceRecord> {
    // Check if attendance record already exists
    const { data: existing, error: checkError } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .eq('date', date)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw new Error(`Failed to check existing attendance: ${checkError.message}`);
    }

    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from('attendance')
        .update({ status })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update attendance: ${error.message}`);
      }

      return data;
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('attendance')
        .insert([{
          student_id: studentId,
          date,
          status,
          class: className
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create attendance: ${error.message}`);
      }

      return data;
    }
  },

  async bulkMarkAttendance(attendanceData: Array<{
    student_id: string;
    date: string;
    status: 'present' | 'absent';
    class: string;
  }>): Promise<void> {
    // Use upsert to handle both inserts and updates
    const { error } = await supabase
      .from('attendance')
      .upsert(attendanceData, {
        onConflict: 'student_id,date'
      });

    if (error) {
      throw new Error(`Failed to save attendance: ${error.message}`);
    }

    // After saving attendance, we could trigger a refresh of student data
    // This ensures the student management table shows updated attendance percentages
  },

  async getAttendanceStats(className: string, date: string): Promise<AttendanceStats> {
    // Get total students in class
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id')
      .eq('class', className);

    if (studentsError) {
      throw new Error(`Failed to fetch students: ${studentsError.message}`);
    }

    const totalStudents = students?.length || 0;

    // Get attendance records for the date
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('status')
      .eq('class', className)
      .eq('date', date);

    if (attendanceError) {
      throw new Error(`Failed to fetch attendance: ${attendanceError.message}`);
    }

    const presentCount = attendance?.filter(record => record.status === 'present').length || 0;
    const absentCount = totalStudents - presentCount;
    const attendanceRate = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0;

    return {
      totalStudents,
      presentCount,
      absentCount,
      attendanceRate: Math.round(attendanceRate * 10) / 10
    };
  },

  async getClassList(): Promise<string[]> {
    const { data, error } = await supabase
      .from('students')
      .select('class')
      .order('class');

    if (error) {
      throw new Error(`Failed to fetch classes: ${error.message}`);
    }

    // Get unique classes
    const uniqueClasses = [...new Set(data?.map(student => student.class) || [])];
    return uniqueClasses;
  }
};