import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OfficerStationAssignment } from './officerStationAssignment.entity';
import { Designation } from './designation.entity';

@Entity()
export class Officer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  code!: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  basicSalary!: number;

  @OneToMany(
    () => OfficerStationAssignment,
    (assignment) => assignment.officer,
    { cascade: ['insert', 'update'] },
  )
  stations!: OfficerStationAssignment[];

  @OneToOne(() => Designation)
  @JoinColumn()
  designation!: Designation;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt!: Date;

  @Column()
  createdBy!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  // tcrs
}
