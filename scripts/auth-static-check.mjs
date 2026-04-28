import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

const templatePaths = [
  'supabase/templates/magic_link.html',
  'supabase/templates/confirm_signup.html',
]

const failures = []

for (const relativePath of templatePaths) {
  const contents = readFileSync(join(root, relativePath), 'utf8')

  if (contents.includes('{{ .ConfirmationURL }}')) {
    failures.push(`${relativePath} must not use {{ .ConfirmationURL }} for SSR/PKCE magic links.`)
  }

  for (const required of ['{{ .RedirectTo }}', '{{ .TokenHash }}', 'type=email']) {
    if (!contents.includes(required)) {
      failures.push(`${relativePath} is missing ${required}.`)
    }
  }
}

const authContext = readFileSync(join(root, 'src/contexts/auth-context.tsx'), 'utf8')

if (!authContext.includes('signInWithOtp')) {
  failures.push('src/contexts/auth-context.tsx no longer calls signInWithOtp.')
}

if (!authContext.includes('/auth/callback?next=')) {
  failures.push('signInWithMagicLink must redirect email links through /auth/callback?next=...')
}

if (!authContext.includes('encodeURIComponent(nextPath)')) {
  failures.push('signInWithMagicLink must encode the next path in the callback URL.')
}

if (failures.length > 0) {
  console.error('Auth static regression check failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('Auth static regression check passed.')
