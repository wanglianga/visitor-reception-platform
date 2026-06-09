import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Companion } from './companion.entity';
import { AccessPermission } from '../access/access-permission.entity';
import { Visitor } from '../visitor/visitor.entity';
import { Alert } from '../alert/alert.entity';
import { RegisterCompanionDto, ConfirmCompanionDto, RejectCompanionDto } from './companion.dto';
import { CompanionStatus, AccessPermissionStatus, AlertType, AlertSeverity, IdType } from '../common/enums';

@Injectable()
export class CompanionService {
  constructor(
    @InjectRepository(Companion)
    private companionRepo: Repository<Companion>,
    @InjectRepository(AccessPermission)
    private permissionRepo: Repository<AccessPermission>,
    @InjectRepository(Visitor)
    private visitorRepo: Repository<Visitor>,
    @InjectRepository(Alert)
    private alertRepo: Repository<Alert>,
  ) {}

  async register(dto: RegisterCompanionDto): Promise<Companion> {
    const visitor = await this.visitorRepo.findOne({ where: { id: dto.visitorId } });
    if (!visitor) throw new NotFoundException(`Visitor #${dto.visitorId} not found`);

    const companion = this.companionRepo.create({
      name: dto.name,
      idType: dto.idType || IdType.ID_CARD,
      idNumber: dto.idNumber || null,
      relationship: dto.relationship,
      allowedFloors: dto.allowedFloors || '1F',
      visitorId: dto.visitorId,
      status: CompanionStatus.PENDING_CONFIRMATION,
    });
    const saved = await this.companionRepo.save(companion);

    const now = new Date();
    const validUntil = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    await this.permissionRepo.save({
      visitorId: dto.visitorId,
      companionId: saved.id,
      visitorName: `${saved.name}(随行)`,
      accompanyCount: 0,
      allowedFloors: '1F',
      gateEnabled: false,
      validFrom: now,
      validUntil: validUntil,
      status: AccessPermissionStatus.ACTIVE,
    });

    await this.alertRepo.save({
      type: AlertType.COMPANION_PENDING,
      severity: AlertSeverity.MEDIUM,
      visitorId: dto.visitorId,
      visitorName: visitor.name,
      message: `随行人员 ${saved.name} 已登记，与主访客关系: ${saved.relationship}，待被访员工确认。当前仅限前台等候区通行`,
      handled: false,
    });

    return saved;
  }

  async findByVisitor(visitorId: number): Promise<Companion[]> {
    return this.companionRepo.find({
      where: { visitorId },
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(status?: CompanionStatus): Promise<Companion[]> {
    const where: any = {};
    if (status) where.status = status;
    return this.companionRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async confirm(id: number, dto: ConfirmCompanionDto): Promise<Companion> {
    const companion = await this.companionRepo.findOne({ where: { id } });
    if (!companion) throw new NotFoundException(`Companion #${id} not found`);
    if (companion.status !== CompanionStatus.PENDING_CONFIRMATION) {
      throw new NotFoundException(`Companion #${id} is not pending confirmation`);
    }

    companion.status = CompanionStatus.CONFIRMED;
    companion.confirmedBy = dto.confirmedBy;
    companion.confirmedAt = new Date();
    await this.companionRepo.save(companion);

    await this.permissionRepo.update(
      { companionId: id, status: AccessPermissionStatus.ACTIVE },
      {
        allowedFloors: companion.allowedFloors,
        gateEnabled: true,
      },
    );

    const pendingAlerts = await this.alertRepo.find({
      where: {
        visitorId: companion.visitorId,
        type: AlertType.COMPANION_PENDING,
        handled: false,
      },
    });
    for (const alert of pendingAlerts) {
      if (alert.message.includes(companion.name)) {
        alert.handled = true;
        alert.handledBy = dto.confirmedBy;
        alert.handledAt = new Date();
        await this.alertRepo.save(alert);
      }
    }

    return companion;
  }

  async reject(id: number, dto: RejectCompanionDto): Promise<Companion> {
    const companion = await this.companionRepo.findOne({ where: { id } });
    if (!companion) throw new NotFoundException(`Companion #${id} not found`);
    if (companion.status !== CompanionStatus.PENDING_CONFIRMATION) {
      throw new NotFoundException(`Companion #${id} is not pending confirmation`);
    }

    companion.status = CompanionStatus.REJECTED;
    companion.confirmedBy = dto.rejectedBy;
    companion.confirmedAt = new Date();
    await this.companionRepo.save(companion);

    await this.permissionRepo.update(
      { companionId: id, status: AccessPermissionStatus.ACTIVE },
      { status: AccessPermissionStatus.REVOKED },
    );

    const pendingAlerts = await this.alertRepo.find({
      where: {
        visitorId: companion.visitorId,
        type: AlertType.COMPANION_PENDING,
        handled: false,
      },
    });
    for (const alert of pendingAlerts) {
      if (alert.message.includes(companion.name)) {
        alert.handled = true;
        alert.handledBy = dto.rejectedBy;
        alert.handledAt = new Date();
        await this.alertRepo.save(alert);
      }
    }

    return companion;
  }
}
