import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
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
