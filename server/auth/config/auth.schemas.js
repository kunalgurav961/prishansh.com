import { z } from 'zod'

const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters long')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password must be at most 72 UTF-8 bytes long')

const emailSchema = z.string()
  .trim()
  .min(1, 'Email is required')
  .max(254, 'Email is too long')
  .email('Email must be valid')
  .transform((value) => value.toLowerCase())

export const registrationSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  email: emailSchema,
  password: passwordSchema,
}).strict()

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(1_024, 'Password is too long'),
}).strict()

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'Google ID token is required').max(10_000, 'Google ID token is too large'),
}).strict()

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  picture: z.string().url().max(2048).refine(
    (value) => value.startsWith('https://') || value.startsWith('http://'),
    'Picture must use HTTP or HTTPS',
  ).nullable().optional(),
}).strict().refine(
  (value) => Object.keys(value).length > 0,
  'At least one editable profile field is required',
)
