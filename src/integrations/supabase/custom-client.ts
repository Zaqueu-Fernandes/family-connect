import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://tuddxnujcluwsuxifnfq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1ZGR4bnVqY2x1d3N1eGlmbmZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzI3MDksImV4cCI6MjA4Njg0ODcwOX0.65tPR7C1ymuggQutDzap3Ck1yc0Zy_k0p6bUicJgOnU";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
