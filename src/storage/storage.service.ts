import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Env } from '../env';
import { GetPresignedUrlResponse } from './dto/get-presigned-url.dto';

@Injectable()
export class StorageService {
    constructor(private configService: ConfigService<Env>) { }

    async getPresignedUrl(filename: string): Promise<GetPresignedUrlResponse> {
        try {
            const s3LambdaUrl = this.configService.get('S3_GET_PRESIGNED_URL', { infer: true });

            if (!s3LambdaUrl) {
                throw new Error('S3_GET_PRESIGNED_URL environment variable is not defined');
            }

            const response = await axios.post<GetPresignedUrlResponse>(
                s3LambdaUrl,
                { filename },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Failed to get presigned URL: ${error.message}`);
            }
            throw error;
        }
    }
} 