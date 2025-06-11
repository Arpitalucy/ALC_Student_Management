export interface Exam {
  id: string;
  name: string;
  class: string;
  subject: string;
  total_marks: number;
  exam_date: string;
  created_at: string;
  updated_at: string;
}

export interface ExamMark {
  id: string;
  exam_id: string;
  student_id: string;
  marks_obtained: number;
  is_absent: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExamWithStats extends Exam {
  avg_marks: number;
  num_students: number;
}

export interface ExamMarkWithStudent extends ExamMark {
  student_name: string;
  student_class: string;
}

export interface CreateExamData {
  name: string;
  class: string;
  subject: string;
  total_marks: number;
  exam_date: string;
}

export interface ExamDetailsData {
  exam: Exam;
  marks: ExamMarkWithStudent[];
}