import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateProfileDto } from "./dto/create-profile.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { hash, compare } from "bcryptjs";

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProfileDto) {
    const { name, email, password, phone } = data;

    const profileExists = await this.prisma.profile.findUnique({
      where: { email },
    });

    if (profileExists) {
      throw new ConflictException("Email already exists");
    }

    const passwordHash = await hash(password, 8);

    await this.prisma.profile.create({
      data: {
        name,
        email,
        passwordHash,
        phone,
      },
    });
  }

  async findByEmail(email: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { email },
    });

    if (!profile) {
      throw new NotFoundException("Profile not found");
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
            clients: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException("Profile not found");
    }

    return profile;
  }

  async update(id: string, data: Partial<CreateProfileDto>) {
    const profile = await this.prisma.profile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException("Profile not found");
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
        updatedAt: true,
      },
    });
  }

  async delete(id: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException("Profile not found");
    }

    await this.prisma.profile.delete({
      where: { id },
    });
  }

  async updateWithPasswordCheck(email: string, data: UpdateProfileDto) {
    const profile = await this.prisma.profile.findUnique({
      where: { email },
    });

    if (!profile) {
      throw new NotFoundException("Profile not found");
    }

    // Check if email is being changed and if it's already in use
    if (data.email && data.email !== profile.email) {
      const emailExists = await this.prisma.profile.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        throw new ConflictException("Email já está em uso");
      }
    }

    // Build update data
    const updateData: {
      name?: string;
      email?: string;
      phone?: string;
      profileImage?: string | null;
      passwordHash?: string;
    } = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.profileImage !== undefined)
      updateData.profileImage = data.profileImage;

    // Handle password change
    if (data.newPassword && data.currentPassword) {
      const doesPasswordMatch = await compare(
        data.currentPassword,
        profile.passwordHash
      );

      if (!doesPasswordMatch) {
        throw new UnauthorizedException("Senha atual incorreta");
      }

      updateData.passwordHash = await hash(data.newPassword, 8);
    }

    return this.prisma.profile.update({
      where: { email },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        profileImage: true,
        updatedAt: true,
      },
    });
  }
}
