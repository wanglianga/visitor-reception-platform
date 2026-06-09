import { Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { MeetingService } from './meeting.service';
import {
  CreateMeetingRoomDto,
  UpdateMeetingRoomDto,
  CreateMeetingBookingDto,
  UpdateMeetingBookingDto,
  ExtendBookingDto,
} from './meeting.dto';
import { MeetingBookingStatus } from '../common/enums';

@Controller()
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  @Get('meeting-rooms')
  findAllRooms() {
    return this.meetingService.findAllRooms();
  }

  @Post('meeting-rooms')
  createRoom(@Body() dto: CreateMeetingRoomDto) {
    return this.meetingService.createRoom(dto);
  }

  @Patch('meeting-rooms/:id')
  updateRoom(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMeetingRoomDto) {
    return this.meetingService.updateRoom(id, dto);
  }

  @Get('meeting-bookings')
  findAllBookings(@Query('status') status?: MeetingBookingStatus) {
    return this.meetingService.findAllBookings(status);
  }

  @Post('meeting-bookings')
  createBooking(@Body() dto: CreateMeetingBookingDto) {
    return this.meetingService.createBooking(dto);
  }

  @Patch('meeting-bookings/:id')
  updateBooking(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMeetingBookingDto) {
    return this.meetingService.updateBooking(id, dto);
  }

  @Post('meeting-bookings/:id/extend')
  extendBooking(@Param('id', ParseIntPipe) id: number, @Body() dto: ExtendBookingDto) {
    return this.meetingService.extendBooking(id, dto);
  }

  @Get('meeting-bookings/conflicts')
  checkConflicts(
    @Query('roomId', ParseIntPipe) roomId: number,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ) {
    return this.meetingService.checkConflicts(roomId, startTime, endTime);
  }
}
