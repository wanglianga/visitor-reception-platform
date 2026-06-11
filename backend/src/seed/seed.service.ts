import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeetingRoom } from '../meeting/meeting-room.entity';
import { SensitiveArea } from '../sensitive-area/sensitive-area.entity';
import { MeetingRoomStatus, SensitiveAreaType } from '../common/enums';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(MeetingRoom)
    private roomRepo: Repository<MeetingRoom>,
    @InjectRepository(SensitiveArea)
    private sensitiveAreaRepo: Repository<SensitiveArea>,
  ) {}

  async onModuleInit() {
    const roomCount = await this.roomRepo.count();
    if (roomCount === 0) {
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

    const sensitiveAreaCount = await this.sensitiveAreaRepo.count();
    if (sensitiveAreaCount === 0) {
      const sensitiveAreas = [
        { name: '研发中心', type: SensitiveAreaType.R_AND_D, floor: '5F', description: '核心研发区域，存放源代码和技术文档', departmentHead: '王建国', requireApproval: true },
        { name: '研发实验室', type: SensitiveAreaType.R_AND_D, floor: '6F', description: '研发测试实验室，含未公开产品原型', departmentHead: '王建国', requireApproval: true },
        { name: '主机房', type: SensitiveAreaType.SERVER_ROOM, floor: '7F', description: '核心服务器机房，包含生产环境设备', departmentHead: '赵志远', requireApproval: true },
        { name: '备份机房', type: SensitiveAreaType.SERVER_ROOM, floor: '7F', description: '灾备机房，存储核心数据备份', departmentHead: '赵志远', requireApproval: true },
        { name: '样品间A', type: SensitiveAreaType.SAMPLE_ROOM, floor: '8F', description: '未发布产品样品展示区', departmentHead: '李慧敏', requireApproval: true },
        { name: '样品间B', type: SensitiveAreaType.SAMPLE_ROOM, floor: '8F', description: '合作伙伴专属样品展示区', departmentHead: '李慧敏', requireApproval: true },
      ];

      for (const area of sensitiveAreas) {
        await this.sensitiveAreaRepo.save(this.sensitiveAreaRepo.create(area));
      }
    }
  }
}
