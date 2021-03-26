import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import jwt from 'express-jwt';
import request from 'supertest';

import { PostsModule } from '../src/posts/posts.module';
import { User } from '../src/users/user.entity';
import { Post } from '../src/posts/post.entity';

describe('PostController (e2e)', () => {
  let app: INestApplication, secret: string, cookieName: string;

  let email: string, password: string, name: string, token: string, user: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PostsModule,
        ConfigModule.forRoot({ envFilePath: '.test.env', isGlobal: true }),
        TypeOrmModule.forRoot(),
      ],
    }).compile();

    secret = process.env.APP_ACCESS_SECRET!;
    cookieName = process.env.ACCESS_TOKEN_COOKIE_NAME!;

    app = moduleFixture.createNestApplication();
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

  beforeEach(async () => {
    email = 'test@gmail.com';
    password = '123456';
    name = 'test';
    user = await User.create({ email, password, name }).save();
    token = user.generateAccessToken(secret);
  });

  afterEach(async () => {
    await Post.delete({});
    await User.delete({});
  });

  afterAll(async () => {
    await app.close();
    await new Promise((resolve) => setTimeout(() => resolve(5), 10000));
  });

  describe('GET /posts', () => {
    const execute = async () => {
      return await request(app.getHttpServer()).get('/posts');
    };

    beforeEach(async () => {
      await Post.create({
        title: 'Title 1',
        content: 'Content 1',
        category: 'Education',
        user,
      }).save();
      await Post.create({
        title: 'Title 2',
        content: 'Content 2',
        category: 'Sport',
        user,
      }).save();
    });

    it('should return 200 with a list of latest posts', async () => {
      const res = await execute();

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(Object.values(res.body[0])).toEqual(
        expect.arrayContaining(['Title 2', 'Content 2', 'Sport']),
      );
      expect(Object.values(res.body[1])).toEqual(
        expect.arrayContaining(['Title 1', 'Content 1', 'Education']),
      );
    });
  });

  describe('POST /posts', () => {
    let title: string, category: string, content: string;

    const execute = async () => {
      return await request(app.getHttpServer())
        .post('/posts')
        .send({
          title,
          content,
          category,
        })
        .set('Cookie', [`${cookieName}=${token}`]);
    };

    beforeEach(() => {
      title = 'Title';
      content = 'Content';
      category = 'Education';
    });

    it('should return 200 if client is logged in and inputs are valid', async () => {
      const res = await execute();

      expect(res.status).toBe(201);
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining([
          'category',
          'content',
          'id',
          'title',
          'createdAt',
          'updatedAt',
        ]),
      );
    });

    it('should return 400 if client is logged in and inputs are invalid', async () => {
      title = '';
      content = '';
      category = 'test';

      const res = await execute();

      expect(res.status).toBe(400);
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining(['title', 'content', 'category']),
      );
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await execute();

      expect(res.status).toBe(401);
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining(['statusCode', 'message', 'error']),
      );
    });
  });

  describe('PUT /posts/:id', () => {
    let postId: string, title: string, category: string, content: string;
    const execute = async () => {
      return await request(app.getHttpServer())
        .put(`/posts/${postId}`)
        .send({
          title,
          content,
          category,
        })
        .set('Cookie', [`${cookieName}=${token}`]);
    };

    beforeEach(async () => {
      title = 'Updated Title';
      content = 'Updated Content';
      category = 'Sport';

      const { id } = await Post.create({
        title: 'Title',
        content: 'Content',
        category: 'Education',
        user,
      }).save();

      postId = id;
    });

    it('should return 200 with the updated post if inputs are valid', async () => {
      const res = await execute();

      expect(res.status).toBe(200);
      expect(Object.values(res.body)).toEqual(
        expect.arrayContaining([title, content, category]),
      );
    });

    it('should return 400 if inputs are invalid', async () => {
      title = '';
      content = '';
      category = 'test';

      const res = await execute();

      expect(res.status).toBe(400);
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining(['title', 'content', 'category']),
      );
    });

    it('should return 400 if postId is not a valid uuid', async () => {
      postId = '12';

      const res = await execute();

      expect(res.status).toBe(400);
      expect(Object.keys(res.body)).toEqual(expect.arrayContaining(['id']));
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await execute();

      expect(res.status).toBe(401);
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining(['error', 'message', 'statusCode']),
      );
    });

    it('should return 403 if auth user is not the author of the post', async () => {
      const user2 = await User.create({
        email: 'test2@gmail.com',
        name: 'Test2',
        password: '123456',
      }).save();
      token = user2.generateAccessToken(secret);

      const res = await execute();

      expect(res.status).toBe(403);
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining(['error', 'message', 'statusCode']),
      );
    });

    it('should return 404 if post with the given id is not found', async () => {
      await Post.delete(postId);

      const res = await execute();

      expect(res.status).toBe(404);
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining(['error', 'message', 'statusCode']),
      );
    });
  });

  describe('DELETE /posts/:id', () => {
    let postId: string;
    const execute = async () => {
      return await request(app.getHttpServer())
        .delete(`/posts/${postId}`)
        .set('Cookie', [`${cookieName}=${token}`]);
    };

    beforeEach(async () => {
      const { id } = await Post.create({
        title: 'Title',
        content: 'Content',
        category: 'Education',
        user,
      }).save();

      postId = id;
    });

    it('should return 200 if post is successfully deleted', async () => {
      const res = await execute();

      expect(res.status).toBe(200);
      expect(res.text.toLowerCase()).toContain('success');
    });

    it('should return 400 if postId is not a valid uuid', async () => {
      postId = '12';

      const res = await execute();

      expect(res.status).toBe(400);
      expect(Object.keys(res.body)).toEqual(expect.arrayContaining(['id']));
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';

      const res = await execute();

      expect(res.status).toBe(401);
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining(['error', 'message', 'statusCode']),
      );
    });

    it('should return 403 if auth user is not the author of the post', async () => {
      const user2 = await User.create({
        email: 'test2@gmail.com',
        name: 'Test2',
        password: '123456',
      }).save();
      token = user2.generateAccessToken(secret);

      const res = await execute();

      expect(res.status).toBe(403);
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining(['error', 'message', 'statusCode']),
      );
    });

    it('should return 404 if post with the given id is not found', async () => {
      await Post.delete(postId);

      const res = await execute();

      expect(res.status).toBe(404);
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining(['error', 'message', 'statusCode']),
      );
    });
  });
});
