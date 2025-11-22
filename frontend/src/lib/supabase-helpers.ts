import { supabase } from './supabase';
import type { Database } from './supabase';

/**
 * Typed helper functions for Supabase operations
 * Replace 'table_name' with your actual table names
 */

// Example typed query helper
export async function getTableData<T extends keyof Database['public']['Tables']>(
  tableName: T
) {
  const { data, error } = await supabase.from(tableName).select('*');
  
  if (error) {
    throw error;
  }
  
  return data;
}

// Example typed insert helper
export async function insertTableData<
  T extends keyof Database['public']['Tables']
>(
  tableName: T,
  data: Database['public']['Tables'][T]['Insert']
) {
  const { data: result, error } = await supabase
    .from(tableName)
    .insert(data)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return result;
}

// Example typed update helper
export async function updateTableData<
  T extends keyof Database['public']['Tables']
>(
  tableName: T,
  id: string,
  updates: Database['public']['Tables'][T]['Update']
) {
  const { data, error } = await supabase
    .from(tableName)
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
}

// Example typed delete helper
export async function deleteTableData<
  T extends keyof Database['public']['Tables']
>(tableName: T, id: string) {
  const { error } = await supabase.from(tableName).delete().eq('id', id);
  
  if (error) {
    throw error;
  }
}

