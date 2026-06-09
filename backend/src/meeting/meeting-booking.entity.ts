import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { MeetingBookingStatus } from '../common/enums';

@Entity('meeting_bookings')
export class MeetingBooking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  meetingRoomId: number;

  @Column()
  visitorId: number;

  @Column()
  visitorName: string;

  @Column({ nullable: true })
  appointmentId: number;

  @Column({ type: 'datetime' })
  startTime: Date;

  @Column({ type: 'datetime' })
  endTime: Date;

  @Column({ default: false })
  teaService: boolean;

  @Column({ nullable: true })
  equipmentNeeded: string;

  @Column({ default: false })
  extended: boolean;

  @Column({ type: 'datetime', nullable: true })
  originalEndTime: Date;

  @Column({ type: 'simple-enum', enum: MeetingBookingStatus, default: MeetingBookingStatus.PENDING })
  status: MeetingBookingStatus;

  @CreateDateColumn()
  createdAt: Date;
}
