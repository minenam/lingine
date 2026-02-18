import { z } from 'zod';

export const createSessionBodySchema = z.object({
  dayRecordId: z.string().uuid(),
  audioSourceIds: z.array(z.string().uuid()).min(1),
  difficulty: z.enum(['easy', 'med', 'hard']).default('med'),
  keyword: z.string().trim().max(255).nullable().optional(),
});

export const listSessionQuerySchema = z.object({
  status: z.enum(['in_progress', 'completed']).optional(),
  difficulty: z.enum(['easy', 'med', 'hard']).optional(),
  maxScore: z.coerce.number().int().min(0).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  keyword: z.string().trim().max(255).optional(),
  dayRecordId: z.string().uuid().optional(),
});
