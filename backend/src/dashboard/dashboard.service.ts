import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../appointment/appointment.entity';
import { Visitor } from '../visitor/visitor.entity';
import { AccessPermission } from '../access/access-permission.entity';
import { AccessRecord } from '../access/access-record.entity';
import { MeetingBooking } from '../meeting/meeting-booking.entity';
import { Alert } from '../alert/alert.entity';
import { AppointmentStatus, VisitorStatus, AccessPermissionStatus, AlertType } from '../common/enums';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
    @InjectRepository(Visitor)
    private visitorRepo: Repository<Visitor>,
    @InjectRepository(AccessPermission)
    private permissionRepo: Repository<AccessPermission>,
    @InjectRepository(AccessRecord)
    private recordRepo: Repository<AccessRecord>,
    @InjectRepository(MeetingBooking)
    private bookingRepo: Repository<MeetingBooking>,
    @InjectRepository(Alert)
    private alertRepo: Repository<Alert>,
  ) {}

  async getStats() {
    const [
      totalAppointments,
      pendingAppointments,
      todayVisitors,
      inBuildingVisitors,
      activePermissions,
      todayBookings,
      unhandledAlerts,
    ] = await Promise.all([
      this.appointmentRepo.count(),
      this.appointmentRepo.count({ where: { status: AppointmentStatus.PENDING } }),
      this.visitorRepo.count(),
      this.visitorRepo.count({ where: { status: VisitorStatus.IN_BUILDING } }),
      this.permissionRepo.count({ where: { status: AccessPermissionStatus.ACTIVE } }),
      this.bookingRepo.count(),
      this.alertRepo.count({ where: { handled: false } }),
    ]);

    return {
      totalAppointments,
      pendingAppointments,
      totalVisitors: todayVisitors,
      inBuildingVisitors,
      activePermissions,
      totalBookings: todayBookings,
      unhandledAlerts,
    };
  }

  async getRecentActivity() {
    const [recentAppointments, recentVisitors, recentAlerts] = await Promise.all([
      this.appointmentRepo.find({ order: { createdAt: 'DESC' }, take: 5 }),
      this.visitorRepo.find({ order: { createdAt: 'DESC' }, take: 5 }),
      this.alertRepo.find({ where: { handled: false }, order: { createdAt: 'DESC' }, take: 5 }),
    ]);

    return {
      recentAppointments,
      recentVisitors,
      recentAlerts,
    };
  }
}
