import { createClient } from '@supabase/supabase-js';

// ค่า 2 ตัวนี้เอามาจาก Supabase -> Project Settings -> API
const supabaseUrl = 'https://fusfddvfjhdfbbnznofg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1c2ZkZHZmamhkZmJibnpub2ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NjI3MzgsImV4cCI6MjA4OTQzODczOH0.rRoPT605NLwkoCjbrs-to8EFJNPc2Jkq1Es5UtLz5uk';

export const supabase = createClient(supabaseUrl, supabaseKey);