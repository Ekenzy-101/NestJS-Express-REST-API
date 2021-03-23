import bcrypt from 'bcrypt';
import { Response } from 'express';
import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Res,
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

@Controller('auth')
export class AuthController {
  constructor(private configService: ConfigService<EnvironmentVariables>) {}

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

    const secret = this.configService.get<string>('APP_ACCESS_SECRET')!;
    const cookieName = this.configService.get<string>(
      'ACCESS_TOKEN_COOKIE_NAME',
    )!;
    const token = user.generateAccessToken(secret);

    return res
      .cookie(cookieName, token, COOKIE_OPTIONS)
      .send({ id: user.id, email, name });
  }

  @Post('login')
  @UsePipes(new FastestValidationPipe(loginSchema))
  async login(@Body() loginUserDto: LoginUserDto, @Res() res: Response) {
    const { email, password } = loginUserDto;

    let user = await User.findOne({ where: { email } });
    if (!user) throw new BadRequestException('Invalid email or password');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new BadRequestException('Invalid email or password');

    const secret = this.configService.get<string>('APP_ACCESS_SECRET')!;
    const cookieName = this.configService.get<string>(
      'ACCESS_TOKEN_COOKIE_NAME',
    )!;
    const token = user.generateAccessToken(secret);

    return res
      .cookie(cookieName, token, COOKIE_OPTIONS)
      .send({ id: user.id, email, name: user.name });
  }
}
