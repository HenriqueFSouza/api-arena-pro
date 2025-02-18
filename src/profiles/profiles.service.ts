import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { hash } from 'bcryptjs';

@Injectable()
export class ProfilesService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreateProfileDto) {
        const { name, email, password, phone } = data;

        const profileExists = await this.prisma.profile.findUnique({
            where: { email }
        });

        if (profileExists) {
            throw new ConflictException('Email already exists');
        }

        const passwordHash = await hash(password, 8);

        await this.prisma.profile.create({
            data: {
                name,
                email,
                passwordHash,
                phone
            }
        });
    }

    async findByEmail(email: string) {
        const profile = await this.prisma.profile.findUnique({
            where: { email }
        });

        if (!profile) {
            throw new NotFoundException('Profile not found');
        }

        return profile;
    }

    async findById(id: string) {
        const profile = await this.prisma.profile.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        categories: true,
                        products: true,
                        clients: true
                    }
                }
            }
        });

        if (!profile) {
            throw new NotFoundException('Profile not found');
        }

        return profile;
    }

    async update(id: string, data: Partial<CreateProfileDto>) {
        const profile = await this.prisma.profile.findUnique({
            where: { id }
        });

        if (!profile) {
            throw new NotFoundException('Profile not found');
        }

        let updateData = { ...data };

        // If password is being updated, hash it
        if (data.password) {
            updateData.password = await hash(data.password, 8);
        }

        return this.prisma.profile.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                updatedAt: true
            }
        });
    }

    async delete(id: string) {
        const profile = await this.prisma.profile.findUnique({
            where: { id }
        });

        if (!profile) {
            throw new NotFoundException('Profile not found');
        }

        await this.prisma.profile.delete({
            where: { id }
        });
    }
} 