import { z } from 'zod';

export const nameSchema = z.string().min(1, 'Name is required').max(100, 'Name too long');

export const addressBlockSchema = z.object({
  names: z.array(nameSchema).min(1, 'At least one name is required'),
  address: z.string().max(500, 'Address too long'),
  mobile: z.string().regex(/^[0-9\s\-()]+$/, 'Invalid mobile number format').optional().or(z.literal('')),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  width: z.number().int().min(1),
  height: z.number().int().min(1),
  page_number: z.number().int().min(1),
});

export const createBlockSchema = addressBlockSchema;
export const updateBlockSchema = addressBlockSchema.partial();

export type CreateBlockInput = z.infer<typeof createBlockSchema>;
export type UpdateBlockInput = z.infer<typeof updateBlockSchema>;
