import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OfficerStationAssignment } from './officerStationAssignment.entity';

@Entity()
export class Station {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  address!: string;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ nullable: true })
  createdBy!: string;

  @OneToMany(() => OfficerStationAssignment, (assignment) => assignment.station)
  assignments!: OfficerStationAssignment[];
}
