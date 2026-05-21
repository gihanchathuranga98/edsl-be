import { PasswordRecoveryRequestEnum } from 'src/enums/passwordRecoveryRequestStatus.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class PasswordRecoveryRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  email!: string;

  @Column()
  userId!: string;

  @Column()
  status!: PasswordRecoveryRequestEnum;

  @Column({ nullable: true })
  updatedBy!: string;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  updatedAt!: Date;

  @CreateDateColumn({
    type: 'timestamptz',
  })
  createdAt!: Date;
}
