import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { Response } from 'express';
import { ProfilesService } from 'src/profiles/profiles.service';

interface AuthenticateRequest {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(
    private profilesService: ProfilesService,
    private jwtService: JwtService,
  ) { }

  async authenticate({ email, password }: AuthenticateRequest, response: Response) {
    const profile = await this.profilesService.findByEmail(email);

    const doesPasswordMatch = await compare(password, profile.passwordHash);

    if (!doesPasswordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.jwtService.sign({ sub: profile.id });

    // Set cookie with the JWT token
    response.cookie('arena_pro_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return {
      message: 'Successfully logged in',
    };
  }

  logout(response: Response) {
    response.clearCookie('arena_pro_access_token');
    return {
      message: 'Successfully logged out',
    };
  }
} 