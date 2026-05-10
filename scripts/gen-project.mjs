#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECTS_DIR = path.resolve(__dirname, '..', 'src', 'content', 'projects');

const STATUSES = ['live', 'archived', 'wip'];
const ROLES = ['solo', 'lead', 'contributor'];
const CATEGORIES = ['build', 'planning'];
const SECTIONS = [
  ['problem', 'The problem'],
  ['aiWorkflow', 'AI workflow'],
  ['architecture', 'Architecture'],
  ['outcomes', 'Outcomes'],
  ['differently', "What I'd do differently"],
];

main().catch(err => {
  console.error(`error: ${err?.message ?? err}`);
  process.exit(1);
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  let raw;
  if (args.stdin) {
    raw = await readStdin();
  } else if (args.from) {
    raw = fs.readFileSync(args.from, 'utf8');
  } else {
    die('--from <path> or --stdin required (run with --help for usage)');
  }

  let spec;
  try {
    spec = JSON.parse(raw);
  } catch (e) {
    die(`invalid JSON: ${e.message}`);
  }

  const errors = validate(spec);
  if (errors.length) {
    console.error('validation failed:');
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  const out = renderMdx(spec);
  const dest = path.join(PROJECTS_DIR, `${spec.slug}.mdx`);

  if (args.dryRun) {
    console.log(`# would write: ${path.relative(process.cwd(), dest)}\n`);
    process.stdout.write(out);
    return;
  }

  if (fs.existsSync(dest) && !args.force) {
    die(`${path.relative(process.cwd(), dest)} already exists (use --force to overwrite)`);
  }

  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
  fs.writeFileSync(dest, out);
  console.log(`wrote ${path.relative(process.cwd(), dest)}`);
}

function parseArgs(argv) {
  const out = { from: null, stdin: false, dryRun: false, force: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--from') out.from = argv[++i];
    else if (a === '--stdin') out.stdin = true;
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--force') out.force = true;
    else if (a === '--help' || a === '-h') out.help = true;
    else die(`unknown flag: ${a}`);
  }
  return out;
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

function validate(spec) {
  const e = [];
  if (!spec || typeof spec !== 'object') return ['spec must be a JSON object'];
  if (!spec.slug || typeof spec.slug !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(spec.slug)) {
    e.push('slug must be kebab-case (matching /^[a-z0-9][a-z0-9-]*$/)');
  }
  const fm = spec.frontmatter || {};
  if (!nonEmpty(fm.title)) e.push('frontmatter.title required');
  if (!nonEmpty(fm.oneLiner)) e.push('frontmatter.oneLiner required');
  if (!STATUSES.includes(fm.status)) e.push(`frontmatter.status must be one of ${STATUSES.join('|')}`);
  if (!Number.isInteger(fm.year)) e.push('frontmatter.year must be an integer');
  if (!ROLES.includes(fm.role)) e.push(`frontmatter.role must be one of ${ROLES.join('|')}`);
  if (fm.category != null && !CATEGORIES.includes(fm.category)) {
    e.push(`frontmatter.category must be one of ${CATEGORIES.join('|')}`);
  }
  if (!Array.isArray(fm.stack) || fm.stack.length === 0 || fm.stack.some(s => !nonEmpty(s))) {
    e.push('frontmatter.stack must be a non-empty array of non-empty strings');
  }
  if (!Array.isArray(fm.aiTools) || fm.aiTools.length === 0 || fm.aiTools.some(s => !nonEmpty(s))) {
    e.push('frontmatter.aiTools must be a non-empty array of non-empty strings');
  }
  if (typeof fm.order !== 'number') e.push('frontmatter.order must be a number');
  if (typeof fm.featured !== 'boolean') e.push('frontmatter.featured must be a boolean');
  for (const k of ['github', 'publicUrl', 'video']) {
    const v = fm.links?.[k];
    if (v != null && v !== '' && !isUrl(v)) {
      e.push(`frontmatter.links.${k} must be a valid URL or omitted`);
    }
  }
  const body = spec.body || {};
  for (const [k] of SECTIONS) {
    if (!nonEmpty(body[k])) e.push(`body.${k} required (non-empty string)`);
  }
  return e;
}

function nonEmpty(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function isUrl(s) {
  try { new URL(s); return true; } catch { return false; }
}

function renderMdx(spec) {
  const fm = spec.frontmatter;
  const lines = ['---'];
  lines.push(`title: ${yaml(fm.title)}`);
  lines.push(`oneLiner: ${yaml(fm.oneLiner)}`);
  lines.push(`status: ${fm.status}`);
  lines.push(`year: ${fm.year}`);
  lines.push(`role: ${fm.role}`);
  if (fm.category) lines.push(`category: ${fm.category}`);
  lines.push('stack:');
  for (const s of fm.stack) lines.push(`  - ${yaml(s)}`);
  lines.push('aiTools:');
  for (const s of fm.aiTools) lines.push(`  - ${yaml(s)}`);

  const links = {};
  for (const k of ['github', 'publicUrl', 'video']) {
    const v = fm.links?.[k];
    if (nonEmpty(v)) links[k] = v;
  }
  if (Object.keys(links).length > 0) {
    lines.push('links:');
    for (const [k, v] of Object.entries(links)) lines.push(`  ${k}: ${yaml(v)}`);
  }

  lines.push(`order: ${fm.order}`);
  lines.push(`featured: ${fm.featured}`);
  lines.push('---');
  lines.push('');

  for (const [key, heading] of SECTIONS) {
    lines.push(`## ${heading}`);
    lines.push('');
    lines.push(spec.body[key].trim());
    lines.push('');
  }

  return lines.join('\n');
}

function yaml(s) {
  return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

function die(msg) {
  console.error(`error: ${msg}`);
  process.exit(1);
}

function printHelp() {
  console.log(`Usage:
  pnpm gen:project --from <spec.json>
  pnpm gen:project --stdin < spec.json

Options:
  --from <path>   read JSON spec from file
  --stdin         read JSON spec from stdin
  --dry-run       print the MDX to stdout instead of writing
  --force         overwrite the target file if it already exists
  -h, --help      show this help

JSON spec shape (mirrors src/content.config.ts):
  {
    "slug": "kebab-case-slug",
    "frontmatter": {
      "title": "...",
      "oneLiner": "...",
      "status": "live" | "archived" | "wip",
      "year": 2025,
      "role": "solo" | "lead" | "contributor",
      "category": "build" | "planning",   // optional, defaults to "build"
      "stack": ["..."],
      "aiTools": ["..."],
      "links": { "github": "...", "publicUrl": "...", "video": "..." },
      "order": 10,
      "featured": false
    },
    "body": {
      "problem": "...",
      "aiWorkflow": "...",
      "architecture": "...",
      "outcomes": "...",
      "differently": "..."
    }
  }

Links with empty/missing URLs are omitted from the frontmatter.
The five body sections are rendered as H2 headings in the order required by MVP.md.
`);
}
