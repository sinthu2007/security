import { z } from 'zod';

export const startScanSchema = z.object({
  body: z.object({
    url: z.string().url('Please enter a valid website URL'),
    websiteId: z.string().optional(),
    authorizationConfirmed: z.boolean().refine(val => val === true, {
      message: 'You must confirm that you are authorized to assess this target website',
    }),
  }),
});

export const compareScansSchema = z.object({
  body: z.object({
    scanId1: z.string().min(1, 'First scan ID is required'),
    scanId2: z.string().min(1, 'Second scan ID is required'),
  }),
});
