'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { isAdmin } from '@/lib/auth/roles'
import bswHeroImage from '../../public/bsw-img-1.png'
import bswTeamImage from '../../public/bsw-img-2.png'
import bswWayfindingImage from '../../public/bsw-img-3.png'
import bswMerchImage from '../../public/bsw-img-4.png'
import bswLogo from '../../public/bsw-logo-BUCTZ2oQ.png'

const BRAND_GRADIENT = 'linear-gradient(135deg, #2B8A8F 0%, #F5A623 60%, #F58220 100%)'

const WHY_VOLUNTEER = [
  {
    title: 'Meet the people building Boulder',
    description:
      'Founders, operators, creatives, and community organizers all show up here. Volunteering puts you in the middle of it.',
  },
  {
    title: 'Choose shifts that fit real life',
    description:
      'Pick the slots that work for your week instead of getting locked into some all-or-nothing commitment.',
  },
  {
    title: 'Help run the week from the inside',
    description:
      'Room support, check-in, wayfinding, logistics. You are not extra. You are how the event works.',
  },
  {
    title: 'Keep it community-owned',
    description:
      'This platform exists because the community got tired of mediocre software and built something better.',
  },
] as const

const HOW_IT_WORKS = [
  'Sign in and set up your volunteer profile.',
  'Choose the shifts, venues, and days that actually fit your schedule.',
  'Show up with the team, help attendees, and keep the week moving.',
] as const

const IMPACT_STATS = [
  { value: '450+', label: 'Volunteer shifts across the week' },
  { value: '4,000+', label: 'Attendees depending on the crew' },
  { value: '20+', label: 'Venues, rooms, and moving parts' },
] as const

const PUBLIC_NAV_LINKS = [
  { href: '#why-volunteer', label: 'Why Volunteer' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '/open-shifts', label: 'Open Shifts' },
] as const

const AUTH_NAV_LINKS = [
  { href: '/schedule', label: 'My Schedule' },
  { href: '/profile', label: 'Profile' },
] as const

