import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wyykmvknyaaettjtjqpt.supabase.co'
const supabaseKey = 'sb_publishable_9Ve6aWu4jTxGHTTPqJvosw_Z73Ea6An'

export const supabase = createClient(supabaseUrl, supabaseKey)