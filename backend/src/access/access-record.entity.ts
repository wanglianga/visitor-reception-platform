import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { AccessDirection, AccessMethod } from '../common/enums';

@Entity('access_records')
export class AccessRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  visitorId: number;

  @Column()
  visitorName: string;

  @Column()
  floor: string;

  @Column()
  gate: string;

  @Column({ type: 'simple-enum', enum: AccessDirection })
  direction: AccessDirection;

  @Column({ type: 'simple-enum', enum: AccessMethod })
  method: AccessMethod;

  @Column({ type: 'datetime' })
  timestamp: Date;
}
