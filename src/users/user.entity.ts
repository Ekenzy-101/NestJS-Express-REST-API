import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import jwt from 'jsonwebtoken';

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

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  generateAccessToken(secret: string): string {
    const { id, email, name } = this;

    return jwt.sign({ id, email, name }, secret, {
      expiresIn: '1 day',
    });
  }
}
