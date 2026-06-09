import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsDateString, IsEnum } from 'class-validator';
import { MeetingRoomStatus, MeetingBookingStatus } from '../common/enums';

export class CreateMeetingRoomDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  floor: string;

  @IsNumber()
  capacity: number;

  @IsString()
  @IsOptional()
  equipment?: string;
}

export class UpdateMeetingRoomDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  floor?: string;

  @IsNumber()
  @IsOptional()
  capacity?: number;

  @IsString()
  @IsOptional()
  equipment?: string;

  @IsEnum(MeetingRoomStatus)
  @IsOptional()
  status?: MeetingRoomStatus;
}

export class CreateMeetingBookingDto {
  @IsNumber()
  meetingRoomId: number;

  @IsNumber()
  visitorId: number;

  @IsString()
  @IsNotEmpty()
  visitorName: string;

  @IsNumber()
  @IsOptional()
  appointmentId?: number;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsBoolean()
  @IsOptional()
  teaService?: boolean;

  @IsString()
  @IsOptional()
  equipmentNeeded?: string;
}

export class UpdateMeetingBookingDto {
  @IsEnum(MeetingBookingStatus)
  @IsOptional()
  status?: MeetingBookingStatus;

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsBoolean()
  @IsOptional()
  teaService?: boolean;

  @IsString()
  @IsOptional()
  equipmentNeeded?: string;
}

export class ExtendBookingDto {
  @IsDateString()
  newEndTime: string;
}
