import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingRoom } from './meeting-room.entity';
import { MeetingBooking } from './meeting-booking.entity';
import { MeetingExtensionRequest } from './meeting-extension-request.entity';
import { AccessPermission } from '../access/access-permission.entity';
import { Alert } from '../alert/alert.entity';
import { MeetingService } from './meeting.service';
import { MeetingController } from './meeting.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MeetingRoom, MeetingBooking, MeetingExtensionRequest, AccessPermission, Alert])],
  controllers: [MeetingController],
  providers: [MeetingService],
  exports: [MeetingService],
})
export class MeetingModule {}