export default function Home() {
  const { user, profile, loading, signOut } = useAuth()
  const primaryCta = user
    ? { href: '/open-shifts', label: 'Browse Open Shifts' }
    : { href: '/auth/login', label: 'Get Started' }
  const secondaryCta = user
    ? { href: '/schedule', label: 'My Schedule' }
    : { href: '/open-shifts', label: 'See Open Shifts' }

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/auth/login'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-text">Loading the crew...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-charcoal">
      <main>
        <section
          className="relative overflow-hidden"
          style={{ background: BRAND_GRADIENT }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(51,51,51,0.14),transparent_30%)]" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent via-[#f5f5f5]/22 to-[#f5f5f5]" />

          <div className="relative mx-auto flex max-w-7xl flex-col px-4 pb-24 pt-5 sm:px-6 lg:px-8">
            <header className="mb-10 rounded-[28px] border border-white/45 bg-white/86 px-5 py-4 shadow-[0_14px_40px_rgba(0,0,0,0.08)] backdrop-blur md:px-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <Link href="/" className="flex items-center">
                  <Image
                    src={bswLogo}
                    alt="Boulder Startup Week"
                    className="h-auto w-[190px] sm:w-[230px]"
                    priority
                  />
                </Link>

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-end lg:gap-5">
                  <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-charcoal/78 lg:justify-end">
                    {PUBLIC_NAV_LINKS.map((link) => (
                      <Link key={link.href} href={link.href} className="transition hover:text-teal">
                        {link.label}
                      </Link>
                    ))}
                    {user && (
                      <>
                        {AUTH_NAV_LINKS.map((link) => (
                          <Link key={link.href} href={link.href} className="transition hover:text-teal">
                            {link.label}
                          </Link>
                        ))}
                        {isAdmin(profile?.role) && (
                          <Link href="/admin/volunteers" className="transition hover:text-teal">
                            Admin
                          </Link>
                        )}
                        <button
                          onClick={handleSignOut}
                          className="cursor-pointer text-left transition hover:text-teal"
                        >
                          Sign Out
                        </button>
                      </>
                    )}
                  </nav>

                  {!user && (
                    <Link
                      href="/auth/login"
                      className="btn-primary inline-flex items-center justify-center whitespace-nowrap"
                    >
                      Sign In / Sign Up
                    </Link>
                  )}
                </div>
              </div>
            </header>

            <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8">
              <div className="animate-hero-reveal max-w-2xl">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/14 px-4 py-2 text-sm font-medium text-white/95 backdrop-blur">
                  <span className="text-lg leading-none text-[#FFD700]">✦</span>
                  <span>17th Annual Event · Volunteer Crew 2026</span>
                </div>

                <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-white/78">
                  Community-built. Community-owned. No BS.
                </p>
                <h1
                  className="max-w-3xl text-5xl font-bold tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl"
                  style={{ fontFamily: 'var(--font-accent)' }}
                >
                  Build Boulder Startup Week from the inside.
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-8 text-white/90 sm:text-xl">
                  Find your people. Build your week. Pick up the shifts that keep Boulder Startup
                  Week moving and get closer to the community that makes it real.
                </p>

                <div className="mt-7 flex flex-wrap gap-3 text-sm font-semibold text-white/95">
                  <div className="rounded-full border border-white/24 bg-white/12 px-4 py-2 backdrop-blur">
                    May 4–8, 2026
                  </div>
                  <div className="rounded-full border border-white/24 bg-white/12 px-4 py-2 backdrop-blur">
                    Downtown Boulder, CO
                  </div>
                  <div className="rounded-full border border-white/24 bg-white/12 px-4 py-2 backdrop-blur">
                    Open-source volunteer platform
                  </div>
                </div>

                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                  <Link href={primaryCta.href} className="btn-primary inline-flex items-center justify-center">
                    {primaryCta.label}
                  </Link>
                  <Link
                    href={secondaryCta.href}
                    className="btn-secondary inline-flex items-center justify-center border-white text-white hover:border-teal"
                  >
                    {secondaryCta.label}
                  </Link>
                </div>

                <div className="mt-10 grid gap-4 border-t border-white/22 pt-7 text-white sm:grid-cols-3">
                  {IMPACT_STATS.map((stat) => (
                    <div key={stat.label}>
                      <p className="text-4xl font-bold tracking-[-0.04em]">{stat.value}</p>
                      <p className="mt-2 text-sm leading-6 text-white/80">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative flex min-h-[35rem] items-end justify-center lg:min-h-[44rem]">
                <div className="absolute left-[6%] top-[9%] hidden w-36 rounded-[26px] border border-white/60 bg-white/92 p-4 shadow-[0_18px_45px_rgba(0,0,0,0.14)] xl:block">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">
                    About the vibe
                  </p>
                  <p className="mt-3 text-base font-semibold text-charcoal">
                    The first. The real. The Boulder way.
                  </p>
                </div>

                <div className="absolute bottom-[8%] right-[4%] hidden max-w-[15rem] rounded-[26px] border border-black/8 bg-[#fff4e6] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.14)] lg:block">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange">
                    Volunteer line
                  </p>
                  <p className="mt-3 text-base font-semibold text-charcoal">
                    Show up, help people, keep the week humming.
                  </p>
                </div>

                <div className="absolute inset-x-12 bottom-4 h-24 rounded-full bg-black/20 blur-3xl" />
                <Image
                  src={bswHeroImage}
                  alt="Boulder Startup Week volunteers welcoming attendees at check-in"
                  className="animate-hero-float relative z-10 h-auto w-full max-w-[38rem] object-contain drop-shadow-[0_28px_45px_rgba(0,0,0,0.22)]"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        <section
          id="why-volunteer"
          className="relative overflow-hidden bg-[#f5f5f5] py-20 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
              <div>
                <p className="badge-featured">Why volunteer</p>
                <h2
                  className="mt-5 max-w-lg text-4xl font-bold tracking-[-0.03em] text-charcoal sm:text-5xl"
                  style={{ fontFamily: 'var(--font-accent)' }}
                >
                  Not busywork. Real roles. Real people.
                </h2>
                <p className="mt-5 max-w-xl text-lg leading-8 text-gray-text">
                  We are not building a country-club experience. We are building the neighborhood
                  bar version of startup week: useful, welcoming, and run by people who actually
                  care.
                </p>

                <Image
                  src={bswWayfindingImage}
                  alt="Volunteer helping attendees find their way at Boulder Startup Week"
                  className="mt-8 mx-auto h-auto w-full max-w-[24rem] object-contain drop-shadow-[0_22px_30px_rgba(0,0,0,0.12)]"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {WHY_VOLUNTEER.map((item, index) => (
                  <article
                    key={item.title}
                    className="rounded-[26px] border border-black/8 bg-white p-6 shadow-[0_16px_35px_rgba(0,0,0,0.07)]"
                  >
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-teal-light text-sm font-bold text-teal">
                      0{index + 1}
                    </div>
                    <h3 className="text-xl font-semibold text-charcoal">{item.title}</h3>
                    <p className="mt-3 text-base leading-7 text-gray-text">{item.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="badge-default">How it works</p>
                <h2
                  className="mt-5 text-4xl font-bold tracking-[-0.03em] text-charcoal sm:text-5xl"
                  style={{ fontFamily: 'var(--font-accent)' }}
                >
                  Simple on purpose.
                </h2>
                <p className="mt-4 text-lg leading-8 text-gray-text">
                  No maze of forms. No corporate funnel. Set up your profile, grab the work that
                  fits, and help run the week.
                </p>
              </div>

              <Link href="/open-shifts" className="btn-secondary inline-flex items-center justify-center self-start">
                Browse volunteer roles
              </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="grid gap-5">
                {HOW_IT_WORKS.map((step, index) => (
                  <div
                    key={step}
                    className="rounded-[24px] border border-black/8 bg-[#f5f5f5] p-6 shadow-[0_14px_30px_rgba(0,0,0,0.05)]"
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal">
                      Step 0{index + 1}
                    </p>
                    <p className="mt-3 text-xl font-semibold leading-8 text-charcoal">{step}</p>
                  </div>
                ))}
              </div>

              <div
                className="rounded-[32px] border border-black/8 p-6 shadow-[0_18px_42px_rgba(0,0,0,0.08)]"
                style={{ background: BRAND_GRADIENT }}
              >
                <div className="rounded-[24px] border border-white/25 bg-white/10 p-5 backdrop-blur">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/76">
                    What you’ll help power
                  </p>
                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    {IMPACT_STATS.map((stat) => (
                      <div key={stat.label} className="rounded-[22px] bg-white/92 p-4">
                        <p className="text-3xl font-bold tracking-[-0.04em] text-charcoal">
                          {stat.value}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-gray-text">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Image
                  src={bswTeamImage}
                  alt="Boulder Startup Week volunteer team planning around a table"
                  className="mt-6 mx-auto h-auto w-full max-w-[34rem] object-contain drop-shadow-[0_24px_32px_rgba(0,0,0,0.16)]"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f5f5f5] py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 max-w-2xl">
              <p className="badge-featured">Crew energy</p>
              <h2
                className="mt-5 text-4xl font-bold tracking-[-0.03em] text-charcoal sm:text-5xl"
                style={{ fontFamily: 'var(--font-accent)' }}
              >
                The brand shows up in the details.
              </h2>
              <p className="mt-4 text-lg leading-8 text-gray-text">
                Wayfinding, check-in, volunteer kits, the stuff people actually touch. This is the
                work that turns a busy week into a good one.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <Image
                src={bswMerchImage}
                alt="Boulder Startup Week volunteer team planning around a table"
                className="h-auto w-full max-w-[32rem] object-contain drop-shadow-[0_28px_36px_rgba(0,0,0,0.14)]"
              />
              <div className="grid gap-6">
                <div className="rounded-[28px] border border-black/8 bg-[#e8f5f5] p-6 shadow-[0_16px_35px_rgba(0,0,0,0.06)]">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal">
                    Voice check
                  </p>
                  <p className="mt-4 text-2xl font-semibold leading-9 text-charcoal">
                    “We&apos;re done paying for mediocre software. Let&apos;s build something better.”
                  </p>
                </div>
                <div className="rounded-[28px] border border-black/8 bg-white p-6 shadow-[0_16px_35px_rgba(0,0,0,0.06)]">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange">
                    The ask
                  </p>
                  <p className="mt-4 text-lg leading-8 text-gray-text">
                    Save your availability, claim the shifts that fit, and keep your volunteer plan
                    in one place. No fluff. Just the work that matters.
                  </p>
                </div>
                <div className="rounded-[28px] border border-black/8 bg-white p-6 shadow-[0_16px_35px_rgba(0,0,0,0.06)]">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal">
                    Need the details?
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <Link href="/open-shifts" className="btn-primary inline-flex items-center justify-center">
                      Open volunteer portal
                    </Link>
                    <Link href="/schedule" className="btn-secondary inline-flex items-center justify-center">
                      Check your schedule
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div
              className="rounded-[36px] border border-black/10 px-6 py-10 text-center shadow-[0_24px_56px_rgba(0,0,0,0.1)] sm:px-10 sm:py-14"
              style={{ background: BRAND_GRADIENT }}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/78">
                Final call
              </p>
              <h2
                className="mt-4 text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl"
                style={{ fontFamily: 'var(--font-accent)' }}
              >
                Ready to join the rebellion?
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/90">
                We&apos;re done paying for mediocre software. Let&apos;s build something better
                together and make Boulder Startup Week feel like Boulder Startup Week.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <Link href={primaryCta.href} className="btn-primary inline-flex items-center justify-center">
                  {primaryCta.label}
                </Link>
                <Link
                  href={secondaryCta.href}
                  className="btn-secondary inline-flex items-center justify-center border-white text-white hover:border-teal"
                >
                  {secondaryCta.label}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/8 bg-[#f5f5f5]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-gray-text sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>Open source • MIT License • Built by builders, for builders</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/open-shifts" className="transition hover:text-teal">
              Volunteer portal
            </Link>
            <Link href="/schedule" className="transition hover:text-teal">
              My schedule
            </Link>
            {user ? (
              <button onClick={handleSignOut} className="cursor-pointer text-left transition hover:text-teal">
                Sign Out
              </button>
            ) : (
              <Link href="/auth/login" className="transition hover:text-teal">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
