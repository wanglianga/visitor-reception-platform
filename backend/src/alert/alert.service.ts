import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from './alert.entity';
import { CreateAlertDto, HandleAlertDto } from './alert.dto';
import { AlertType } from '../common/enums';

@Injectable()
export class AlertService {
  constructor(
    @InjectRepository(Alert)
    private alertRepo: Repository<Alert>,
  ) {}

  async findAll(type?: AlertType, handled?: boolean): Promise<Alert[]> {
    const where: any = {};
    if (type) where.type = type;
    if (handled !== undefined) where.handled = handled;
    return this.alertRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async create(dto: CreateAlertDto): Promise<Alert> {
    const alert = this.alertRepo.create(dto);
    return this.alertRepo.save(alert);
  }

  async handle(id: number, dto: HandleAlertDto): Promise<Alert> {
    const alert = await this.alertRepo.findOne({ where: { id } });
    if (!alert) throw new NotFoundException(`Alert #${id} not found`);
    alert.handled = true;
    alert.handledBy = dto.handledBy;
    alert.handledAt = new Date();
    return this.alertRepo.save(alert);
  }
}
