import { supabase } from '../lib/supabase';
import { FeeRecord, FeeRecordWithStudent, MonthlyFeeStats } from '../types/fee';

export const feeService = {
  async getFeeRecordsByMonth(month: string, className?: string): Promise<FeeRecordWithStudent[]> {
    let query = supabase
      .from('fee_records')
      .select(`
        *,
        students!inner(name, class, email)
      `)
      .eq('month', month)
      .order('students(name)', { ascending: true });

    if (className) {
      query = query.eq('students.class', className);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch fee records: ${error.message}`);
    }

    return (data || []).map(record => ({
      ...record,
      student_name: record.students.name,
      student_class: record.students.class,
      student_email: record.students.email
    }));
  },

  async createFeeRecordsForMonth(month: string, year: number, monthName: string): Promise<void> {
    // Get all students
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, fee_amount');

    if (studentsError) {
      throw new Error(`Failed to fetch students: ${studentsError.message}`);
    }

    if (!students || students.length === 0) {
      return;
    }

    // Create fee records for all students for this month
    const feeRecords = students.map(student => ({
      student_id: student.id,
      month: month,
      year: year,
      month_name: monthName,
      amount: student.fee_amount,
      status: 'not started' as const,
      due_date: `${year}-${month.split('-')[1]}-15` // Due on 15th of each month
    }));

    const { error } = await supabase
      .from('fee_records')
      .upsert(feeRecords, {
        onConflict: 'student_id,month'
      });

    if (error) {
      throw new Error(`Failed to create fee records: ${error.message}`);
    }
  },

  async updateFeeRecordStatus(
    studentId: string, 
    month: string, 
    status: 'paid' | 'pending' | 'overdue' | 'not started'
  ): Promise<void> {
    const updateData: any = { status };
    
    // If marking as paid, set paid_date
    if (status === 'paid') {
      updateData.paid_date = new Date().toISOString().split('T')[0];
    } else {
      updateData.paid_date = null;
    }

    const { error } = await supabase
      .from('fee_records')
      .update(updateData)
      .eq('student_id', studentId)
      .eq('month', month);

    if (error) {
      throw new Error(`Failed to update fee record: ${error.message}`);
    }

    // Also update the student's overall fee_status based on current month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    if (month === currentMonth) {
      await supabase
        .from('students')
        .update({ fee_status: status })
        .eq('id', studentId);
    }
  },

  async getMonthlyFeeStats(month: string, className?: string): Promise<MonthlyFeeStats> {
    let query = supabase
      .from('fee_records')
      .select(`
        *,
        students!inner(class)
      `)
      .eq('month', month);

    if (className) {
      query = query.eq('students.class', className);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch fee stats: ${error.message}`);
    }

    const records = data || [];
    const totalStudents = records.length;
    const paidCount = records.filter(r => r.status === 'paid').length;
    const pendingCount = records.filter(r => r.status === 'pending').length;
    const overdueCount = records.filter(r => r.status === 'overdue').length;
    const notStartedCount = records.filter(r => r.status === 'not started').length;

    const paidPercentage = totalStudents > 0 ? (paidCount / totalStudents) * 100 : 0;
    const pendingPercentage = totalStudents > 0 ? (pendingCount / totalStudents) * 100 : 0;

    const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);
    const collectedAmount = records
      .filter(r => r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0);

    return {
      totalStudents,
      paidCount,
      pendingCount,
      overdueCount,
      notStartedCount,
      paidPercentage: Math.round(paidPercentage * 10) / 10,
      pendingPercentage: Math.round(pendingPercentage * 10) / 10,
      totalAmount,
      collectedAmount
    };
  },

  async getAvailableMonths(): Promise<Array<{ value: string; label: string }>> {
    const { data, error } = await supabase
      .from('fee_records')
      .select('month, month_name, year')
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch available months: ${error.message}`);
    }

    // Get unique months
    const uniqueMonths = new Map();
    (data || []).forEach(record => {
      if (!uniqueMonths.has(record.month)) {
        uniqueMonths.set(record.month, {
          value: record.month,
          label: `${record.month_name} ${record.year}`
        });
      }
    });

    return Array.from(uniqueMonths.values());
  },

  async ensureCurrentMonthRecords(): Promise<void> {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM format
    const year = now.getFullYear();
    const monthName = now.toLocaleDateString('en-US', { month: 'long' });

    await this.createFeeRecordsForMonth(currentMonth, year, monthName);
  }
};