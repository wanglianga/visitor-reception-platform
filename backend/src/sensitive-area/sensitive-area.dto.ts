import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { SensitiveAreaType, SensitiveAreaApprovalStatus } from '../common/enums';

export class CreateSensitiveAreaDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(SensitiveAreaType)
  type: SensitiveAreaType;

  @IsString()
  @IsNotEmpty()
  floor: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  departmentHead: string;
}

export class UpdateSensitiveAreaDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(SensitiveAreaType)
  @IsOptional()
  type?: SensitiveAreaType;

  @IsString()
  @IsOptional()
  floor?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  departmentHead?: string;
}

export class RequestSensitiveAccessDto {
  @IsNumber()
  visitorId: number;

  @IsString()
  @IsNotEmpty()
  visitorName: string;

  @IsNumber()
  sensitiveAreaId: number;

  @IsDateString()
  validFrom: string;

  @IsDateString()
  validUntil: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsNumber()
  @IsOptional()
  permissionId?: number;
}

export class HandleSensitiveApprovalDto {
  @IsEnum(SensitiveAreaApprovalStatus)
  status: SensitiveAreaApprovalStatus;

  @IsString()
  @IsNotEmpty()
  approvedBy: string;

  @IsString()
  @IsOptional()
  rejectedReason?: string;
}
