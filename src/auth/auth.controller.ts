import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { Profile } from '@prisma/client';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Response } from 'express';

interface AuthenticateBody {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  authenticate(
    @Body() body: AuthenticateBody,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.authenticate(body, response);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Res({ passthrough: true }) response: Response) {
    return this.authService.logout(response);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: Profile) {
    return user;
  }
} 