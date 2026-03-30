import { createClient } from '@supabase/supabase-js';

// สั่งให้ดึงค่าความลับมาจากไฟล์ .env
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);