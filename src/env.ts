import { z } from "zod";

export const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(1),
    PORT: z.coerce.number().optional().default(3333),
    S3_GET_PRESIGNED_URL: z.string().url(),
})

export type Env = z.infer<typeof envSchema>