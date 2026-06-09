import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { VisitorStatus, IdType } from '../common/enums';

@Entity('visitors')
export class Visitor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  company: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  idNumber: string;

  @Column({ type: 'simple-enum', enum: IdType, default: IdType.ID_CARD })
  idType: IdType;

  @Column({ nullable: true })
  photo: string;

  @Column({ default: 0 })
  accompanyCount: number;

  @Column({ type: 'simple-enum', enum: VisitorStatus, default: VisitorStatus.PENDING })
  status: VisitorStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
