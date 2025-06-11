export interface FeeRecord {
  id: string;
  student_id: string;
  month: string; // Format: 'YYYY-MM'
  year: number;
  month_name: string; // e.g., 'January', 'February'
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'not started';
  due_date: string;
  paid_date?: string;
  created_at: string;
  updated_at: string;
}

export interface FeeRecordWithStudent extends FeeRecord {
  student_name: string;
  student_class: string;
  student_email: string;
}

export interface MonthlyFeeStats {
  totalStudents: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  notStartedCount: number;
  paidPercentage: number;
  pendingPercentage: number;
  totalAmount: number;
  collectedAmount: number;
}