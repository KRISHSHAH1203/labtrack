import { z } from 'zod';

export const statusSchema = z.enum(['RECEIVED', 'IN_ANALYSIS', 'COMPLETED', 'REJECTED']);

export const createSampleSchema = z.object({
  code: z.string().trim().regex(/^[A-Z0-9-]{3,32}$/, 'code must be 3-32 chars: A-Z, 0-9, -'),
  studyId: z.string().trim().min(1).max(64),
  type: z.string().trim().min(1).max(64),
});

export const listQuerySchema = z.object({
  studyId: z.string().max(64).optional(),
  status: statusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const advanceSchema = z.object({ status: statusSchema });
