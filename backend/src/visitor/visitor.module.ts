import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Visitor } from './visitor.entity';
import { AccessPermission } from '../access/access-permission.entity';
import { Appointment } from '../appointment/appointment.entity';
import { Alert } from '../alert/alert.entity';
import { VisitorService } from './visitor.service';
import { VisitorController } from './visitor.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Visitor, AccessPermission, Appointment, Alert])],
  controllers: [VisitorController],
  providers: [VisitorService],
  exports: [VisitorService],
})
export class VisitorModule {}
