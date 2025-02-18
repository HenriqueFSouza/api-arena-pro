import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
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
  ) {}

  async authenticate({ email, password }: AuthenticateRequest) {
    const profile = await this.profilesService.findByEmail(email);

    const doesPasswordMatch = await compare(password, profile.passwordHash);

    if (!doesPasswordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.jwtService.sign({ sub: profile.id });

    return {
      access_token: accessToken,
    };
  }
} 