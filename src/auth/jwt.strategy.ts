import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ProfilesService } from 'src/profiles/profiles.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private profilesService: ProfilesService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: { sub: string }) {
    const profile = await this.profilesService.findById(payload.sub);

    if (!profile) {
      throw new UnauthorizedException();
    }

    return profile;
  }
} 