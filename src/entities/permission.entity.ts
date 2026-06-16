import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Permission as PermissionEnum } from 'src/enums/permissions.enum';

@Entity()
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: PermissionEnum;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt!: Date;

  @ManyToOne(() => User, (user) => user.permissions)
  user!: User;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ nullable: true, type: 'uuid' })
  createdBy!: string;
}
