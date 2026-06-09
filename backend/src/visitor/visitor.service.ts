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

  async register(dto: RegisterVisitorDto): Promise<any> {
    const visitor = this.visitorRepo.create({
      name: dto.name,
      company: dto.company,
      phone: dto.phone,
      idNumber: dto.idNumber,
      idType: dto.idType || undefined,
      photo: dto.photo,
      accompanyCount: dto.accompanyCount || 0,
      appointmentId: dto.appointmentId || null,
      status: VisitorStatus.REGISTERED,
    });
    const saved = await this.visitorRepo.save(visitor);

    let idMismatch = false;

    if (dto.appointmentId) {
      const appointment = await this.appointmentRepo.findOne({ where: { id: dto.appointmentId } });
      if (appointment) {
        appointment.visitorId = saved.id;

        if (appointment.visitorName !== dto.name || appointment.visitorPhone !== dto.phone) {
          idMismatch = true;
          await this.alertRepo.save({
            type: AlertType.ID_MISMATCH,
            severity: AlertSeverity.HIGH,
            visitorId: saved.id,
            visitorName: saved.name,
            message: `访客 ${saved.name} 的证件信息与预约 #${dto.appointmentId} 不匹配，预约人: ${appointment.visitorName} (${appointment.visitorPhone})，实际: ${dto.name} (${dto.phone || '未提供'})`,
            handled: false,
          });
        }

        if (appointment.status === AppointmentStatus.PENDING) {
          appointment.status = AppointmentStatus.CONFIRMED;
        }

        await this.appointmentRepo.save(appointment);
      }
    } else {
      await this.alertRepo.save({
        type: AlertType.TEMPORARY_VISITOR,
        severity: AlertSeverity.MEDIUM,
        visitorId: saved.id,
        visitorName: saved.name,
        message: `访客 ${saved.name} 无预约直接到访登记，请核实身份`,
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

    return { ...saved, idMismatch };
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
