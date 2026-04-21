# BRAND.md — BSW Design System

> The complete visual and voice reference for the Revel/BSW platform. Every UI decision starts here.

---

## Brand DNA

Boulder Startup Week is counter-culture, grassroots, and community-first. This platform is built by the community, for the community. Think punk rock, not country club.

**We are:** The neighborhood bar. Real over perfect. Substance over style.

**We are not:** A polished corporate SaaS product. Luma with better copy. A Michelin star restaurant.

---

## Voice & Tone

### The Rules

- **Direct.** No corporate speak, no jargon, no passive voice.
- **Confident.** We know what we are. Own it.
- **Accessible.** Your neighbor, not your boss.
- **Scrappy.** We build, we iterate, we improve — together.
- **Unpretentious.** Soccer in the backyard.

### ✅ YES — Sound Like This

```
"We're done paying for mediocre software. Let's build something better."
"Community-built, community-owned, community-first."
"Register for 200+ events. Zero corporate BS."
"Find your people. Build your week."
"The first. The real. The Boulder way."
```

### ❌ NO — Never Sound Like This

```
"Leverage our synergistic platform to optimize your event experience."
"Powered by industry-leading technology solutions."
"Premium features for enterprise customers."
"We're excited to announce..."
"Please don't hesitate to reach out."
```

### UI Copy Quick Rules

- CTA hero: "Ready to join the rebellion?"
- CTA subtext: "We're done paying for mediocre software. Let's build something better — together."
- Hero tagline: "Community-built. Community-owned. No BS."
- Registration prompt: "Find your people. Build your week."
- About line: "The first. The real. The Boulder way."
- Footer: "Open source • MIT License • Built by builders, for builders"
- Empty state: Don't apologize. Point toward action.
- Error messages: Be honest and direct. Don't say "Oops!" 

---

## Color Tokens

Use these exact values. Do not introduce new colors without explicit product approval.

### Primary Palette

```css
/* Boulder Teal — primary brand color */
--color-teal:       #2B8A8F;
--color-teal-light: #E8F5F5;  /* backgrounds, pills */
--color-teal-dark:  #1E6B6F;  /* hover states */

/* Startup Orange — action, energy, CTAs */
--color-orange:       #F58220;
--color-orange-light: #FFF4E6;  /* pill backgrounds */
--color-orange-dark:  #D96E10;  /* hover states */
```

### Neutral Palette

```css
--color-white:       #FFFFFF;
--color-gray-light:  #F5F5F5;  /* page backgrounds, dividers */
--color-gray-border: #E5E5E5;  /* card borders, input borders */
--color-gray-mid:    #999999;  /* placeholders */
--color-gray-text:   #666666;  /* secondary text */
--color-charcoal:    #333333;  /* primary text */
```

### Colorado Accents (Use Sparingly)

```css
--color-co-blue:   #1E4D8B;  /* state pride, special accents */
--color-co-gold:   #FFD700;  /* special highlights only */
--color-co-green:  #2D5F3F;  /* success states */
```

### Semantic Colors

```css
--color-success:  #2D5F3F;
--color-warning:  #F58220;
--color-error:    #D93025;
--color-info:     #2B8A8F;
```

### Gradient

```css
/* Hero backgrounds, CTA sections, feature highlights */
background: linear-gradient(135deg, #2B8A8F 0%, #F5A623 60%, #F58220 100%);
```

---

## Typography

### Font Stack

```css
/* Primary — all UI, body, buttons */
--font-primary: 'Inter', system-ui, -apple-system, sans-serif;

/* Accent — headlines, hero text, callouts (optional) */
--font-accent: 'Space Grotesk', 'Inter', system-ui, sans-serif;
```

Load from Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
```

### Type Scale

```css
--text-h1:     48px; font-weight: 700;   /* Page titles */
--text-h2:     32px; font-weight: 600;   /* Section headers */
--text-h3:     24px; font-weight: 600;   /* Subsection headers */
--text-body:   16px; font-weight: 400;   /* Primary text */
--text-small:  14px; font-weight: 400;   /* Captions, labels */
--text-button: 16px; font-weight: 500;   /* All button text */
```

---

## Spacing & Layout

```css
--radius-sm:   8px;   /* inputs, filter buttons */
--radius-md:   12px;  /* cards */
--radius-pill: 20px;  /* category badges */

