import { createClient } from '@supabase/supabase-js';

// Using environment variables directly
const supabaseUrl = 'https://tgmkvjpzvkqdnqdipipu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbWt2anB6dmtxZG5xZGlwaXB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5MzA4OTgsImV4cCI6MjA1ODUwNjg5OH0.iQ9re7DM1B2wQXMfOhK7U-eAxXJt_hRmqV8FH-Q49Pc';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});