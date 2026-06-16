import {
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Officer } from './officer.entity';
import { Station } from './station.entity';

@Entity()
export class OfficerStationAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Officer, (officer) => officer.id)
  officer!: Officer;

  @ManyToOne(() => Station, (station) => station.id)
  station!: Station;

  @DeleteDateColumn()
  deletedAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
