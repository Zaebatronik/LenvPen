import { createClient } from '@supabase/supabase-js';

// Используем переменные окружения с фоллбэком на хардкод для production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ypgjlfsoqsejroewzuer.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwZ2psZnNvcXNlanJvZXd6dWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzM3OTAsImV4cCI6MjA4MDAwOTc5MH0.DZH93TwFhLvy12LQr7ydQEK7vMBpoAV4dmIKhmp-utw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
