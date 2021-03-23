import { OmitType } from '@nestjs/mapped-types';
import { RegisterUserDto } from './register-user.dto';

export class LoginUserDto extends OmitType(RegisterUserDto, [
  'name',
] as const) {}
