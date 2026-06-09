import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, LessThan, MoreThan } from 'typeorm';
import { MeetingRoom } from './meeting-room.entity';
import { MeetingBooking } from './meeting-booking.entity';
import {
  CreateMeetingRoomDto,
  UpdateMeetingRoomDto,
  CreateMeetingBookingDto,
  UpdateMeetingBookingDto,
  ExtendBookingDto,
} from './meeting.dto';
import { MeetingRoomStatus, MeetingBookingStatus, AlertType, AlertSeverity } from '../common/enums';
import { Alert } from '../alert/alert.entity';

@Injectable()
export class MeetingService {
  constructor(
    @InjectRepository(MeetingRoom)
    private roomRepo: Repository<MeetingRoom>,
    @InjectRepository(MeetingBooking)
    private bookingRepo: Repository<MeetingBooking>,
    @InjectRepository(Alert)
    private alertRepo: Repository<Alert>,
  ) {}

  async findAllRooms(): Promise<MeetingRoom[]> {
    return this.roomRepo.find({ order: { createdAt: 'DESC' } });
  }

  async createRoom(dto: CreateMeetingRoomDto): Promise<MeetingRoom> {
    const room = this.roomRepo.create(dto);
    return this.roomRepo.save(room);
  }

  async updateRoom(id: number, dto: UpdateMeetingRoomDto): Promise<MeetingRoom> {
    const room = await this.roomRepo.findOne({ where: { id } });
    if (!room) throw new NotFoundException(`Meeting room #${id} not found`);
    Object.assign(room, dto);
    return this.roomRepo.save(room);
  }

  async findAllBookings(status?: MeetingBookingStatus): Promise<MeetingBooking[]> {
    const where: any = {};
    if (status) where.status = status;
    return this.bookingRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async createBooking(dto: CreateMeetingBookingDto): Promise<MeetingBooking> {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    const conflicts = await this.bookingRepo
      .createQueryBuilder('b')
      .where('b.meetingRoomId = :roomId', { roomId: dto.meetingRoomId })
      .andWhere('b.status NOT IN (:...excluded)', { excluded: [MeetingBookingStatus.CANCELLED, MeetingBookingStatus.COMPLETED] })
      .andWhere('b.startTime < :end AND b.endTime > :start', { start, end })
      .getCount();

    if (conflicts > 0) {
      await this.alertRepo.save({
        type: AlertType.MEETING_CONFLICT,
        severity: AlertSeverity.MEDIUM,
        visitorId: dto.visitorId,
        visitorName: dto.visitorName,
        message: `Meeting conflict detected for room #${dto.meetingRoomId}`,
        handled: false,
      });
      throw new BadRequestException('Meeting room has a time conflict');
    }

    const booking = this.bookingRepo.create({
      ...dto,
      startTime: start,
      endTime: end,
    });
    const saved = await this.bookingRepo.save(booking);

    await this.roomRepo.update(dto.meetingRoomId, { status: MeetingRoomStatus.OCCUPIED });

    return saved;
  }

  async updateBooking(id: number, dto: UpdateMeetingBookingDto): Promise<MeetingBooking> {
    const booking = await this.bookingRepo.findOne({ where: { id } });
    if (!booking) throw new NotFoundException(`Booking #${id} not found`);
    if (dto.startTime) booking.startTime = new Date(dto.startTime);
    if (dto.endTime) booking.endTime = new Date(dto.endTime);
    Object.assign(booking, { ...dto, startTime: booking.startTime, endTime: booking.endTime });

    if (dto.status === MeetingBookingStatus.CANCELLED || dto.status === MeetingBookingStatus.COMPLETED) {
      await this.roomRepo.update(booking.meetingRoomId, { status: MeetingRoomStatus.AVAILABLE });
    }

    return this.bookingRepo.save(booking);
  }

  async extendBooking(id: number, dto: ExtendBookingDto): Promise<MeetingBooking> {
    const booking = await this.bookingRepo.findOne({ where: { id } });
    if (!booking) throw new NotFoundException(`Booking #${id} not found`);

    const newEnd = new Date(dto.newEndTime);
    if (newEnd <= booking.endTime) {
      throw new BadRequestException('New end time must be after current end time');
    }

    const conflicts = await this.bookingRepo
      .createQueryBuilder('b')
      .where('b.meetingRoomId = :roomId', { roomId: booking.meetingRoomId })
      .andWhere('b.id != :id', { id: booking.id })
      .andWhere('b.status NOT IN (:...excluded)', { excluded: [MeetingBookingStatus.CANCELLED, MeetingBookingStatus.COMPLETED] })
      .andWhere('b.startTime < :end AND b.endTime > :start', { start: booking.endTime, end: newEnd })
      .getCount();

    if (conflicts > 0) {
      throw new BadRequestException('Cannot extend: meeting room has a time conflict');
    }

    booking.originalEndTime = booking.endTime;
    booking.endTime = newEnd;
    booking.extended = true;
    return this.bookingRepo.save(booking);
  }

  async checkConflicts(roomId: number, startTime: string, endTime: string): Promise<MeetingBooking[]> {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return this.bookingRepo
      .createQueryBuilder('b')
      .where('b.meetingRoomId = :roomId', { roomId })
      .andWhere('b.status NOT IN (:...excluded)', { excluded: [MeetingBookingStatus.CANCELLED, MeetingBookingStatus.COMPLETED] })
      .andWhere('b.startTime < :end AND b.endTime > :start', { start, end })
      .getMany();
  }
}
