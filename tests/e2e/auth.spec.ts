import { expect, type Page, test } from '@playwright/test'
import { clearCapturedEmails, waitForMagicLink } from './helpers/mail'
import { waitForUserProfile } from './helpers/supabase-admin'

function uniqueEmail(prefix = 'auth-e2e') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`
}

async function expectPath(page: Page, pathname: string, search = '') {
  await expect.poll(() => {
    const url = new URL(page.url())
    return `${url.pathname}${url.search}`
  }).toBe(`${pathname}${search}`)
}

async function requestMagicLinkFromModal(page: Page, email: string) {
  await page.getByLabel('Email address').fill(email)
  await page.getByRole('button', { name: 'Send magic link' }).click()
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible()
}

async function signInViaMagicLink(page: Page, email: string, baseURL: string) {
  await clearCapturedEmails(email)
  await requestMagicLinkFromModal(page, email)
  const magicLink = await waitForMagicLink(email, baseURL)
  await page.goto(magicLink)
  return magicLink
}

test.describe('magic-link auth regressions', () => {
  test('homepage sign-in modal sends a token-hash magic link and creates a profile', async ({ page, baseURL }) => {
    const email = uniqueEmail()

    await page.goto('/')
    await expect(page.getByText('Loading the crew...')).toBeHidden()
    await page.getByRole('button', { name: 'Sign In / Sign Up' }).click()
    await expect(page.getByRole('dialog', { name: 'Sign In / Sign Up' })).toBeVisible()

    const magicLink = await signInViaMagicLink(page, email, baseURL!)

    expect(magicLink).toContain('/auth/callback?')
    expect(magicLink).toContain('token_hash=')
    expect(magicLink).toContain('type=email')
    await expectPath(page, '/')

    const profile = await waitForUserProfile(email)
    expect(profile.email).toBe(email)
    expect(profile.role).toBe('volunteer')
  })

  test('open-shifts signed-out signup opens the modal and returns to open shifts after auth', async ({ page, baseURL }) => {
    const email = uniqueEmail('open-shifts-e2e')

    await page.goto('/open-shifts')
    await page.getByRole('button', { name: 'Sign up' }).first().click()
    await expect(page.getByRole('dialog', { name: 'Sign In / Sign Up' })).toBeVisible()

    await signInViaMagicLink(page, email, baseURL!)

    await expectPath(page, '/open-shifts')
    await expect((await waitForUserProfile(email)).email).toBe(email)
  })

  test('volunteer setup modal blocks incomplete users and completing it allows requesting a shift', async ({
    page,
    baseURL,
  }) => {
    const email = uniqueEmail('setup-e2e')

    await page.goto('/open-shifts')
    await page.getByRole('button', { name: 'Sign up' }).first().click()
    await signInViaMagicLink(page, email, baseURL!)

    const profile = await waitForUserProfile(email)
    expect(profile.phone).toBeNull()

    const setupDialog = page.getByRole('dialog', { name: 'Complete your profile' })
    await expect(setupDialog).toBeVisible()
    await setupDialog.getByLabel('Full name').fill('E2E Volunteer')
    await setupDialog.getByLabel('Phone number').fill('555-123-4567')
    await setupDialog.getByRole('button', { name: 'Save and continue' }).click()
    await expect(page.getByRole('heading', { name: /Thanks, you.re all set/ })).toBeVisible()
    await page.getByRole('button', { name: 'Browse open shifts' }).click()
    await expect(setupDialog).toBeHidden()

    await page.getByRole('button', { name: 'Sign up' }).first().click()
    await expect(page.getByText('Confirm Sign-Up')).toBeVisible()
    await page.getByRole('button', { name: 'Yes, sign me up' }).click()
    await expect(page.getByText('Signup Confirmed')).toBeVisible()
  })

  test('callback rejects missing, unsafe, and reused magic-link inputs', async ({ page, baseURL }) => {
    await page.goto('/auth/callback')
    await expectPath(page, '/auth/auth-code-error')
    await expect(page.getByRole('heading', { name: 'Authentication Error' })).toBeVisible()

    const unsafeEmail = uniqueEmail('unsafe-e2e')
    await page.goto('/')
    await page.getByRole('button', { name: 'Sign In / Sign Up' }).click()
    await clearCapturedEmails(unsafeEmail)
    await requestMagicLinkFromModal(page, unsafeEmail)
    const freshUnsafeLink = new URL(await waitForMagicLink(unsafeEmail, baseURL!))
    freshUnsafeLink.searchParams.set('next', 'https://evil.example/path')
    await page.goto(freshUnsafeLink.toString())
    await expectPath(page, '/')
    await expect(waitForUserProfile(unsafeEmail)).resolves.toMatchObject({ email: unsafeEmail })

    await page.goto(freshUnsafeLink.toString())
    await expectPath(page, '/auth/auth-code-error')
  })

  test('protected routes remain protected for signed-out and volunteer users', async ({ page, baseURL }) => {
    const email = uniqueEmail('protected-e2e')

    await page.goto('/schedule')
    await expectPath(page, '/auth/login', '?redirectTo=%2Fschedule')

    await page.goto('/profile')
    await expectPath(page, '/auth/login', '?redirectTo=%2Fprofile')

    await page.goto('/')
    await page.getByRole('button', { name: 'Sign In / Sign Up' }).click()
    await signInViaMagicLink(page, email, baseURL!)
    await expect(waitForUserProfile(email)).resolves.toMatchObject({ email })

    await page.goto('/admin')
    await expectPath(page, '/open-shifts')
  })
})
