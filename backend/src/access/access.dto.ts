import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsDateString, IsEnum, Min } from 'class-validator';
import { AccessDirection, AccessMethod, AccessPermissionStatus } from '../common/enums';

export class CreateAccessPermissionDto {
  @IsNumber()
  visitorId: number;

  @IsString()
  @IsNotEmpty()
  visitorName: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  accompanyCount?: number;

  @IsString()
  @IsNotEmpty()
  allowedFloors: string;

  @IsBoolean()
  @IsOptional()
  gateEnabled?: boolean;

  @IsDateString()
  validFrom: string;

  @IsDateString()
  validUntil: string;
}

export class UpdateAccessPermissionDto {
  @IsString()
  @IsOptional()
  allowedFloors?: string;

  @IsBoolean()
  @IsOptional()
  gateEnabled?: boolean;

  @IsDateString()
  @IsOptional()
  validFrom?: string;

  @IsDateString()
  @IsOptional()
  validUntil?: string;

  @IsEnum(AccessPermissionStatus)
  @IsOptional()
  status?: AccessPermissionStatus;
}

export class CreateAccessRecordDto {
  @IsNumber()
  visitorId: number;

  @IsString()
  @IsNotEmpty()
  visitorName: string;

  @IsString()
  @IsNotEmpty()
  floor: string;

  @IsString()
  @IsNotEmpty()
  gate: string;

  @IsEnum(AccessDirection)
  direction: AccessDirection;

  @IsEnum(AccessMethod)
  method: AccessMethod;

  @IsDateString()
  @IsOptional()
  timestamp?: string;
}
