import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { GetPresignedUrlDto, GetPresignedUrlResponse } from './dto/get-presigned-url.dto';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
    constructor(private storageService: StorageService) { }

    @Post('presigned-url')
    @ApiOperation({ summary: 'Get a presigned URL for a file' })
    @ApiBody({ type: GetPresignedUrlDto })
    @ApiResponse({ type: GetPresignedUrlResponse })
    @UseGuards(JwtAuthGuard)
    async getPresignedUrl(@Body() { filename }: GetPresignedUrlDto): Promise<GetPresignedUrlResponse> {
        return this.storageService.getPresignedUrl(filename);
    }
} 