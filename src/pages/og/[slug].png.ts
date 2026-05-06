import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const fontDir = resolve(process.cwd(), 'src/assets/fonts');
const interRegular = await readFile(`${fontDir}/Inter-Regular.ttf`);
const interSemiBold = await readFile(`${fontDir}/Inter-SemiBold.ttf`);

const SITE_NAME = 'Built with Agents';
const SITE_TAGLINE = "What I'm building with AI, and how.";

const colors = {
  bg: '#fafaf9',
  fg: '#1c1917',
  muted: '#57534e',
  rule: '#e7e5e4',
  accent: '#15803d',
};

interface OgEntry {
  slug: string;
  title: string;
  oneLiner: string;
  eyebrow: string;
}

export async function getStaticPaths() {
  const projects = await getCollection('projects');
  const entries: OgEntry[] = [
    { slug: 'index', title: SITE_NAME, oneLiner: SITE_TAGLINE, eyebrow: SITE_NAME },
    { slug: 'about', title: 'About', oneLiner: 'How this site works and how I work alongside AI agents.', eyebrow: SITE_NAME },
    ...projects.map((p) => ({
      slug: p.id,
      title: p.data.title,
      oneLiner: p.data.oneLiner,
      eyebrow: SITE_NAME,
    })),
  ];

  return entries.map((entry) => ({ params: { slug: entry.slug }, props: entry }));
}

type Node = {
  type: string;
  props: {
    style?: Record<string, unknown>;
    children?: Node | Node[] | string | (Node | string)[];
  } & Record<string, unknown>;
};

const h = (
  type: string,
  props: Record<string, unknown> = {},
  children: Node | string | (Node | string)[] | undefined = undefined,
): Node => ({
  type,
  props: { ...props, children },
});

export const GET: APIRoute = async ({ props }) => {
  const { title, oneLiner, eyebrow } = props as OgEntry;

  const tree = h(
    'div',
    {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px',
        background: colors.bg,
        color: colors.fg,
        fontFamily: 'Inter',
      },
    },
    [
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: colors.accent,
            fontSize: '20px',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            fontWeight: 600,
          },
        },
        [
          h('div', {
            style: { width: '14px', height: '14px', background: colors.accent, borderRadius: '3px' },
          }),
          h('div', {}, eyebrow),
        ],
      ),
      h(
        'div',
        { style: { display: 'flex', flexDirection: 'column', gap: '24px' } },
        [
          h(
            'div',
            {
              style: {
                fontSize: '76px',
                fontWeight: 600,
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                color: colors.fg,
              },
            },
            title,
          ),
          h(
            'div',
            {
              style: {
                fontSize: '32px',
                lineHeight: 1.35,
                color: colors.muted,
                maxWidth: '900px',
              },
            },
            oneLiner,
          ),
        ],
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingTop: '24px',
            borderTop: `2px solid ${colors.rule}`,
            color: colors.muted,
            fontSize: '20px',
          },
        },
        [
          h('div', { style: { letterSpacing: '2px', textTransform: 'uppercase' } }, 'built-with-agents'),
          h(
            'div',
            { style: { color: colors.accent, letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 } },
            'Read the AI workflow →',
          ),
        ],
      ),
    ],
  );

  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Inter', data: interRegular, weight: 400, style: 'normal' },
      { name: 'Inter', data: interSemiBold, weight: 600, style: 'normal' },
    ],
  });

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
