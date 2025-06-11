import { supabase } from '../lib/supabase';
import { Student, CreateStudentData } from '../types/student';

export const studentService = {
  async getAllStudents(): Promise<Student[]> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch students: ${error.message}`);
    }

    // Calculate attendance for each student
    const studentsWithAttendance = await Promise.all(
      (data || []).map(async (student) => {
        const attendancePercentage = await this.calculateStudentAttendance(student.id);
        return {
          ...student,
          attendance: attendancePercentage
        };
      })
    );

    return studentsWithAttendance;
  },

  async getStudentById(id: string): Promise<Student | null> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Student not found
      }
      throw new Error(`Failed to fetch student: ${error.message}`);
    }

    // Calculate attendance for this student
    const attendancePercentage = await this.calculateStudentAttendance(data.id);
    return {
      ...data,
      attendance: attendancePercentage
    };
  },

  async calculateStudentAttendance(studentId: string): Promise<number> {
    try {
      // Get all attendance records for this student
      const { data: attendanceRecords, error } = await supabase
        .from('attendance')
        .select('status')
        .eq('student_id', studentId);

      if (error) {
        console.error('Error fetching attendance:', error);
        return 0;
      }

      if (!attendanceRecords || attendanceRecords.length === 0) {
        return 0;
      }

      const totalRecords = attendanceRecords.length;
      const presentRecords = attendanceRecords.filter(record => record.status === 'present').length;
      
      return Math.round((presentRecords / totalRecords) * 100);
    } catch (error) {
      console.error('Error calculating attendance:', error);
      return 0;
    }
  },

  async createStudent(studentData: CreateStudentData): Promise<Student> {
    const { data, error } = await supabase
      .from('students')
      .insert([studentData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create student: ${error.message}`);
    }

    // Calculate attendance for the new student (will be 0 initially)
    const attendancePercentage = await this.calculateStudentAttendance(data.id);
    return {
      ...data,
      attendance: attendancePercentage
    };
  },

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update student: ${error.message}`);
    }

    // Calculate attendance for the updated student
    const attendancePercentage = await this.calculateStudentAttendance(data.id);
    return {
      ...data,
      attendance: attendancePercentage
    };
  },

  async deleteStudent(id: string): Promise<void> {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete student: ${error.message}`);
    }
  },

  async searchStudents(searchTerm: string): Promise<Student[]> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,class.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to search students: ${error.message}`);
    }

    // Calculate attendance for each student in search results
    const studentsWithAttendance = await Promise.all(
      (data || []).map(async (student) => {
        const attendancePercentage = await this.calculateStudentAttendance(student.id);
        return {
          ...student,
          attendance: attendancePercentage
        };
      })
    );

    return studentsWithAttendance;
  }
};