# MVP Proposal: Built with Agents

## Goal
A public space to share projects built with AI tools and document how I actually work alongside agents. Contributing to the conversation about AI-assisted development in practice — not selling anything, not pitching myself.

Working tagline: *"What I'm building with AI, and how."*

## Audience
Curious peers, fellow builders, anyone interested in how AI-assisted development actually plays out. Also future me, looking back at how the workflow evolved.

## Per-Project Narrative
Each case study answers four questions in this order: *What is it? How did I work with AI to build it? What's the technical shape? What would I do differently?* The "AI workflow" section is the most important one on every page — it's the part that's actually worth reading.

## Stack
- Astro 5 with Content Collections
- Tailwind CSS v4
- TypeScript strict
- MDX for case studies
- React islands only where interactivity is needed (video embeds, copy-link buttons)
- pnpm
- Deployed to Vercel (Cloudflare Pages acceptable alternative)

Reasoning for Astro over Next: content-heavy with minimal interactivity; Astro's zero-JS-by-default and Content Collections fit the shape better than a Next App Router site and keep Lighthouse scores effortless.

## Content Model

`src/content/projects/[slug].mdx` — frontmatter:

```ts
{
  title: string
  oneLiner: string                  // single-sentence pitch
  status: 'live' | 'archived' | 'wip'
  year: number
  role: 'solo' | 'lead' | 'contributor'
  stack: string[]
  aiTools: string[]                 // 'Claude Code', 'Cursor', etc.
  links: {
    github?: string                 // repo URL — optional, some projects aren't public
    publicUrl?: string              // live/deployed URL — optional
    video?: string                  // Loom or YouTube — optional
  }
  heroImage?: { src: string, alt: string }
  order: number                     // sort key for landing
  featured: boolean                 // top slot on landing
}
```

Body: free-form MDX with these required H2 sections, in order:

1. The problem
2. AI workflow *(the section worth reading — must not be skipped)*
3. Architecture
4. Outcomes
5. What I'd do differently

## Routes
- `/` — landing: hero + featured project + project grid
- `/projects/[slug]` — case study
- `/about` — short note on what this site is and how I work with AI
- `/404`

## Component Inventory
- `Hero` (landing only)
- `ProjectGrid`
- `ProjectCard`
- `CaseStudyHeader`
- `LinkBar` — renders only the link types that exist (github / publicUrl / video)
- `StackBadges`
- `VideoEmbed` — Loom-aware iframe wrapper, lazy-loaded
- `Footer` — minimal: contact link, last-updated

## Design Direction
- Editorial typography-led layout, not card-soup.
- Two typefaces max: one serif or geometric sans for body, one mono for technical accents (metadata, stack badges).
- **Accent color: green.** Restrained, deeper end of the spectrum — think `emerald-700`, `green-800`, or a comparable forest/moss shade. No neon, no lime, no bright web-2.0 green. The accent should appear sparingly: links, a thin rule under the hero, the active nav state, the focus ring. Everything else stays neutral.
- Restrained palette: neutral background, single accent color. No gradients. No glassmorphism. No emoji-as-decoration.
- Generous whitespace; aim for "publication" feel, not "agency" feel.
- Mobile-first; case studies must read well at 380px width.
- Dark mode optional. If shipped, system-preference only — no toggle in MVP.

## Acceptance Criteria
- [ ] Landing renders hero, featured project, and grid of all projects.
- [ ] Three projects fully populated; the fourth is allowed as a placeholder card in `wip` state.
- [ ] Each case study renders all frontmatter, all body sections, and a `LinkBar` showing only the links that are present.
- [ ] At least one case study includes an embedded video.
- [ ] OG images generated per page (Astro's OG helpers are fine).
- [ ] Lighthouse ≥95 on Performance, Accessibility, Best Practices, SEO on both landing and a case study.
- [ ] CLS = 0 on initial load.
- [ ] Responsive from 380px to 1440px+.
- [ ] Deployed to a public URL; custom domain hookup path documented in README.

## Out of Scope (MVP)
- Blog / articles section
- Search
- Tag filtering
- Comments
- Newsletter signup
- Custom analytics dashboard (built-in Vercel/Plausible is fine)
- CMS UI — MDX in repo is the editing surface
- I18n — English only

## Suggested Build Order
1. Scaffold Astro, install Tailwind v4 + MDX, configure Content Collections schema.
2. Build layout primitives (BaseLayout, typography styles, color tokens with the green accent).
3. Build `CaseStudyLayout` with the five required sections.
4. Build landing-page components.
5. Author one full case study end-to-end (the agentic dev system — flagship) **before** building the others; this validates the content model.
6. Build the remaining cases and the placeholder.
7. OG image generation.
8. Deploy.
9. Lighthouse pass and final polish.

## Constraints
- Ship v1 in a single weekend. If a feature isn't in acceptance criteria, defer it.
- No cookie-banner-requiring analytics in MVP — use Plausible or Vercel Analytics.
- All copy in English.
- Self-host fonts; no Google Fonts CDN.

## Notes for the Implementer (Claude Code)
- Do **not** fabricate project descriptions, screenshots, or video links. Leave the MDX bodies as scaffolded section headers with placeholder prose I will replace.
- Do **not** invent GitHub URLs or public URLs. If a link is unknown, omit the field rather than guess — `LinkBar` should hide buttons whose link is absent.
- The "AI workflow" section is the most important on every page — when scaffolding placeholders, make that clear in a comment so it doesn't get skipped during content fill-in.
