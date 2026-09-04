import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TcrOfficerRole } from 'src/enums/tcrOfficerRole.enum';
import { Officer } from './officer.entity';
import { Tcr } from './tcr.entity';

@Entity('tcr_officer_allocation')
@Index(['tcr', 'officer', 'role'], { unique: true })
export class TcrOfficerAllocation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Tcr, (tcr) => tcr.officerAllocations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tcrId' })
  tcr!: Tcr;

  @ManyToOne(() => Officer, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'officerId' })
  officer!: Officer;

  @Column({ type: 'varchar' })
  role!: TcrOfficerRole;

  @Column({ type: 'decimal' })
  designationFundShare!: number;

  @Column({ type: 'decimal' })
  payment!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
