import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { MeetingRoomStatus } from '../common/enums';

@Entity('meeting_rooms')
export class MeetingRoom {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  floor: string;

  @Column()
  capacity: number;

  @Column({ nullable: true })
  equipment: string;

  @Column({ type: 'simple-enum', enum: MeetingRoomStatus, default: MeetingRoomStatus.AVAILABLE })
  status: MeetingRoomStatus;

  @CreateDateColumn()
  createdAt: Date;
}
