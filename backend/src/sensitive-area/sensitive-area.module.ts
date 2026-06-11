import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SensitiveArea } from './sensitive-area.entity';
import { SensitiveAreaApproval } from './sensitive-area-approval.entity';
import { AccessPermission } from '../access/access-permission.entity';
import { Alert } from '../alert/alert.entity';
import { SensitiveAreaService } from './sensitive-area.service';
import { SensitiveAreaController } from './sensitive-area.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SensitiveArea, SensitiveAreaApproval, AccessPermission, Alert])],
  controllers: [SensitiveAreaController],
  providers: [SensitiveAreaService],
  exports: [SensitiveAreaService],
})
export class SensitiveAreaModule {}
