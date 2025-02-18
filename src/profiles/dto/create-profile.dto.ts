import { z } from "zod";

export const createProfileSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string(),
    phone: z.string(),
})

export type CreateProfileDto = z.infer<typeof createProfileSchema>