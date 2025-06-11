export interface AppUser {
  id: string;
  full_name: string;
  email: string;
  contact_number: string;
  role: 'admin' | 'teacher';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  full_name: string;
  email: string;
  contact_number: string;
  password: string;
  role: 'admin' | 'teacher';
}

export interface UpdateUserData {
  full_name: string;
  email: string;
  contact_number: string;
  role: 'admin' | 'teacher';
  is_active: boolean;
}