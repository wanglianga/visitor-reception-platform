import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessPermission } from './access-permission.entity';
import { AccessRecord } from './access-record.entity';
import { OverstayRecord } from './overstay-record.entity';
import { Visitor } from '../visitor/visitor.entity';
import { Alert } from '../alert/alert.entity';
import { AccessService } from './access.service';
import { AccessController } from './access.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AccessPermission, AccessRecord, OverstayRecord, Visitor, Alert])],
  controllers: [AccessController],
  providers: [AccessService],
  exports: [AccessService],
})
export class AccessModule {}
