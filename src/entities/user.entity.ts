import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Permission } from './permission.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  name!: string;

  @Index({ unique: true })
  @Column()
  email!: string;

  @Column()
  password!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;

  @Column({ nullable: true, type: 'uuid' })
  createdBy!: string;

  @Column({ nullable: true })
  refreshToken!: string;

  @Column({ nullable: true })
  refreshTokenCreatedAt!: Date;

  @OneToMany(() => Permission, (permission) => permission.user, {
    cascade: true,
    nullable: true,
  })
  permissions!: Permission[];
}
