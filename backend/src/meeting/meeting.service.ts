import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, LessThan, MoreThan } from 'typeorm';
import { MeetingRoom } from './meeting-room.entity';
import { MeetingBooking } from './meeting-booking.entity';
import { MeetingExtensionRequest } from './meeting-extension-request.entity';
import { AccessPermission } from '../access/access-permission.entity';
import {
  CreateMeetingRoomDto,
  UpdateMeetingRoomDto,
  CreateMeetingBookingDto,
  UpdateMeetingBookingDto,
  ExtendBookingDto,
  HandleExtensionRequestDto,
  ConfirmVisitorStayDto,
} from './meeting.dto';
import { MeetingRoomStatus, MeetingBookingStatus, MeetingExtensionStatus, AlertType, AlertSeverity, AccessPermissionStatus } from '../common/enums';
import { Alert } from '../alert/alert.entity';

@Injectable()
export class MeetingService {
  constructor(
    @InjectRepository(MeetingRoom)
    private roomRepo: Repository<MeetingRoom>,
    @InjectRepository(MeetingBooking)
    private bookingRepo: Repository<MeetingBooking>,
    @InjectRepository(MeetingExtensionRequest)
    private extensionRequestRepo: Repository<MeetingExtensionRequest>,
    @InjectRepository(AccessPermission)
    private permissionRepo: Repository<AccessPermission>,
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

    const room = await this.roomRepo.findOne({ where: { id: dto.meetingRoomId } });
    const roomName = room?.name || `#${dto.meetingRoomId}`;

    const conflictingBookings = await this.bookingRepo
      .createQueryBuilder('b')
      .where('b.meetingRoomId = :roomId', { roomId: dto.meetingRoomId })
      .andWhere('b.status NOT IN (:...excluded)', { excluded: [MeetingBookingStatus.CANCELLED, MeetingBookingStatus.COMPLETED] })
      .andWhere('b.startTime < :end AND b.endTime > :start', { start, end })
      .getMany();

    if (conflictingBookings.length > 0) {
      const conflictInfo = conflictingBookings
        .map((b) => `${b.visitorName} (${b.startTime.toISOString()} - ${b.endTime.toISOString()})`)
        .join(', ');

      await this.alertRepo.save({
        type: AlertType.MEETING_CONFLICT,
        severity: AlertSeverity.MEDIUM,
        visitorId: dto.visitorId,
        visitorName: dto.visitorName,
        message: `会议室 ${roomName} 存在时间冲突：访客 ${dto.visitorName} 预约时段 (${start.toLocaleString('zh-CN')} - ${end.toLocaleString('zh-CN')}) 与已有预约冲突: ${conflictInfo}`,
        handled: false,
      });
      throw new BadRequestException(`会议室 ${roomName} 存在时间冲突，已生成冲突告警`);
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

  async requestExtension(bookingId: number, dto: ExtendBookingDto): Promise<MeetingExtensionRequest> {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException(`Booking #${bookingId} not found`);

    const newEnd = new Date(dto.newEndTime);
    if (newEnd <= booking.endTime) {
      throw new BadRequestException('新结束时间必须晚于当前结束时间');
    }

    const room = await this.roomRepo.findOne({ where: { id: booking.meetingRoomId } });
    const roomName = room?.name || `#${booking.meetingRoomId}`;

    const conflictingBookings = await this.bookingRepo
      .createQueryBuilder('b')
      .where('b.meetingRoomId = :roomId', { roomId: booking.meetingRoomId })
      .andWhere('b.id != :id', { id: booking.id })
      .andWhere('b.status NOT IN (:...excluded)', { excluded: [MeetingBookingStatus.CANCELLED, MeetingBookingStatus.COMPLETED] })
      .andWhere('b.startTime < :end AND b.endTime > :start', { start: booking.endTime, end: newEnd })
      .getMany();

    const hasConflict = conflictingBookings.length > 0;

    let suggestedRoom: MeetingRoom | null = null;
    if (hasConflict) {
      const allRooms = await this.roomRepo.find({
        where: { status: MeetingRoomStatus.AVAILABLE },
      });

      for (const candidateRoom of allRooms) {
        if (candidateRoom.id === booking.meetingRoomId) continue;
        if (candidateRoom.capacity < 1) continue;

        const candidateConflicts = await this.bookingRepo
          .createQueryBuilder('b')
          .where('b.meetingRoomId = :roomId', { roomId: candidateRoom.id })
          .andWhere('b.status NOT IN (:...excluded)', { excluded: [MeetingBookingStatus.CANCELLED, MeetingBookingStatus.COMPLETED] })
          .andWhere('b.startTime < :end AND b.endTime > :start', { start: booking.startTime, end: newEnd })
          .getCount();

        if (candidateConflicts === 0) {
          suggestedRoom = candidateRoom;
          break;
        }
      }
    }

    const extensionRequest = this.extensionRequestRepo.create({
      bookingId,
      visitorId: booking.visitorId,
      visitorName: booking.visitorName,
      originalEndTime: booking.endTime,
      requestedEndTime: newEnd,
      status: MeetingExtensionStatus.PENDING,
      requestedBy: dto.requestedBy || '会议室管理员',
      requestedAt: new Date(),
      hasConflict,
      suggestedRoomId: suggestedRoom?.id || null,
      suggestedRoomName: suggestedRoom?.name || null,
    });
    const saved = await this.extensionRequestRepo.save(extensionRequest);

    if (hasConflict) {
      const conflictInfo = conflictingBookings
        .map((b) => `${b.visitorName} (${b.startTime.toLocaleString('zh-CN')} - ${b.endTime.toLocaleString('zh-CN')})`)
        .join(', ');

      await this.alertRepo.save({
        type: AlertType.MEETING_CONFLICT,
        severity: AlertSeverity.HIGH,
        visitorId: booking.visitorId,
        visitorName: booking.visitorName,
        message: `会议室延时冲突：访客 ${booking.visitorName} 在 ${roomName} 申请延时至 ${newEnd.toLocaleString('zh-CN')}，与下一场预约冲突: ${conflictInfo}${suggestedRoom ? `。建议更换至 ${suggestedRoom.name}(${suggestedRoom.floor})` : '。无可替换会议室，建议结束访客权限'}`,
        handled: false,
      });
    }

    await this.alertRepo.save({
      type: AlertType.MEETING_EXTENSION_REQUEST,
      severity: AlertSeverity.MEDIUM,
      visitorId: booking.visitorId,
      visitorName: booking.visitorName,
      message: `会议延时申请：会议室管理员为访客 ${booking.visitorName} 申请延时（${booking.endTime.toLocaleString('zh-CN')} → ${newEnd.toLocaleString('zh-CN')}），需被访员工确认访客继续停留${hasConflict ? '。存在下一场会议冲突' : ''}`,
      handled: false,
    });

    return saved;
  }

  async handleExtensionRequest(id: number, dto: HandleExtensionRequestDto): Promise<MeetingExtensionRequest> {
    const request = await this.extensionRequestRepo.findOne({ where: { id } });
    if (!request) throw new NotFoundException(`Extension request #${id} not found`);
    if (request.status !== MeetingExtensionStatus.PENDING) {
      throw new BadRequestException(`Extension request #${id} is not pending`);
    }

    request.status = dto.status;

    if (dto.status === MeetingExtensionStatus.APPROVED) {
      const booking = await this.bookingRepo.findOne({ where: { id: request.bookingId } });
      if (!booking) throw new NotFoundException(`Booking #${request.bookingId} not found`);

      if (dto.roomChanged && dto.suggestedRoomId) {
        const newRoom = await this.roomRepo.findOne({ where: { id: dto.suggestedRoomId } });
        if (!newRoom) throw new NotFoundException(`Room #${dto.suggestedRoomId} not found`);

        await this.roomRepo.update(booking.meetingRoomId, { status: MeetingRoomStatus.AVAILABLE });

        booking.meetingRoomId = dto.suggestedRoomId;
        booking.originalEndTime = booking.endTime;
        booking.endTime = request.requestedEndTime;
        booking.extended = true;
        await this.bookingRepo.save(booking);

        await this.roomRepo.update(dto.suggestedRoomId, { status: MeetingRoomStatus.OCCUPIED });
      } else {
        booking.originalEndTime = booking.endTime;
        booking.endTime = request.requestedEndTime;
        booking.extended = true;
        await this.bookingRepo.save(booking);
      }

      const permission = await this.permissionRepo.findOne({
        where: { visitorId: request.visitorId, status: AccessPermissionStatus.ACTIVE },
      });
      if (permission && permission.validUntil < request.requestedEndTime) {
        permission.validUntil = request.requestedEndTime;
        await this.permissionRepo.save(permission);
      }
    } else {
      request.rejectedReason = dto.rejectedReason || null;
    }

    return this.extensionRequestRepo.save(request);
  }

  async confirmVisitorStay(id: number, dto: ConfirmVisitorStayDto): Promise<MeetingExtensionRequest> {
    const request = await this.extensionRequestRepo.findOne({ where: { id } });
    if (!request) throw new NotFoundException(`Extension request #${id} not found`);

    request.employeeConfirmed = dto.confirmed;
    request.employeeConfirmedBy = dto.confirmedBy;
    request.employeeConfirmedAt = new Date();

    if (dto.confirmed) {
      request.status = MeetingExtensionStatus.APPROVED;
      const booking = await this.bookingRepo.findOne({ where: { id: request.bookingId } });
      if (booking) {
        if (request.hasConflict && request.suggestedRoomId) {
          const newRoom = await this.roomRepo.findOne({ where: { id: request.suggestedRoomId } });
          if (newRoom) {
            await this.roomRepo.update(booking.meetingRoomId, { status: MeetingRoomStatus.AVAILABLE });
            booking.meetingRoomId = request.suggestedRoomId;
            await this.roomRepo.update(request.suggestedRoomId, { status: MeetingRoomStatus.OCCUPIED });
          }
        }

        booking.originalEndTime = booking.endTime;
        booking.endTime = request.requestedEndTime;
        booking.extended = true;
        await this.bookingRepo.save(booking);

        const permission = await this.permissionRepo.findOne({
          where: { visitorId: request.visitorId, status: AccessPermissionStatus.ACTIVE },
        });
        if (permission && permission.validUntil < request.requestedEndTime) {
          permission.validUntil = request.requestedEndTime;
          await this.permissionRepo.save(permission);
        }
      }
    } else {
      request.status = MeetingExtensionStatus.REJECTED;
      request.rejectedReason = dto.note || '被访员工拒绝访客继续停留';
    }

    const extensionAlerts = await this.alertRepo.find({
      where: {
        visitorId: request.visitorId,
        type: AlertType.MEETING_EXTENSION_REQUEST,
        handled: false,
      },
    });
    for (const alert of extensionAlerts) {
      alert.handled = true;
      alert.handledBy = dto.confirmedBy;
      alert.handledAt = new Date();
      await this.alertRepo.save(alert);
    }

    return this.extensionRequestRepo.save(request);
  }

  async findAllExtensionRequests(status?: MeetingExtensionStatus): Promise<MeetingExtensionRequest[]> {
    const where: any = {};
    if (status) where.status = status;
    return this.extensionRequestRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findExtensionRequestsByVisitor(visitorId: number): Promise<MeetingExtensionRequest[]> {
    return this.extensionRequestRepo.find({
      where: { visitorId },
      order: { createdAt: 'DESC' },
    });
  }

  async extendBooking(id: number, dto: ExtendBookingDto): Promise<MeetingBooking> {
    const booking = await this.bookingRepo.findOne({ where: { id } });
    if (!booking) throw new NotFoundException(`Booking #${id} not found`);

    const newEnd = new Date(dto.newEndTime);
    if (newEnd <= booking.endTime) {
      throw new BadRequestException('新结束时间必须晚于当前结束时间');
    }

    const room = await this.roomRepo.findOne({ where: { id: booking.meetingRoomId } });
    const roomName = room?.name || `#${booking.meetingRoomId}`;

    const conflictingBookings = await this.bookingRepo
      .createQueryBuilder('b')
      .where('b.meetingRoomId = :roomId', { roomId: booking.meetingRoomId })
      .andWhere('b.id != :id', { id: booking.id })
      .andWhere('b.status NOT IN (:...excluded)', { excluded: [MeetingBookingStatus.CANCELLED, MeetingBookingStatus.COMPLETED] })
      .andWhere('b.startTime < :end AND b.endTime > :start', { start: booking.endTime, end: newEnd })
      .getMany();

    if (conflictingBookings.length > 0) {
      const conflictInfo = conflictingBookings
        .map((b) => `${b.visitorName} (${b.startTime.toISOString()} - ${b.endTime.toISOString()})`)
        .join(', ');

      await this.alertRepo.save({
        type: AlertType.MEETING_CONFLICT,
        severity: AlertSeverity.MEDIUM,
        visitorId: booking.visitorId,
        visitorName: booking.visitorName,
        message: `会议室 ${roomName} 延时冲突：访客 ${booking.visitorName} 申请延时至 ${newEnd.toLocaleString('zh-CN')}，与已有预约冲突: ${conflictInfo}`,
        handled: false,
      });
      throw new BadRequestException(`会议室 ${roomName} 延时时段存在冲突，已生成冲突告警`);
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
