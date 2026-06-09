import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../appointment/appointment.entity';
import { Visitor } from '../visitor/visitor.entity';
import { AccessPermission } from '../access/access-permission.entity';
import { AccessRecord } from '../access/access-record.entity';
import { MeetingBooking } from '../meeting/meeting-booking.entity';
import { Alert } from '../alert/alert.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Visitor, AccessPermission, AccessRecord, MeetingBooking, Alert])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
