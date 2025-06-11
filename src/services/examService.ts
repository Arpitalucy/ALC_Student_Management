import { supabase } from '../lib/supabase';
import { Exam, ExamMark, ExamWithStats, ExamMarkWithStudent, CreateExamData, ExamDetailsData } from '../types/exam';

export const examService = {
  async getAllExams(className?: string, subject?: string): Promise<ExamWithStats[]> {
    let query = supabase
      .from('exams')
      .select('*')
      .order('created_at', { ascending: false });

    if (className) {
      query = query.eq('class', className);
    }

    if (subject) {
      query = query.eq('subject', subject);
    }

    const { data: exams, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch exams: ${error.message}`);
    }

    // Get stats for each exam
    const examsWithStats = await Promise.all(
      (exams || []).map(async (exam) => {
        const stats = await this.getExamStats(exam.id);
        return {
          ...exam,
          avg_marks: stats.avg_marks,
          num_students: stats.num_students
        };
      })
    );

    return examsWithStats;
  },

  async getExamById(id: string): Promise<Exam | null> {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch exam: ${error.message}`);
    }

    return data;
  },

  async createExam(examData: CreateExamData): Promise<Exam> {
    const { data, error } = await supabase
      .from('exams')
      .insert([examData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create exam: ${error.message}`);
    }

    return data;
  },

  async updateExam(id: string, updates: Partial<Exam>): Promise<Exam> {
    const { data, error } = await supabase
      .from('exams')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update exam: ${error.message}`);
    }

    return data;
  },

  async deleteExam(id: string): Promise<void> {
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete exam: ${error.message}`);
    }
  },

  async getExamDetails(examId: string): Promise<ExamDetailsData> {
    // Get exam details
    const exam = await this.getExamById(examId);
    if (!exam) {
      throw new Error('Exam not found');
    }

    // Get all students in the exam's class
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, class')
      .eq('class', exam.class)
      .order('name', { ascending: true });

    if (studentsError) {
      throw new Error(`Failed to fetch students: ${studentsError.message}`);
    }

    // Get existing marks for this exam
    const { data: existingMarks, error: marksError } = await supabase
      .from('exam_marks')
      .select('*')
      .eq('exam_id', examId);

    if (marksError) {
      throw new Error(`Failed to fetch exam marks: ${marksError.message}`);
    }

    // Create a map of existing marks
    const marksMap = new Map();
    (existingMarks || []).forEach(mark => {
      marksMap.set(mark.student_id, mark);
    });

    // Combine students with their marks
    const marks: ExamMarkWithStudent[] = (students || []).map(student => {
      const existingMark = marksMap.get(student.id);
      return {
        id: existingMark?.id || '',
        exam_id: examId,
        student_id: student.id,
        student_name: student.name,
        student_class: student.class,
        marks_obtained: existingMark?.marks_obtained || 0,
        is_absent: existingMark?.is_absent || false,
        created_at: existingMark?.created_at || '',
        updated_at: existingMark?.updated_at || ''
      };
    });

    return { exam, marks };
  },

  async saveExamMarks(examId: string, marks: Array<{ student_id: string; marks_obtained: number; is_absent: boolean }>): Promise<void> {
    const marksToSave = marks.map(mark => ({
      exam_id: examId,
      student_id: mark.student_id,
      marks_obtained: mark.is_absent ? -1 : mark.marks_obtained,
      is_absent: mark.is_absent
    }));

    const { error } = await supabase
      .from('exam_marks')
      .upsert(marksToSave, {
        onConflict: 'exam_id,student_id'
      });

    if (error) {
      throw new Error(`Failed to save exam marks: ${error.message}`);
    }
  },

  async getExamStats(examId: string): Promise<{ avg_marks: number; num_students: number }> {
    const { data, error } = await supabase
      .from('exam_marks')
      .select('marks_obtained, is_absent')
      .eq('exam_id', examId)
      .eq('is_absent', false); // Only include non-absent students in stats

    if (error) {
      throw new Error(`Failed to fetch exam stats: ${error.message}`);
    }

    const marks = data || [];
    const num_students = marks.length;
    const avg_marks = num_students > 0 
      ? marks.reduce((sum, mark) => sum + mark.marks_obtained, 0) / num_students 
      : 0;

    return {
      avg_marks: Math.round(avg_marks * 10) / 10,
      num_students
    };
  },

  async getAvailableClasses(): Promise<string[]> {
    const { data, error } = await supabase
      .from('students')
      .select('class')
      .order('class');

    if (error) {
      throw new Error(`Failed to fetch classes: ${error.message}`);
    }

    const uniqueClasses = [...new Set(data?.map(student => student.class) || [])];
    return uniqueClasses;
  },

  async getAvailableSubjects(): Promise<string[]> {
    return ['Mathematics', 'Science', 'English', 'Social Science', 'Computer Science', 'Physics', 'Chemistry', 'Biology'];
  }
};