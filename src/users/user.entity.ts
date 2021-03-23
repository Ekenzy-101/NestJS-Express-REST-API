import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import jwt from 'jsonwebtoken';

import { Post } from '../posts/post.entity';
@Entity({ name: 'users' })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ unique: true })
  email: string;

  @Column({ length: 50 })
  name: string;

  @Column('text')
  password: string;

  @OneToMany(() => Post, (post) => post.user)
  posts: Post;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  generateAccessToken(secret: string): string {
    const { id, email, name } = this;

    return jwt.sign({ id, email, name }, secret, {
      expiresIn: '1 day',
    });
  }
}