--shadow-card:  0px 4px 12px rgba(0, 0, 0, 0.08);   /* hover state on cards */
--shadow-btn:   4px 4px 0px rgba(0, 0, 0, 0.9);     /* hard shadow — key brand detail */
--shadow-btn-hover: 6px 6px 0px rgba(0, 0, 0, 0.9); /* lifted state on hover */
```

---

## Components

### Buttons

The **hard black shadow** is BSW's signature button detail. It creates depth and makes CTAs pop. Do not remove it.

#### Primary Button (Orange CTA)

```css
.btn-primary {
  background: #F58220;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 500;
  padding: 14px 32px;
  border-radius: 8px;
  border: none;
  box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.9);
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.btn-primary:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0px rgba(0, 0, 0, 0.9);
  background: #D96E10;
}
```

#### Secondary Button (Teal Outline)

```css
.btn-secondary {
  background: transparent;
  color: #2B8A8F;
  border: 2px solid #2B8A8F;
  font-size: 16px;
  font-weight: 500;
  padding: 12px 30px;
  border-radius: 8px;
  box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.9);
  cursor: pointer;
  transition: all 0.1s ease;
}

.btn-secondary:hover {
  background: #2B8A8F;
  color: #FFFFFF;
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0px rgba(0, 0, 0, 0.9);
}
```

#### Ghost / Text Button

```css
.btn-ghost {
  background: transparent;
  color: #2B8A8F;
  border: none;
  font-size: 16px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
}

.btn-ghost:hover {
  background: #F5F5F5;
  text-decoration: underline;
}
```

---

### Event Cards

```css
.event-card {
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: box-shadow 0.15s ease;
}

.event-card:hover {
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.08);
}
```

Card content order (top to bottom):
1. Category badge/pill
2. Title (H3, charcoal)
3. Description (body, gray-text, 2-line clamp)
4. Info pills: time, location, facilitator
5. Registration count
6. CTA button

---

### Category Badges / Pills

```css
/* Default — General / Tech */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

/* Founders / Featured */
.badge-featured {
  background: #FFF4E6;
  color: #F58220;
}

/* Registered (user is attending) */
.badge-registered {
  background: #2B8A8F;
  color: #FFFFFF;
}

/* Tech / General */
.badge-default {
  background: #E8F5F5;
  color: #2B8A8F;
}
```

---

### Info Pills (Session Metadata)

Used inside event cards to show time, location, facilitator, and capacity.

```css
.info-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 400;
  color: #333333;
}

.info-pill svg {
  color: #2B8A8F;  /* icons always teal */
  width: 16px;
  height: 16px;
}
```

Urgency copy (when event is nearly full):
```
"(4 spots left!)"  → color: #F58220, font-weight: 600
Show when capacity ≥ 80% full.
```

---

### Filter Buttons (Day / Category Tabs)

Used for filtering by day (Mon–Fri) and session type/category. **Not by track — tracks are removed.**

```css
.filter-btn {
  background: #FFFFFF;
  border: 2px solid #2B8A8F;
  border-radius: 8px;
  color: #2B8A8F;
  font-size: 16px;
  font-weight: 500;
  padding: 10px 20px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.filter-btn.active,
.filter-btn:hover {
  background: #2B8A8F;
  color: #FFFFFF;
}

.filter-btn svg {
  color: inherit;  /* matches text color */
}
```

---

### Search Bar

```css
.search-input {
  background: #FFFFFF;
  border: 2px solid #E5E5E5;
  border-radius: 8px;
  padding: 12px 16px 12px 44px;  /* left padding for icon */
  font-size: 16px;
  color: #333333;
  width: 100%;
}

.search-input::placeholder {
  color: #999999;
}

.search-input:focus {
  border-color: #2B8A8F;
  outline: none;
}
```

Placeholder text: `"Search events, speakers, venues..."`

---

## Logo

The BSW logo is an SVG — always use the vector version, never a raster copy.

```
/public/assets/BSW-Black_Logo.svg   ← black version (on white/light backgrounds)
/public/assets/BSW-White_Logo.svg   ← white version (on teal/dark backgrounds)
```

Minimum display size: 120px wide. Don't stretch, rotate, or recolor the logo.

---

## Hero / Page Header

```css
.hero {
  background: linear-gradient(135deg, #2B8A8F 0%, #F5A623 60%, #F58220 100%);
  padding: 64px 24px;
  text-align: center;
}

.hero h1 {
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-size: 48px;
  font-weight: 700;
  color: #FFFFFF;
  text-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.hero p {
  font-size: 20px;
  color: rgba(255,255,255,0.9);
  max-width: 560px;
  margin: 16px auto 0;
}
```

---

## What We DON'T Do

- No corporate speak or jargon in UI copy
- No over-polished, sterile design patterns
- No ads, ever
- No paywalls or premium feature tiers
- No thanking sponsors excessively
- No gatekeeping or elitism in the UX
- No new third-party CSS frameworks without product approval
- No `!important` unless absolutely unavoidable and documented

---

## Design Principles Summary

1. **Mobile-first.** 375px is the design canvas. Always.
2. **Content over chrome.** Let events and people shine. Minimize decorative elements.
3. **Fast and functional.** If it takes more than 3 taps to accomplish, simplify it.
4. **Honest affordances.** Buttons look like buttons. Links look like links.
