import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SensitiveArea } from './sensitive-area.entity';
import { SensitiveAreaApproval } from './sensitive-area-approval.entity';
import { AccessPermission } from '../access/access-permission.entity';
import { Alert } from '../alert/alert.entity';
import {
  CreateSensitiveAreaDto,
  UpdateSensitiveAreaDto,
  RequestSensitiveAccessDto,
  HandleSensitiveApprovalDto,
} from './sensitive-area.dto';
import { SensitiveAreaApprovalStatus, AccessPermissionStatus, AlertType, AlertSeverity } from '../common/enums';

@Injectable()
export class SensitiveAreaService {
  private readonly logger = new Logger(SensitiveAreaService.name);

  constructor(
    @InjectRepository(SensitiveArea)
    private areaRepo: Repository<SensitiveArea>,
    @InjectRepository(SensitiveAreaApproval)
    private approvalRepo: Repository<SensitiveAreaApproval>,
    @InjectRepository(AccessPermission)
    private permissionRepo: Repository<AccessPermission>,
    @InjectRepository(Alert)
    private alertRepo: Repository<Alert>,
  ) {}

  async createArea(dto: CreateSensitiveAreaDto): Promise<SensitiveArea> {
    const area = this.areaRepo.create(dto);
    return this.areaRepo.save(area);
  }

  async findAllAreas(): Promise<SensitiveArea[]> {
    return this.areaRepo.find({ order: { createdAt: 'DESC' } });
  }

  async updateArea(id: number, dto: UpdateSensitiveAreaDto): Promise<SensitiveArea> {
    const area = await this.areaRepo.findOne({ where: { id } });
    if (!area) throw new NotFoundException(`Sensitive area #${id} not found`);
    Object.assign(area, dto);
    return this.areaRepo.save(area);
  }

  async deleteArea(id: number): Promise<void> {
    const area = await this.areaRepo.findOne({ where: { id } });
    if (!area) throw new NotFoundException(`Sensitive area #${id} not found`);
    await this.areaRepo.remove(area);
  }

  async requestAccess(dto: RequestSensitiveAccessDto): Promise<SensitiveAreaApproval> {
    const area = await this.areaRepo.findOne({ where: { id: dto.sensitiveAreaId } });
    if (!area) throw new NotFoundException(`Sensitive area #${dto.sensitiveAreaId} not found`);

    if (!area.requireApproval) {
      return this.approvalRepo.save({
        visitorId: dto.visitorId,
        visitorName: dto.visitorName,
        sensitiveAreaId: dto.sensitiveAreaId,
        sensitiveAreaName: area.name,
        floor: area.floor,
        validFrom: new Date(dto.validFrom),
        validUntil: new Date(dto.validUntil),
        status: SensitiveAreaApprovalStatus.APPROVED,
        approvedBy: 'system',
        approvedAt: new Date(),
        reason: dto.reason || null,
        permissionId: dto.permissionId || null,
      });
    }

    const approval = this.approvalRepo.create({
      visitorId: dto.visitorId,
      visitorName: dto.visitorName,
      sensitiveAreaId: dto.sensitiveAreaId,
      sensitiveAreaName: area.name,
      floor: area.floor,
      validFrom: new Date(dto.validFrom),
      validUntil: new Date(dto.validUntil),
      status: SensitiveAreaApprovalStatus.PENDING,
      reason: dto.reason || null,
      permissionId: dto.permissionId || null,
    });
    const saved = await this.approvalRepo.save(approval);

    await this.alertRepo.save({
      type: AlertType.SENSITIVE_AREA_PENDING,
      severity: AlertSeverity.HIGH,
      visitorId: dto.visitorId,
      visitorName: dto.visitorName,
      message: `访客 ${dto.visitorName} 申请进入敏感区域「${area.name}」(${area.floor})，需部门负责人 ${area.departmentHead} 审批`,
      handled: false,
    });

    this.logger.log(`Sensitive area access requested: visitor ${dto.visitorName} -> ${area.name}`);
    return saved;
  }

