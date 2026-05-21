import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Designation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  designation!: string;

  @Column()
  fundShare!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;

  @Column()
  createdBy!: string;
}
