import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import { Profile } from "@prisma/client";
import {
  CreateProfileDto,
  createProfileSchema,
} from "./dto/create-profile.dto";
import {
  UpdateProfileDto,
  updateProfileSchema,
} from "./dto/update-profile.dto";
import { ZodValidationPipe } from "src/pipes/zod-validation.pipe";
import { ProfilesService } from "./profiles.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { CurrentUser } from "src/auth/current-user.decorator";

@Controller("profiles")
export class ProfilesController {
  constructor(private profilesService: ProfilesService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createProfileSchema))
  async create(@Body() data: CreateProfileDto) {
    return this.profilesService.create(data);
  }

  @Get(":id")
  async findById(@Param("id") id: string) {
    return this.profilesService.findById(id);
  }

  @Put("me")
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(updateProfileSchema))
  async updateMe(@CurrentUser() user: Profile, @Body() data: UpdateProfileDto) {
    const email = user.email;
    return this.profilesService.updateWithPasswordCheck(email, data);
  }

  @Put(":id")
  @UsePipes(new ZodValidationPipe(createProfileSchema))
  async update(@Param("id") id: string, @Body() data: CreateProfileDto) {
    return this.profilesService.update(id, data);
  }

  @Delete(":id")
  async delete(@Param("id") id: string) {
    return this.profilesService.delete(id);
  }
}
