import { Body, Controller, Get, Post, Res, UseGuards } from "@nestjs/common";
import { Profile } from "@prisma/client";
import { Response } from "express";
import { AuthService } from "./auth.service";
import { CurrentUser } from "./current-user.decorator";
import { JwtAuthGuard } from "./jwt-auth.guard";

interface AuthenticateBody {
  email: string;
  password: string;
}

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("login")
  authenticate(
    @Body() body: AuthenticateBody,
    @Res({ passthrough: true }) response: Response
  ) {
    return this.authService.authenticate(body, response);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  logout(@Res({ passthrough: true }) response: Response) {
    return this.authService.logout(response);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: Profile) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
