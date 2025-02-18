import { Body, Controller, Delete, Get, Param, Post, Put, UsePipes } from "@nestjs/common";
import { CreateProfileDto, createProfileSchema } from "./dto/create-profile.dto";
import { ZodValidationPipe } from "src/pipes/zod-validation.pipe";
import { ProfilesService } from "./profiles.service";

@Controller('profiles')
export class ProfilesController {
    constructor(private profilesService: ProfilesService) { }

    @Post()
    @UsePipes(new ZodValidationPipe(createProfileSchema))
    async create(@Body() data: CreateProfileDto) {
        return this.profilesService.create(data);
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.profilesService.findById(id);
    }

    @Put(':id')
    @UsePipes(new ZodValidationPipe(createProfileSchema))
    async update(@Param('id') id: string, @Body() data: CreateProfileDto) {
        return this.profilesService.update(id, data);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.profilesService.delete(id);
    }
}