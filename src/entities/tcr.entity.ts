import { TcrStatus } from 'src/enums/tcrStatus.enum';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Officer } from './officer.entity';
import { TcrOfficerAllocation } from './tcrOfficerAllocation.entity';

@Entity()
export class Tcr {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'timestamptz', nullable: true })
  incidentDate!: Date;

  @Column()
  tcrNo!: string;

  @Column()
  stationId!: string;

  @Column()
  status!: TcrStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt!: Date;

  @Column()
  createdBy!: string;

  @Column({ type: 'varchar', nullable: true })
  approvedBy!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt!: Date | null;

  @Column({ type: 'decimal' })
  totalCaseAmount!: number;

  //   fund types

  @Column({ type: 'decimal' })
  specialFund!: number;

  @Column({ type: 'decimal' })
  consolidatedFund!: number;

  @Column({ type: 'decimal' })
  prosecutingOfficerFund!: number;

  @Column({ type: 'decimal' })
  detectingOfficerFund!: number;

  @Column({ type: 'decimal' })
  informantFund!: number;

  @Column({ type: 'decimal' })
  participationOfficerFund!: number;

  @Column({ type: 'decimal' })
  nonParticipationOfficerFund!: number;

  //   officer ids

  @ManyToMany(() => Officer)
  @JoinTable()
  detectingOfficers!: Officer[];

  @ManyToMany(() => Officer)
  @JoinTable()
  informant!: Officer[];

  @ManyToMany(() => Officer)
  @JoinTable()
  prosecutingOfficers!: Officer[];

  @ManyToMany(() => Officer)
  @JoinTable()
  participationOfficers!: Officer[];

  @ManyToMany(() => Officer)
  @JoinTable()
  others!: Officer[];

  @OneToMany(() => TcrOfficerAllocation, (allocation) => allocation.tcr)
  officerAllocations!: TcrOfficerAllocation[];
}
