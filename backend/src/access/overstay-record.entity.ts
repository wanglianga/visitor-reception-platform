import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { OverstayResult } from '../common/enums';

@Entity('overstay_records')
export class OverstayRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  visitorId: number;

  @Column()
  visitorName: string;

  @Column({ nullable: true })
  lastFloor: string;

  @Column({ nullable: true })
  lastGate: string;

  @Column({ type: 'datetime', nullable: true })
  lastAccessTime: Date;

  @Column({ type: 'simple-enum', enum: OverstayResult, nullable: true })
  result: OverstayResult;

  @Column({ nullable: true })
  note: string;

  @Column({ nullable: true })
  handledBy: string;

  @Column({ type: 'datetime', nullable: true })
  handledAt: Date;

  @Column({ default: false })
  handled: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
