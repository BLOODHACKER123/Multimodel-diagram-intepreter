import { z } from 'zod'

export const pointSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
})

export const graphNodeSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(200),
  // Accept any string; normalizeGraph coerces unknown values to defaults.
  type: z.string(),
  shape: z.string(),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1).optional(),
  height: z.number().min(0).max(1).optional(),
  group: z.string().optional(),
  description: z.string().max(500).optional(),
  meta: z.record(z.string()).optional(),
})

export const graphEdgeSchema = z.object({
  id: z.string().min(1).max(64),
  source: z.string().min(1).max(64),
  target: z.string().min(1).max(64),
  label: z.string().max(200).optional(),
  directed: z.boolean().default(false),
  relationship: z.enum([
    'one-to-one',
    'one-to-many',
    'many-to-one',
    'many-to-many',
    'contains',
    'flows-to',
    'depends-on',
    'inherits',
    'other',
  ]).optional(),
  weight: z.number().optional(),
  waypoints: z.array(pointSchema).max(10).optional(),
  style: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
})

export const diagramGraphSchema = z.object({
  id: z.string().min(1).max(64).optional(),
  title: z.string().min(1).max(200),
  diagramType: z.enum([
    'er',
    'graph',
    'flowchart',
    'cloud-architecture',
    'uml',
    'network',
    'other',
  ]),
  summary: z.string().max(1000),
  nodes: z.array(graphNodeSchema).max(100),
  edges: z.array(graphEdgeSchema).max(200),
  imageSize: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  legend: z.array(z.string()).optional(),
})

export const extractionResultSchema = z.object({
  diagramId: z.string().min(1),
  graph: diagramGraphSchema,
  confidence: z.number().min(0).max(1),
  warnings: z.array(z.string()).default([]),
  provider: z.string(),
  model: z.string(),
})

export const askRequestSchema = z.object({
  question: z.string().min(1).max(500),
  diagramId: z.string().optional(),
  graph: diagramGraphSchema.optional(),
  focus: z.object({
    type: z.enum(['node', 'edge', 'diagram']),
    id: z.string().optional(),
  }).optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(2000),
  })).max(6).optional(),
})

export const askResponseSchema = z.object({
  answer: z.string().max(1500),
  followUps: z.array(z.string().max(200)).max(3).default([]),
})
