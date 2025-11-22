import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for Supabase tables
// Add your table types here as you create them in Supabase
export type Database = {
  public: {
    Tables: {
      // Example: Add your table types here
      // students: {
      //   Row: {
      //     id: string;
      //     name: string;
      //     email: string;
      //     created_at: string;
      //   };
      //   Insert: {
      //     id?: string;
      //     name: string;
      //     email: string;
      //     created_at?: string;
      //   };
      //   Update: {
      //     id?: string;
      //     name?: string;
      //     email?: string;
      //     created_at?: string;
      //   };
      // };
    };
  };
};

// Typed Supabase client helper
export type TypedSupabaseClient = ReturnType<typeof createClient<Database>>;

