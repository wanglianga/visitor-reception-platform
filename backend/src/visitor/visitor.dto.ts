import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { VisitorStatus, IdType } from '../common/enums';

export class RegisterVisitorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  idNumber?: string;

  @IsEnum(IdType)
  @IsOptional()
  idType?: IdType;

  @IsString()
  @IsOptional()
  photo?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  accompanyCount?: number;

  @IsNumber()
  @IsOptional()
  appointmentId?: number;
}

export class UpdateVisitorDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  idNumber?: string;

  @IsEnum(IdType)
  @IsOptional()
  idType?: IdType;

  @IsString()
  @IsOptional()
  photo?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  accompanyCount?: number;
}
