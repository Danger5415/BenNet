import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tgmkvjpzvkqdnqdipipu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbWt2anB6dmtxZG5xZGlwaXB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5MzA4OTgsImV4cCI6MjA1ODUwNjg5OH0.iQ9re7DM1B2wQXMfOhK7U-eAxXJt_hRmqV8FH-Q49Pc';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  storage: {
    retryAttempts: 3,
    retryInterval: 500
  }
});

// Create storage bucket if it doesn't exist
(async () => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.name === 'images')) {
      await supabase.storage.createBucket('images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      });
    }
  } catch (error) {
    console.error('Error creating storage bucket:', error);
  }
})();