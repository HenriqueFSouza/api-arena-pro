import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { Profile } from '@prisma/client';
import { JwtAuthGuard } from './jwt-auth.guard';

interface AuthenticateBody {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  authenticate(@Body() body: AuthenticateBody) {
    return this.authService.authenticate(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: Profile) {
    return user;
  }
} 