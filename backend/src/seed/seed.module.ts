import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingRoom } from '../meeting/meeting-room.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([MeetingRoom])],
  providers: [SeedService],
})
export class SeedModule {}
