import { IsNotEmpty, IsString } from 'class-validator';

export class GetPresignedUrlDto {
    @IsString()
    @IsNotEmpty()
    filename: string;
}

export class GetPresignedUrlResponse {
    @IsString()
    @IsNotEmpty()
    url: string;

    @IsString()
    @IsNotEmpty()
    publicUrl: string;
}


