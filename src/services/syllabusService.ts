import { supabase } from '../lib/supabase';
import { SyllabusChapter, CreateSyllabusChapterData, UpdateSyllabusChapterData, SyllabusProgress } from '../types/syllabus';

export const syllabusService = {
  async getSyllabusByClassAndSubject(className: string, subject: string): Promise<SyllabusChapter[]> {
    const { data, error } = await supabase
      .from('syllabus_tracking')
      .select('*')
      .eq('class', className)
      .eq('subject', subject)
      .order('chapter_name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch syllabus chapters: ${error.message}`);
    }

    return data || [];
  },

  async getAllSyllabusByClass(className: string): Promise<SyllabusChapter[]> {
    const { data, error } = await supabase
      .from('syllabus_tracking')
      .select('*')
      .eq('class', className)
      .order('subject', { ascending: true })
      .order('chapter_name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch syllabus chapters: ${error.message}`);
    }

    return data || [];
  },

  async createSyllabusChapter(data: CreateSyllabusChapterData): Promise<SyllabusChapter> {
    const { data: result, error } = await supabase
      .from('syllabus_tracking')
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create syllabus chapter: ${error.message}`);
    }

    return result;
  },

  async updateSyllabusChapter(id: string, updates: UpdateSyllabusChapterData): Promise<SyllabusChapter> {
    const { data, error } = await supabase
      .from('syllabus_tracking')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update syllabus chapter: ${error.message}`);
    }

    return data;
  },

  async deleteSyllabusChapter(id: string): Promise<void> {
    const { error } = await supabase
      .from('syllabus_tracking')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete syllabus chapter: ${error.message}`);
    }
  },

  async calculateSyllabusProgress(className: string, subject: string): Promise<SyllabusProgress> {
    const chapters = await this.getSyllabusByClassAndSubject(className, subject);
    
    const totalChapters = chapters.length;
    const completedChapters = chapters.filter(chapter => 
      chapter.physical_class_conducted &&
      chapter.chapter_end_test_status &&
      chapter.notes_distribution_status === 'Distributed' &&
      chapter.revision_status
    ).length;

    const progressPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

    return {
      class: className,
      subject,
      totalChapters,
      completedChapters,
      progressPercentage
    };
  },

  async calculateOverallSyllabusProgress(className: string): Promise<number> {
    const subjects = await this.getAvailableSubjects(className);
    
    if (subjects.length === 0) return 0;

    let totalProgress = 0;
    for (const subject of subjects) {
      const progress = await this.calculateSyllabusProgress(className, subject);
      totalProgress += progress.progressPercentage;
    }

    return Math.round(totalProgress / subjects.length);
  },

  async getAvailableSubjects(className?: string): Promise<string[]> {
    let query = supabase
      .from('syllabus_tracking')
      .select('subject');

    if (className) {
      query = query.eq('class', className);
    }

    const { data, error } = await query.order('subject');

    if (error) {
      throw new Error(`Failed to fetch subjects: ${error.message}`);
    }

    // Get unique subjects
    const uniqueSubjects = [...new Set(data?.map(item => item.subject) || [])];
    return uniqueSubjects;
  },

  async getAvailableClasses(): Promise<string[]> {
    const { data, error } = await supabase
      .from('syllabus_tracking')
      .select('class')
      .order('class');

    if (error) {
      throw new Error(`Failed to fetch classes: ${error.message}`);
    }

    // Get unique classes
    const uniqueClasses = [...new Set(data?.map(item => item.class) || [])];
    return uniqueClasses;
  }
};