import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { AppointmentStatus } from '../common/enums';

export class CreateAppointmentDto {
  @IsString()
  @IsNotEmpty()
  visitorName: string;

  @IsString()
  @IsNotEmpty()
  visitorCompany: string;

  @IsString()
  @IsNotEmpty()
  visitorPhone: string;

  @IsString()
  @IsNotEmpty()
  purpose: string;

  @IsDateString()
  expectedTime: string;

  @IsBoolean()
  @IsOptional()
  needMeetingRoom?: boolean;

  @IsNumber()
  employeeId: number;

  @IsString()
  @IsNotEmpty()
  employeeName: string;

  @IsNumber()
  @IsOptional()
  visitorId?: number;

  @IsNumber()
  @IsOptional()
  meetingRoomId?: number;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class UpdateAppointmentDto {
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsNumber()
  @IsOptional()
  visitorId?: number;

  @IsNumber()
  @IsOptional()
  meetingRoomId?: number;
}
