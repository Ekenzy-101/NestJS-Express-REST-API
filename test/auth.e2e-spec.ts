import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import jwt from 'express-jwt';
import request from 'supertest';

import { AuthModule } from './../src/auth/auth.module';
import { User } from './../src/users/user.entity';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let secret: string;
  let cookieName: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AuthModule,
        ConfigModule.forRoot({ envFilePath: '.test.env', isGlobal: true }),
        TypeOrmModule.forRoot(),
      ],
    }).compile();

    secret = process.env.APP_ACCESS_SECRET!;
    cookieName = process.env.ACCESS_TOKEN_COOKIE_NAME!;

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.use(
      jwt({
        algorithms: ['HS256'],
        secret,
        credentialsRequired: false,
        getToken: (req) => req.cookies[cookieName],
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await new Promise((resolve) => setTimeout(() => resolve(5), 10000));
  });

  describe('POST /auth/register', () => {
    let name: string, email: string, password: string, confirmPassword: string;

    const execute = async () => {
      return await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name, email, password, confirmPassword });
    };

    beforeEach(() => {
      name = 'Test';
      email = 'test@gmail.com';
      password = '123456';
      confirmPassword = '123456';
    });

    afterEach(async () => {
      await User.delete({});
    });

    it(`should return 201 if client's inputs are valid`, async () => {
      const res = await execute();

      expect(res.status).toBe(201);
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining(['email', 'name', 'id']),
      );
      expect(Object.keys(res.headers)).toEqual(
        expect.arrayContaining(['set-cookie']),
      );
    });

    it(`should return 400 if client's inputs are invalid`, async () => {
      name = new Array(52).fill('a').join('');
      password = '';
      email = new Array(247).fill('a').join('') + '@gmail.com';
      confirmPassword = '122';
      const res = await execute();

      expect(res.status).toBe(400);
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining([
          'email',
          'name',
          'password',
          'confirmPassword',
        ]),
      );
    });

    it(`should return 400 if a user already exists in the database`, async () => {
      await User.create({ email, name, password }).save();
      const res = await execute();

      expect(res.status).toBe(400);
      expect(Object.keys(res.body)).toEqual(expect.arrayContaining(['email']));
    });
  });

  describe('POST /auth/login', () => {
    let name: string, email: string, password: string;

    const execute = async () => {
      return await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password });
    };

    beforeEach(async () => {
      name = 'Test';
      email = 'test@gmail.com';
      password = '123456';

      const hashedPassword = await bcrypt.hash(password, 12);
      await User.create({ name, email, password: hashedPassword }).save();
    });

    afterEach(async () => {
      await User.delete({});
    });

    it(`should return 200 if client's inputs are valid`, async () => {
      const res = await execute();

      expect(res.status).toBe(200);
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining(['email', 'name', 'id']),
      );
      expect(Object.keys(res.headers)).toEqual(
        expect.arrayContaining(['set-cookie']),
      );
    });

    it(`should return 400 if client's inputs are invalid`, async () => {
      email = new Array(247).fill('a').join('') + '@gmail.com';
      password = '1123';

      const res = await execute();

      expect(res.status).toBe(400);
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining(['email', 'password']),
      );
    });

    it(`should return 400 if a user with the email input does not exist in the database`, async () => {
      email = 'doesnotexist@gmail.com';

      const res = await execute();

      expect(res.status).toBe(400);
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining(['statusCode', 'message', 'error']),
      );
    });

    it(`should return 400 if a user's password and password input do not match`, async () => {
      password = 'notmatch';

      const res = await execute();

      expect(res.status).toBe(400);
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining(['statusCode', 'message', 'error']),
      );
    });
  });

  describe('POST /auth/logout', () => {
    let token: string, name: string, email: string;

    const execute = async () => {
      return await request
        .agent(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', [`${cookieName}=${token}`]);
    };

    beforeEach(async () => {
      name = 'Test';
      email = 'test@gmail.com';
      token = User.create({ email, name }).generateAccessToken(secret);
    });

    it(`should return 200 if client's inputs are valid`, async () => {
      const res = await execute();

      expect(res.status).toBe(200);
      expect(res.text.toLowerCase()).toContain('success');
      expect(Object.keys(res.headers)).toEqual(
        expect.arrayContaining(['set-cookie']),
      );
    });

    it(`should return 401 if client is not logged in`, async () => {
      token = '';

      const res = await execute();

      expect(res.status).toBe(401);
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining(['statusCode', 'message', 'error']),
      );
    });
  });
});
