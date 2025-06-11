import { supabase } from '../lib/supabase';
import { AppUser, CreateUserData, UpdateUserData } from '../types/user';

export const userService = {
  async getAllUsers(): Promise<AppUser[]> {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return data || [];
  },

  async getUserById(id: string): Promise<AppUser | null> {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    return data;
  },

  async createUser(userData: CreateUserData): Promise<AppUser> {
    try {
      // Create the user using signUp instead of admin.createUser
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            contact_number: userData.contact_number,
            role: userData.role
          }
        }
      });

      if (authError) {
        throw new Error(`Failed to create auth user: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Failed to create user - no user data returned');
      }

      // Create the app_user record manually since we're using signUp
      const { data: appUser, error: appUserError } = await supabase
        .from('app_users')
        .insert([{
          id: authData.user.id,
          full_name: userData.full_name,
          email: userData.email,
          contact_number: userData.contact_number,
          role: userData.role
        }])
        .select()
        .single();

      if (appUserError) {
        // If app_user creation fails, clean up the auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error(`Failed to create app user: ${appUserError.message}`);
      }

      return appUser;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create user');
    }
  },

  async updateUser(id: string, updates: UpdateUserData): Promise<AppUser> {
    const { data, error } = await supabase
      .from('app_users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return data;
  },

  async deleteUser(id: string): Promise<void> {
    try {
      // First delete from app_users table
      const { error: appUserError } = await supabase
        .from('app_users')
        .delete()
        .eq('id', id);

      if (appUserError) {
        throw new Error(`Failed to delete app user: ${appUserError.message}`);
      }

      // Then delete from auth.users (this will cascade delete related records)
      const { error: authError } = await supabase.auth.admin.deleteUser(id);

      if (authError) {
        console.warn('Failed to delete auth user:', authError.message);
        // Don't throw here as the app_user is already deleted
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete user');
    }
  },

  async searchUsers(searchTerm: string): Promise<AppUser[]> {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to search users: ${error.message}`);
    }

    return data || [];
  }
};