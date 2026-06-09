import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { AlertType, AlertSeverity } from '../common/enums';

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'simple-enum', enum: AlertType })
  type: AlertType;

  @Column({ type: 'simple-enum', enum: AlertSeverity })
  severity: AlertSeverity;

  @Column({ nullable: true })
  visitorId: number;

  @Column({ nullable: true })
  visitorName: string;

  @Column()
  message: string;

  @Column({ default: false })
  handled: boolean;

  @Column({ nullable: true })
  handledBy: string;

  @Column({ type: 'datetime', nullable: true })
  handledAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
