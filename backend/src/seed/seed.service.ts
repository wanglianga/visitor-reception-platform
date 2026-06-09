import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeetingRoom } from '../meeting/meeting-room.entity';
import { MeetingRoomStatus } from '../common/enums';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(MeetingRoom)
    private roomRepo: Repository<MeetingRoom>,
  ) {}

  async onModuleInit() {
    const count = await this.roomRepo.count();
    if (count > 0) return;

    const rooms = [
      { name: '朝阳厅', floor: '1F', capacity: 8, equipment: '投影仪,白板', status: MeetingRoomStatus.AVAILABLE },
      { name: '星河厅', floor: '1F', capacity: 16, equipment: '投影仪,视频会议,白板', status: MeetingRoomStatus.AVAILABLE },
      { name: '碧海厅', floor: '2F', capacity: 6, equipment: '电视,白板', status: MeetingRoomStatus.AVAILABLE },
      { name: '清风厅', floor: '2F', capacity: 12, equipment: '投影仪,视频会议,音响', status: MeetingRoomStatus.AVAILABLE },
      { name: '明月厅', floor: '3F', capacity: 20, equipment: '投影仪,视频会议,音响,白板', status: MeetingRoomStatus.AVAILABLE },
      { name: '云轩厅', floor: '3F', capacity: 10, equipment: '投影仪,白板', status: MeetingRoomStatus.AVAILABLE },
      { name: '听雨阁', floor: '4F', capacity: 4, equipment: '电视', status: MeetingRoomStatus.AVAILABLE },
      { name: '望山阁', floor: '4F', capacity: 4, equipment: '电视', status: MeetingRoomStatus.AVAILABLE },
    ];

    for (const room of rooms) {
      await this.roomRepo.save(this.roomRepo.create(room));
    }
  }
}
