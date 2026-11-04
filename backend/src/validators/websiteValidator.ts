import { z } from 'zod';

export const registerWebsiteSchema = z.object({
  body: z.object({
    url: z.string().url('Please enter a valid website URL with http:// or https://'),
  }),
});

export const verifyWebsiteSchema = z.object({
  body: z.object({
    method: z.enum(['DNS_TXT', 'HTTP_FILE', 'SELF_ATTESTED']),
    confirmationStatement: z.boolean().optional(),
  }),
});
