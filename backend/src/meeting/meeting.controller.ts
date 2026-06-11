import { Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { MeetingService } from './meeting.service';
import {
  CreateMeetingRoomDto,
  UpdateMeetingRoomDto,
  CreateMeetingBookingDto,
  UpdateMeetingBookingDto,
  ExtendBookingDto,
  HandleExtensionRequestDto,
  ConfirmVisitorStayDto,
} from './meeting.dto';
import { MeetingBookingStatus, MeetingExtensionStatus } from '../common/enums';

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

  @Post('meeting-bookings/:id/request-extension')
  requestExtension(@Param('id', ParseIntPipe) id: number, @Body() dto: ExtendBookingDto) {
    return this.meetingService.requestExtension(id, dto);
  }

  @Get('meeting-extension-requests')
  findAllExtensionRequests(@Query('status') status?: MeetingExtensionStatus) {
    return this.meetingService.findAllExtensionRequests(status);
  }

  @Get('meeting-extension-requests/visitor/:visitorId')
  findExtensionRequestsByVisitor(@Param('visitorId', ParseIntPipe) visitorId: number) {
    return this.meetingService.findExtensionRequestsByVisitor(visitorId);
  }

  @Patch('meeting-extension-requests/:id/handle')
  handleExtensionRequest(@Param('id', ParseIntPipe) id: number, @Body() dto: HandleExtensionRequestDto) {
    return this.meetingService.handleExtensionRequest(id, dto);
  }

  @Post('meeting-extension-requests/:id/confirm-stay')
  confirmVisitorStay(@Param('id', ParseIntPipe) id: number, @Body() dto: ConfirmVisitorStayDto) {
    return this.meetingService.confirmVisitorStay(id, dto);
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
