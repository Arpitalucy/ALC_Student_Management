export interface Event {
  id: string;
  title: string;
  description?: string;
  event_type: 'PTM' | 'Exam' | 'Holiday' | 'Meeting' | 'Workshop' | 'Sports' | 'Cultural' | 'Other';
  event_date: string;
  event_time: string;
  reminder: 'On time' | '15 minutes before' | '30 minutes before' | '1 hour before' | '1 day before';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEventData {
  title: string;
  description?: string;
  event_type: 'PTM' | 'Exam' | 'Holiday' | 'Meeting' | 'Workshop' | 'Sports' | 'Cultural' | 'Other';
  event_date: string;
  event_time: string;
  reminder: 'On time' | '15 minutes before' | '30 minutes before' | '1 hour before' | '1 day before';
}