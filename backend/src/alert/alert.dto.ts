import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsBoolean } from 'class-validator';
import { AlertType, AlertSeverity } from '../common/enums';

export class CreateAlertDto {
  @IsEnum(AlertType)
  type: AlertType;

  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @IsNumber()
  @IsOptional()
  visitorId?: number;

  @IsString()
  @IsOptional()
  visitorName?: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

export class HandleAlertDto {
  @IsString()
  @IsNotEmpty()
  handledBy: string;
}
