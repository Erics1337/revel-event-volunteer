import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/lib/supabase/database.types'
import { type EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const { searchParams } = requestUrl
  const host = request.headers.get('host') ?? request.headers.get('x-forwarded-host') ?? requestUrl.host
  const protocol = request.headers.get('x-forwarded-proto') ?? requestUrl.protocol.replace(':', '')
  const origin = `${protocol}://${host}`
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const nextParam = searchParams.get('next') ?? '/'
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/'

  if (!code && !(tokenHash && type)) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  // Attach session cookies directly to the redirect response so the browser
  // receives the Set-Cookie headers alongside the redirect. Relying on
  // cookies().set() in route handlers is unreliable when returning a separate
  // NextResponse.redirect(), which manifests as "signed in only after a second
  // navigation" symptoms.
  const response = NextResponse.redirect(`${origin}${next}`)
  const cookieStore = await cookies()

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { data, error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({
        token_hash: tokenHash!,
        type: type!,
      })

  if (error) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  if (data.session) {
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })
  }

  // Create user profile on first sign-in.
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const authUser = user ?? data.user

  if (authUser) {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', authUser.id)
      .single()

    if (!existingUser) {
      await supabase.from('users').insert({
        id: authUser.id,
        email: authUser.email!,
        name: '',
        role: 'volunteer',
      } satisfies Database['public']['Tables']['users']['Insert'])
    }
  }

  return response
}
