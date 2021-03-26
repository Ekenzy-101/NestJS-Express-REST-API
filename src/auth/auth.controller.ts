import bcrypt from 'bcrypt';
import { Response } from 'express';
import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { User } from '../users/user.entity';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { RegisterUserDto } from '../users/dto/register-user.dto';
import {
  FastestValidationPipe,
  loginSchema,
  registerSchema,
} from '../utils/validation';
import { COOKIE_OPTIONS } from '../utils/config';
import { EnvironmentVariables } from '../utils/types';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private configService: ConfigService<EnvironmentVariables>) {}

  cookieResponse(res: Response, user: User, status: number) {
    const secret = this.configService.get<string>('APP_ACCESS_SECRET')!;
    const cookieName = this.configService.get<string>(
      'ACCESS_TOKEN_COOKIE_NAME',
    )!;

    const token = user.generateAccessToken(secret);
    const { id, name, email } = user;

    return res
      .status(status)
      .cookie(cookieName, token, COOKIE_OPTIONS)
      .send({ id, email, name });
  }

  @Post('register')
  @UsePipes(new FastestValidationPipe(registerSchema))
  async register(
    @Body() registerUserDto: RegisterUserDto,
    @Res() res: Response,
  ) {
    const { email, password, name } = registerUserDto;

    let user = await User.findOne({ where: { email } });
    if (user) throw new BadRequestException({ email: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 12);
    user = await User.create({ name, email, password: hashedPassword }).save();

    return this.cookieResponse(res, user, 201);
  }

  @Post('login')
  @UsePipes(new FastestValidationPipe(loginSchema))
  async login(@Body() loginUserDto: LoginUserDto, @Res() res: Response) {
    const { email, password } = loginUserDto;

    let user = await User.findOne({
      where: { email },
      select: ['password', 'id', 'name', 'email'],
    });
    if (!user) throw new BadRequestException('Invalid email or password');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new BadRequestException('Invalid email or password');

    return this.cookieResponse(res, user, 200);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @UsePipes(new FastestValidationPipe(loginSchema))
  async logout(@Res() res: Response) {
    const cookieName = this.configService.get<string>(
      'ACCESS_TOKEN_COOKIE_NAME',
    )!;

    return res
      .status(200)
      .clearCookie(cookieName, COOKIE_OPTIONS)
      .send('Logged out successfully');
  }
}
