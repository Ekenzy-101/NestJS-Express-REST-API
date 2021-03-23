import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

export enum PostCategory {
  Education = 'Education',
  Sport = 'Sport',
  Politics = 'Politics',
}

@Entity({ name: 'posts' })
export class Post extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: PostCategory,
  })
  category: string;

  @Column('text')
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column()
  title: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  static edit(id: string, values: QueryDeepPartialEntity<Post>) {
    return this.createQueryBuilder()
      .update(Post)
      .set(values)
      .where('id = :id', { id })
      .returning('*')
      .execute();
  }
}
