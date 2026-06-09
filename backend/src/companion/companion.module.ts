import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Companion } from './companion.entity';
import { AccessPermission } from '../access/access-permission.entity';
import { Visitor } from '../visitor/visitor.entity';
import { Alert } from '../alert/alert.entity';
import { CompanionService } from './companion.service';
import { CompanionController } from './companion.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Companion, AccessPermission, Visitor, Alert])],
  controllers: [CompanionController],
  providers: [CompanionService],
  exports: [CompanionService],
})
export class CompanionModule {}
