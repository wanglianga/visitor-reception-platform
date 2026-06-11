import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { MeetingExtensionStatus } from '../common/enums';

@Entity('meeting_extension_requests')
export class MeetingExtensionRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  bookingId: number;

  @Column()
  visitorId: number;

  @Column()
  visitorName: string;

  @Column({ type: 'datetime' })
  originalEndTime: Date;

  @Column({ type: 'datetime' })
  requestedEndTime: Date;

  @Column({ type: 'simple-enum', enum: MeetingExtensionStatus, default: MeetingExtensionStatus.PENDING })
  status: MeetingExtensionStatus;

  @Column({ nullable: true })
  employeeConfirmedBy: string;

  @Column({ type: 'datetime', nullable: true })
  employeeConfirmedAt: Date;

  @Column({ default: false })
  employeeConfirmed: boolean;

  @Column({ nullable: true })
  requestedBy: string;

  @Column({ type: 'datetime', nullable: true })
  requestedAt: Date;

  @Column({ nullable: true })
  rejectedReason: string;

  @Column({ default: false })
  hasConflict: boolean;

  @Column({ nullable: true })
  suggestedRoomId: number;

  @Column({ nullable: true })
  suggestedRoomName: string;

  @Column({ default: false })
  roomChanged: boolean;

  @Column({ nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
