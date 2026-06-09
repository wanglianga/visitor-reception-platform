import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Visitor } from './visitor.entity';
import { AccessPermission } from '../access/access-permission.entity';
import { Appointment } from '../appointment/appointment.entity';
import { Alert } from '../alert/alert.entity';
import { RegisterVisitorDto, UpdateVisitorDto } from './visitor.dto';
import { VisitorStatus, AppointmentStatus, AccessPermissionStatus, AlertType, AlertSeverity } from '../common/enums';

@Injectable()
export class VisitorService {
  constructor(
    @InjectRepository(Visitor)
    private visitorRepo: Repository<Visitor>,
    @InjectRepository(AccessPermission)
    private permissionRepo: Repository<AccessPermission>,
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
    @InjectRepository(Alert)
    private alertRepo: Repository<Alert>,
  ) {}

  async register(dto: RegisterVisitorDto): Promise<Visitor> {
    const visitor = this.visitorRepo.create({
      name: dto.name,
      company: dto.company,
      phone: dto.phone,
      idNumber: dto.idNumber,
      idType: dto.idType || undefined,
      photo: dto.photo,
      accompanyCount: dto.accompanyCount || 0,
      status: VisitorStatus.REGISTERED,
    });
    const saved = await this.visitorRepo.save(visitor);

    if (dto.appointmentId) {
      const appointment = await this.appointmentRepo.findOne({ where: { id: dto.appointmentId } });
      if (appointment) {
        if (appointment.visitorName !== dto.name || appointment.visitorPhone !== dto.phone) {
          await this.alertRepo.save({
            type: AlertType.ID_MISMATCH,
            severity: AlertSeverity.HIGH,
            visitorId: saved.id,
            visitorName: saved.name,
            message: `Visitor info does not match appointment #${dto.appointmentId}`,
            handled: false,
          });
        } else {
          appointment.visitorId = saved.id;
          appointment.status = AppointmentStatus.CONFIRMED;
          await this.appointmentRepo.save(appointment);
        }
      }
    } else {
      await this.alertRepo.save({
        type: AlertType.TEMPORARY_VISITOR,
        severity: AlertSeverity.MEDIUM,
        visitorId: saved.id,
        visitorName: saved.name,
        message: `Temporary visitor registered without appointment`,
        handled: false,
      });
    }

    const now = new Date();
    const validUntil = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    await this.permissionRepo.save({
      visitorId: saved.id,
      visitorName: saved.name,
      allowedFloors: '1',
      gateEnabled: true,
      validFrom: now,
      validUntil: validUntil,
      status: AccessPermissionStatus.ACTIVE,
    });

    return saved;
  }

  async findAll(status?: VisitorStatus): Promise<Visitor[]> {
    const where: any = {};
    if (status) where.status = status;
    return this.visitorRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<Visitor> {
    const visitor = await this.visitorRepo.findOne({ where: { id } });
    if (!visitor) throw new NotFoundException(`Visitor #${id} not found`);
    return visitor;
  }

  async update(id: number, dto: UpdateVisitorDto): Promise<Visitor> {
    const visitor = await this.findOne(id);
    Object.assign(visitor, dto);
    return this.visitorRepo.save(visitor);
  }

  async checkout(id: number): Promise<Visitor> {
    const visitor = await this.findOne(id);
    visitor.status = VisitorStatus.LEFT;
    await this.visitorRepo.save(visitor);

    await this.permissionRepo.update(
      { visitorId: id, status: AccessPermissionStatus.ACTIVE },
      { status: AccessPermissionStatus.REVOKED },
    );

    return visitor;
  }
}
