import { z } from "zod";

export const updateProfileSchema = z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    profileImage: z.string().nullable().optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6).optional(),
}).refine(data => {
    // If newPassword is provided, currentPassword is required
    if (data.newPassword && !data.currentPassword) return false;
    return true;
}, { message: "Senha atual é obrigatória para alterar a senha" });

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
