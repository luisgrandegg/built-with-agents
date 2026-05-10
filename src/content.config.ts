import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      oneLiner: z.string(),
      status: z.enum(['live', 'archived', 'wip']),
      year: z.number().int(),
      role: z.enum(['solo', 'lead', 'contributor']),
      category: z.enum(['build', 'planning']).default('build'),
      stack: z.array(z.string()),
      aiTools: z.array(z.string()),
      links: z
        .object({
          github: z.string().url().optional(),
          publicUrl: z.string().url().optional(),
          video: z.string().url().optional(),
        })
        .default({}),
      heroImage: z
        .object({
          src: image(),
          alt: z.string(),
        })
        .optional(),
      order: z.number(),
      featured: z.boolean().default(false),
    }),
});

export const collections = { projects };
