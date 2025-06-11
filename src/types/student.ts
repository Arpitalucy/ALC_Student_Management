export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  class: string;
  attendance: number;
  fee_status: 'paid' | 'pending' | 'overdue' | 'not started';
  fee_amount: number;
  enrollment_date: string;
  created_at: string;
  updated_at: string;
}

export interface CreateStudentData {
  name: string;
  email: string;
  phone: string;
  address?: string;
  class: string;
  fee_amount: number;
  enrollment_date: string;
}