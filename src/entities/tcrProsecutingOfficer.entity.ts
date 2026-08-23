import {
  Column,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tcr } from './tcr.entity';
import { Officer } from './officer.entity';

@Entity()
export class TcrProsecutingOfficer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Tcr, (tcr) => tcr.detectingOfficers, { cascade: true })
  tcr!: Tcr;

  @OneToOne(() => Officer, (officer) => officer.id)
  officer!: string;

  @Column({ type: 'decimal' })
  payment!: number;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt!: Date;
}
