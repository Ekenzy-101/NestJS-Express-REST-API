import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { Request } from 'express';

import { AuthGuard } from '../auth/auth.guard';
import { PostDto } from './dto/post.dto';
import { Post as PostEntity } from './post.entity';
import {
  FastestValidationPipe,
  postSchema,
  idSchema,
} from '../utils/validation';
import { User } from '../users/user.entity';

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

  @Put(':id')
  @UseGuards(AuthGuard)
  async updatePost(
    @Body(new FastestValidationPipe(postSchema)) postDto: PostDto,
    @Param(new FastestValidationPipe(idSchema)) { id }: { id: string },
    @Req() req: Request,
  ) {
    let post = await PostEntity.findOne(id);
    if (!post) throw new NotFoundException('Post not found');

    const user = (req.user as unknown) as User;
    if (post.user.id !== user.id)
      throw new UnauthorizedException(
        'You are not authorized to update this post',
      );

    const result = await PostEntity.edit(id, postDto);
    return result.raw[0];
  }
}
