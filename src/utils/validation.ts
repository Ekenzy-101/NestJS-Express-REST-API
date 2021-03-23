import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import FastestValidator, { ValidationSchema } from 'fastest-validator';

import { PostCategory } from '../posts/post.entity';

const { Education, Politics, Sport } = PostCategory;
@Injectable()
export class FastestValidationPipe implements PipeTransform {
  private validator: FastestValidator;
  constructor(private schema: ValidationSchema<any>) {
    this.validator = new FastestValidator();
  }

  transform(value: any) {
    const errors = this.validator.validate(value, this.schema);
    if (errors === true) return value;

    const formattedErrors: Record<string, string> = {};
    errors.forEach((error) => {
      const key = error.field;
      formattedErrors[key] = error.message!;
    });

    throw new BadRequestException(formattedErrors);
  }
}

export const idSchema = {
  id: {
    type: 'uuid',
    messages: { uuid: 'Id is not a valid uuid' },
  },
};

export const loginSchema = {
  email: {
    type: 'email',
    normalize: true,
    max: 255,
    messages: {
      email: 'Email is not a valid email address',
      required: 'Email is not a valid email address',
    },
  },
  password: {
    type: 'string',
    min: 6,
    messages: {
      stringMin: 'Password should not be up to 6 characters',
      required: 'Password should not be up to 6 characters',
    },
  },
};

export const postSchema = {
  category: {
    type: 'enum',
    trim: true,
    values: [Education, Sport, Politics],
    messages: {
      enumValue: 'Category must be an value of the given options {expected}',
      required: 'Category must be an value of the given options {expected}',
    },
  },
  content: {
    type: 'string',
    empty: false,
    trim: true,
    messages: {
      required: 'Content is required',
      stringEmpty: 'Content is required',
    },
  },
  title: {
    type: 'string',
    empty: false,
    trim: true,
    messages: {
      required: 'Title is required',
      stringEmpty: 'Title is required',
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
      required: 'Passwords do not match',
    },
  },
  name: {
    type: 'string',
    empty: false,
    max: 50,
    trim: true,
    messages: {
      required: 'Name is required',
      stringEmpty: 'Name is required',
      stringMax: 'Name should not be more than 50 characters',
    },
  },
};