  async handleApproval(id: number, dto: HandleSensitiveApprovalDto): Promise<SensitiveAreaApproval> {
    const approval = await this.approvalRepo.findOne({ where: { id } });
    if (!approval) throw new NotFoundException(`Approval #${id} not found`);
    if (approval.status !== SensitiveAreaApprovalStatus.PENDING) {
      throw new BadRequestException(`Approval #${id} is not pending`);
    }

    approval.status = dto.status;
    approval.approvedBy = dto.approvedBy;
    approval.approvedAt = new Date();
    if (dto.status === SensitiveAreaApprovalStatus.REJECTED) {
      approval.rejectedReason = dto.rejectedReason || null;
    }
    const saved = await this.approvalRepo.save(approval);

    if (dto.status === SensitiveAreaApprovalStatus.APPROVED) {
      const now = new Date();
      await this.permissionRepo.save({
        visitorId: approval.visitorId,
        visitorName: approval.visitorName,
        accompanyCount: 0,
        allowedFloors: approval.floor,
        gateEnabled: true,
        validFrom: approval.validFrom,
        validUntil: approval.validUntil,
        status: AccessPermissionStatus.ACTIVE,
      });
    } else {
      if (approval.permissionId) {
        await this.permissionRepo.update(
          { id: approval.permissionId, status: AccessPermissionStatus.ACTIVE },
          { allowedFloors: '' },
        );
      }
    }

    const pendingAlerts = await this.alertRepo.find({
      where: {
        visitorId: approval.visitorId,
        type: AlertType.SENSITIVE_AREA_PENDING,
        handled: false,
      },
    });
    for (const alert of pendingAlerts) {
      if (alert.message.includes(approval.sensitiveAreaName)) {
        alert.handled = true;
        alert.handledBy = dto.approvedBy;
        alert.handledAt = new Date();
        await this.alertRepo.save(alert);
      }
    }

    this.logger.log(`Sensitive area approval ${dto.status}: ${approval.visitorName} -> ${approval.sensitiveAreaName}`);
    return saved;
  }

  async findAllApprovals(status?: SensitiveAreaApprovalStatus): Promise<SensitiveAreaApproval[]> {
    const where: any = {};
    if (status) where.status = status;
    return this.approvalRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findApprovalsByVisitor(visitorId: number): Promise<SensitiveAreaApproval[]> {
    return this.approvalRepo.find({
      where: { visitorId },
      order: { createdAt: 'DESC' },
    });
  }

  async isAccessAllowed(visitorId: number, floor: string): Promise<boolean> {
    const sensitiveAreas = await this.areaRepo.find({ where: { floor } });
    if (sensitiveAreas.length === 0) return true;

    const now = new Date();
    for (const area of sensitiveAreas) {
      if (!area.requireApproval) continue;

      const approval = await this.approvalRepo
        .createQueryBuilder('a')
        .where('a.visitorId = :visitorId', { visitorId })
        .andWhere('a.sensitiveAreaId = :areaId', { areaId: area.id })
        .andWhere('a.status = :status', { status: SensitiveAreaApprovalStatus.APPROVED })
        .andWhere('a.validFrom <= :now AND a.validUntil >= :now', { now })
        .getOne();

      if (!approval) return false;
    }

    return true;
  }

  async checkAndRecordViolation(visitorId: number, visitorName: string, floor: string, gate: string): Promise<boolean> {
    const sensitiveAreas = await this.areaRepo.find({ where: { floor } });
    if (sensitiveAreas.length === 0) return false;

    const allowed = await this.isAccessAllowed(visitorId, floor);
    if (allowed) return false;

    const areaNames = sensitiveAreas.map((a) => a.name).join('、');
    await this.alertRepo.save({
      type: AlertType.SENSITIVE_ACCESS_VIOLATION,
      severity: AlertSeverity.HIGH,
      visitorId,
      visitorName,
      message: `安防异常：访客 ${visitorName} 在闸机 ${gate} 刷卡进入敏感区域楼层 ${floor}（${areaNames}），无有效审批或超出通行时间段`,
      handled: false,
    });

    this.logger.warn(`Sensitive area violation: visitor ${visitorName} at ${floor} gate ${gate}`);
    return true;
  }
}
