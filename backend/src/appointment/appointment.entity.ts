import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AppointmentStatus } from '../common/enums';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  visitorName: string;

  @Column()
  visitorCompany: string;

  @Column()
  visitorPhone: string;

  @Column()
  purpose: string;

  @Column({ type: 'datetime' })
  expectedTime: Date;

  @Column({ default: false })
  needMeetingRoom: boolean;

  @Column({ type: 'simple-enum', enum: AppointmentStatus, default: AppointmentStatus.PENDING })
  status: AppointmentStatus;

  @Column()
  employeeId: number;

  @Column()
  employeeName: string;

  @Column({ nullable: true })
  visitorId: number;

  @Column({ nullable: true })
  meetingRoomId: number;

  @Column({ nullable: true })
  remark: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
