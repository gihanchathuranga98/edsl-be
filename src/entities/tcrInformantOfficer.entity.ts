import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tcr } from './tcr.entity';
import { Officer } from './officer.entity';

@Entity('tcr_informant_officer_payment')
export class TcrInformantOfficer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Tcr, { cascade: true })
  tcr!: Tcr;

  @ManyToOne(() => Officer, { nullable: true })
  @JoinColumn({ name: 'officerId' })
  officer?: Officer;

  @Column({ type: 'decimal', nullable: true })
  payment!: number;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt!: Date;
}
