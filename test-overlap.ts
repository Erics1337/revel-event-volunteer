import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase
    .from('volunteer_assignments')
    .select('id, shift:volunteer_shifts!inner(id, day, start_time, end_time)')
    .limit(1)
  
  console.log(data, error)
}
test()
