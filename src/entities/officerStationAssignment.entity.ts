import { CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Officer } from './officer.entity';
import { Station } from './station.entity';

@Entity()
export class OfficerStationAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Officer, (officer) => officer.id, { cascade: true })
  officer!: Officer;

  @ManyToOne(() => Station, (station) => station.id, { cascade: true })
  station!: Station;

  @DeleteDateColumn()
  deletedAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
