import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { IdType } from '../common/enums';

export class RegisterCompanionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(IdType)
  @IsOptional()
  idType?: IdType;

  @IsString()
  @IsOptional()
  idNumber?: string;

  @IsString()
  @IsNotEmpty()
  relationship: string;

  @IsString()
  @IsOptional()
  allowedFloors?: string;

  @IsNumber()
  visitorId: number;
}

export class ConfirmCompanionDto {
  @IsString()
  @IsNotEmpty()
  confirmedBy: string;
}

export class RejectCompanionDto {
  @IsString()
  @IsNotEmpty()
  rejectedBy: string;
}
