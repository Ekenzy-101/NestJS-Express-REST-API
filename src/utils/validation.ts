import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import FastestValidator, { ValidationSchema } from 'fastest-validator';

@Injectable()
export class FastestValidationPipe implements PipeTransform {
  private validator: FastestValidator;
  constructor(private schema: ValidationSchema<any>) {
    this.validator = new FastestValidator();
  }

  transform(value: any) {
    const errors = this.validator.validate(value, this.schema);
    console.log(errors);

    if (errors === true) return value;

    const formattedErrors: Record<string, string> = {};
    errors.forEach((error) => {
      const key = error.field;
      formattedErrors[key] = error.message!;
    });

    throw new BadRequestException(formattedErrors);
  }
}

export const loginSchema = {
  email: {
    type: 'email',
    normalize: true,
    max: 255,
    messages: { email: 'Email is not a valid email address' },
  },
  password: {
    type: 'string',
    min: 6,
    messages: {
      stringMin: 'Password should not be up to 6 characters',
    },
  },
};

export const registerSchema = {
  ...loginSchema,
  confirmPassword: {
    type: 'equal',
    field: 'password',
    messages: {
      equalField: 'Passwords do not match',
    },
  },
  name: {
    type: 'string',
    empty: false,
    max: 50,
    trim: true,
    messages: {
      stringEmpty: 'Name is required',
      stringMax: 'Name should not be more than 50 characters',
    },
  },
};
