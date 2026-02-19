
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rxaqgfigbfhryaruahif.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_doM48r4xn6OeQeErpPXUAw_mWzIP0jh';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
