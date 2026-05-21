import { FundTypesEnum } from 'src/enums/fundType.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Fund {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  fundType!: FundTypesEnum;

  @Column({ type: 'decimal' })
  fundShare!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column()
  updatedBy!: string;
}
