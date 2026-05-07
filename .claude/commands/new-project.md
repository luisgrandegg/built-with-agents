---
description: Auto-generate a new project case study from a GitHub repo URL
argument-hint: <github-url>
allowed-tools: Bash, Read, Write, WebFetch, AskUserQuestion
---

You are generating a new MDX case study for the built-with-agents site at `src/content/projects/<slug>.mdx` from a GitHub repo URL.

The target argument the user passed: **`$ARGUMENTS`**

If `$ARGUMENTS` is empty or doesn't look like a GitHub repo URL (i.e. not matching `https://github.com/<owner>/<repo>`), use AskUserQuestion to ask the user for one before proceeding.

## Workflow

### 1. Fetch repo content

Prefer `gh` if available; fall back to `WebFetch` on `raw.githubusercontent.com`.

Minimum to fetch:
- Repo metadata: `gh repo view <owner>/<repo> --json name,description,homepageUrl,url,createdAt,pushedAt,languages,defaultBranchRef`
- Root file listing: `gh api /repos/<owner>/<repo>/contents/`
- For each of these, if present: `README.md`, `initial-prompt.md`, `prompts.md`, `PROMPTS.md`, `package.json`, `CLAUDE.md`, any single root-level `*.html`.

If the repo doesn't exist or is private and you don't have access, stop and tell the user.

### 2. Auto-detect frontmatter

Derive each field. Note the source so you can show the user during preview.

| Field | How to derive |
|---|---|
| `slug` | The repo name (already kebab-case in most cases). Validate against `/^[a-z0-9][a-z0-9-]*$/`. |
| `title` | First H1 of the README, falling back to the humanized repo name. |
| `oneLiner` | The blockquote immediately after the README H1, or the first non-link paragraph. Single sentence. |
| `year` | Year from `createdAt`. |
| `stack` | If a single root-level `.html` is the main artifact: `["HTML", "CSS", "JavaScript"]` plus anything obvious in the README (e.g. "Supabase", "Firebase", "Tailwind"). Otherwise: top languages from `gh repo view` + frameworks from `package.json` deps. |
| `aiTools` | Scan README and `CLAUDE.md` for: "Claude", "Claude Code", "Cursor", "Copilot", "GPT", "ChatGPT". If `CLAUDE.md` exists, include `Claude Code`. If nothing matches, default to `["Claude"]`. |
| `links.github` | The argument URL, normalized. |
| `links.publicUrl` | `homepageUrl` from `gh repo view`, or the first non-github URL in the README that looks like a deployed app. Omit if unsure — do NOT fabricate. |
| `links.video` | None by default. Only set if the user provides one in step 4. |
| `status` | `live` if a deployed URL is present or the README clearly describes a working app; `wip` otherwise. Pre-fill, ask in step 4. |
| `role` | Default `solo`. Ask in step 4. |
| `featured` | Default `false`. Ask in step 4. |
| `order` | Count files in `src/content/projects/` (`ls src/content/projects/*.mdx 2>/dev/null | wc -l`) and add 10. |

### 3. Draft body sections

Five H2 sections, in order. Use the README and prompts file as source. Don't fabricate — if a section can't be drafted from available content, mark it `TODO: ...` and flag it explicitly to the user in the preview.

1. **The problem** — from the README intro plus the first 1–2 entries in `initial-prompt.md` (if present). What the user was trying to do.
2. **AI workflow** — *the most important section.* If `initial-prompt.md` is present, walk through how the prompts evolved: what was incremental, what worked, what got reworked. If no prompts file exists, scaffold a `TODO` and tell the user it must be filled in before flipping `status` to `live`.
3. **Architecture** — from README sections like "How it works" / "Stack" / "Setup", plus any visible structure (single HTML file, dependencies, storage layer).
4. **Outcomes** — what's working, what's deployed, what's used, from the "Features" section and current `status`.
5. **What I'd do differently** — hard to infer from a repo. Ask the user in step 4. If they skip, scaffold a one-line `TODO`.

### 4. Ask the user about everything that can't be reliably auto-detected

Use the `AskUserQuestion` tool. Ask in this order, batching where it makes sense:

1. **Status** — pre-fill the inferred value; options `live` / `wip` / `archived`.
2. **Role** — `solo` / `lead` / `contributor`.
3. **Featured** — `yes` / `no` (default no; only one project should be featured at a time).
4. **Public URL** — if not auto-detected, ask whether there's a deployed URL or to skip.
5. **Video URL** — ask for a Loom/YouTube URL or skip.
6. **"What I'd do differently"** — ask the user for a sentence; offer a `TODO` placeholder option.

Don't ask about anything you've already detected with high confidence (title, oneLiner, year, slug, links.github, stack, aiTools, order) — those are surfaced in the preview, where the user can override.

### 5. Preview + single confirmation

Print the full proposed MDX (frontmatter + body) to the user. Then ask, with `AskUserQuestion`:
- `Write the file as shown` (recommended)
- `Edit one field` (if chosen, ask which field, take the new value, re-render preview, repeat)
- `Cancel`

### 6. Write the file via the CLI

Build the JSON spec described in `scripts/gen-project.mjs --help` and pipe it in:

```bash
cat <<'JSON' | pnpm --silent gen:project --stdin
{
  "slug": "...",
  "frontmatter": { ... },
  "body": { ... }
}
JSON
```

If the script reports validation errors, fix the spec in memory and retry. Don't bypass the validator.

### 7. Verify

After writing:
- `ls src/content/projects/` to confirm the new file is there.
- Read the first 30 lines back to the user.
- If `pnpm` and `astro` are wired up locally, run `pnpm astro check` to type-check the new entry against the content collection schema. If not available, skip and tell the user to run it themselves.

Then end your turn with: file path written, any `TODO`s the user still has to fill in, and whether they should flip `status` to `live` once those are resolved.

## Constraints

- **Don't fabricate links.** If `publicUrl` or `video` isn't clearly stated, omit the field — `LinkBar` hides absent buttons.
- **The AI workflow section is the most important.** Don't stub it without explicitly flagging the `TODO` to the user.
- **One project per run.** Don't try to import multiple repos in one invocation.
- **No new commits or pushes.** Stop after writing the file. Let the user review and commit.
