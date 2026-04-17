import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Database } from '@/lib/supabase/database.types'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Create or update user profile
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if user exists in our users table
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!existingUser) {
          // Create new user profile
          await supabase.from('users').insert({
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.full_name || user.email!.split('@')[0],
            role: 'volunteer',
          } satisfies Database['public']['Tables']['users']['Insert'])
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
