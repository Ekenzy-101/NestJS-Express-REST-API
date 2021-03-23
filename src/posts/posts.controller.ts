import { Controller, Get } from '@nestjs/common';
import { Post } from './post.entity';

@Controller('posts')
export class PostsController {
  @Get()
  async getPosts() {
    return await Post.find({ order: { updatedAt: 'DESC' } });
  }
}
