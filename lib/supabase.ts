import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vmrsankkrkzvsyniepoa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtcnNhbmtrcmt6dnN5bmllcG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MjU2MzEsImV4cCI6MjA4NjIwMTYzMX0.wyjAXHAYlqTGupUiIVPGy2MBPJ8WXD3GRsV5AuQnkGM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
