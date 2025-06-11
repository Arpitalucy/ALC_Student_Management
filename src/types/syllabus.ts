export interface SyllabusChapter {
  id: string;
  class: string;
  subject: string;
  chapter_name: string;
  physical_class_conducted: boolean;
  chapter_end_test_status: boolean;
  notes_distribution_status: 'Distributed' | 'Undistributed';
  revision_status: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSyllabusChapterData {
  class: string;
  subject: string;
  chapter_name: string;
  physical_class_conducted?: boolean;
  chapter_end_test_status?: boolean;
  notes_distribution_status?: 'Distributed' | 'Undistributed';
  revision_status?: boolean;
}

export interface UpdateSyllabusChapterData {
  chapter_name?: string;
  physical_class_conducted?: boolean;
  chapter_end_test_status?: boolean;
  notes_distribution_status?: 'Distributed' | 'Undistributed';
  revision_status?: boolean;
}

export interface SyllabusProgress {
  class: string;
  subject: string;
  totalChapters: number;
  completedChapters: number;
  progressPercentage: number;
}