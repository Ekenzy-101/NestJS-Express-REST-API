import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { Request } from 'express';

import { AuthGuard } from '../auth/auth.guard';
import { PostDto } from './dto/post.dto';
import { Post as PostEntity } from './post.entity';
import { FastestValidationPipe, postSchema } from '../utils/validation';

@Controller('posts')
export class PostsController {
  @Get()
  async getPosts() {
    return await PostEntity.find({ order: { updatedAt: 'DESC' } });
  }

  @Post()
  @UseGuards(AuthGuard)
  @UsePipes(new FastestValidationPipe(postSchema))
  async createPost(@Body() postDto: PostDto, @Req() req: Request) {
    return await PostEntity.create({ ...postDto, user: req.user }).save();
  }
}
