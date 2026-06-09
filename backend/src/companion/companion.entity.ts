import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { CompanionStatus, IdType } from '../common/enums';

@Entity('companions')
export class Companion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'simple-enum', enum: IdType, default: IdType.ID_CARD })
  idType: IdType;

  @Column({ nullable: true })
  idNumber: string;

  @Column()
  relationship: string;

  @Column({ default: '1F' })
  allowedFloors: string;

  @Column()
  visitorId: number;

  @Column({ type: 'simple-enum', enum: CompanionStatus, default: CompanionStatus.PENDING_CONFIRMATION })
  status: CompanionStatus;

  @Column({ nullable: true })
  confirmedBy: string;

  @Column({ type: 'datetime', nullable: true })
  confirmedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
