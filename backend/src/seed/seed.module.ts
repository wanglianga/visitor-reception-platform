import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingRoom } from '../meeting/meeting-room.entity';
import { SensitiveArea } from '../sensitive-area/sensitive-area.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([MeetingRoom, SensitiveArea])],
  providers: [SeedService],
})
export class SeedModule {}
