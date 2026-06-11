import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AccessPermission } from './access-permission.entity';
import { AccessRecord } from './access-record.entity';
import { OverstayRecord } from './overstay-record.entity';
import { Visitor } from '../visitor/visitor.entity';
import { Alert } from '../alert/alert.entity';
import { SensitiveAreaService } from '../sensitive-area/sensitive-area.service';
import { CreateAccessPermissionDto, UpdateAccessPermissionDto, CreateAccessRecordDto, HandleOverstayDto } from './access.dto';
import { AccessPermissionStatus, VisitorStatus, AccessDirection, AlertType, AlertSeverity, OverstayResult } from '../common/enums';

@Injectable()
export class AccessService {
  private readonly logger = new Logger(AccessService.name);

  constructor(
    @InjectRepository(AccessPermission)
    private permissionRepo: Repository<AccessPermission>,
    @InjectRepository(AccessRecord)
    private recordRepo: Repository<AccessRecord>,
    @InjectRepository(OverstayRecord)
    private overstayRecordRepo: Repository<OverstayRecord>,
    @InjectRepository(Visitor)
    private visitorRepo: Repository<Visitor>,
    @InjectRepository(Alert)
    private alertRepo: Repository<Alert>,
    private sensitiveAreaService: SensitiveAreaService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkOverstay() {
    const now = new Date();
    const permissions = await this.permissionRepo.find({
      where: {
        status: AccessPermissionStatus.ACTIVE,
        validUntil: LessThan(now),
      },
    });

    for (const perm of permissions) {
      const visitor = await this.visitorRepo.findOne({
        where: { id: perm.visitorId, status: VisitorStatus.IN_BUILDING },
      });
      if (!visitor) continue;

      const existingAlert = await this.alertRepo.findOne({
        where: {
          visitorId: visitor.id,
          type: AlertType.OVERSTAY,
          handled: false,
        },
      });

      if (!existingAlert) {
        await this.alertRepo.save({
          type: AlertType.OVERSTAY,
          severity: AlertSeverity.HIGH,
          visitorId: visitor.id,
          visitorName: visitor.name,
          message: `访客 ${visitor.name} 已超过门禁有效期仍未离场`,
          handled: false,
        });
        this.logger.warn(`Overstay detected: visitor ${visitor.name} (ID: ${visitor.id})`);
      }
    }
  }

  async createPermission(dto: CreateAccessPermissionDto): Promise<AccessPermission> {
    const permission = this.permissionRepo.create({
      ...dto,
      validFrom: new Date(dto.validFrom),
      validUntil: new Date(dto.validUntil),
    });
    return this.permissionRepo.save(permission);
  }

  async findAllPermissions(status?: AccessPermissionStatus): Promise<AccessPermission[]> {
    const where: any = {};
    if (status) where.status = status;
    return this.permissionRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async updatePermission(id: number, dto: UpdateAccessPermissionDto): Promise<AccessPermission> {
    const permission = await this.permissionRepo.findOne({ where: { id } });
    if (!permission) throw new NotFoundException(`Permission #${id} not found`);
    if (dto.validFrom) permission.validFrom = new Date(dto.validFrom);
    if (dto.validUntil) permission.validUntil = new Date(dto.validUntil);
    Object.assign(permission, { ...dto, validFrom: permission.validFrom, validUntil: permission.validUntil });
    return this.permissionRepo.save(permission);
  }

  async createRecord(dto: CreateAccessRecordDto): Promise<AccessRecord> {
    const record = this.recordRepo.create({
      ...dto,
      timestamp: dto.timestamp ? new Date(dto.timestamp) : new Date(),
    });

    if (dto.direction === AccessDirection.IN) {
      await this.visitorRepo.update({ id: dto.visitorId }, { status: VisitorStatus.IN_BUILDING });

      const permission = await this.permissionRepo.findOne({
        where: { visitorId: dto.visitorId, status: AccessPermissionStatus.ACTIVE },
      });
      if (permission) {
        const allowedFloors = permission.allowedFloors.split(',');
        const now = new Date();
        const inTimeRange = now >= permission.validFrom && now <= permission.validUntil;
        const floorAllowed = allowedFloors.includes(dto.floor);

        if (!inTimeRange || !floorAllowed) {
          await this.alertRepo.save({
            type: AlertType.SENSITIVE_ACCESS_VIOLATION,
            severity: AlertSeverity.HIGH,
            visitorId: dto.visitorId,
            visitorName: dto.visitorName,
            message: `安防异常：访客 ${dto.visitorName} 在闸机 ${dto.gate} 刷卡进入 ${dto.floor}，${!inTimeRange ? '超出通行时间段' : ''}${!inTimeRange && !floorAllowed ? '，' : ''}${!floorAllowed ? `楼层不在允许范围内（允许: ${permission.allowedFloors}）` : ''}`,
            handled: false,
          });
          this.logger.warn(`Access violation: visitor ${dto.visitorName} at ${dto.floor} gate ${dto.gate}`);
        }
      }

      await this.sensitiveAreaService.checkAndRecordViolation(
        dto.visitorId,
        dto.visitorName,
        dto.floor,
        dto.gate,
      );
    } else if (dto.direction === AccessDirection.OUT) {
      await this.visitorRepo.update({ id: dto.visitorId }, { status: VisitorStatus.LEFT });
      await this.permissionRepo.update(
        { visitorId: dto.visitorId, status: AccessPermissionStatus.ACTIVE },
        { status: AccessPermissionStatus.REVOKED },
      );
    }

    return this.recordRepo.save(record);
  }

  async findAllRecords(): Promise<AccessRecord[]> {
    return this.recordRepo.find({ order: { timestamp: 'DESC' } });
  }

  async getOverstayed(): Promise<Visitor[]> {
    const now = new Date();
    const permissions = await this.permissionRepo.find({
      where: {
        status: AccessPermissionStatus.ACTIVE,
        validUntil: LessThan(now),
      },
    });
    const visitorIds = permissions.map((p) => p.visitorId);
    if (visitorIds.length === 0) return [];
    return this.visitorRepo.find({
      where: visitorIds.map((id) => ({ id, status: VisitorStatus.IN_BUILDING })),
    });
  }

  async getOverstayDetail(visitorId: number): Promise<any> {
    const visitor = await this.visitorRepo.findOne({ where: { id: visitorId } });
    if (!visitor) throw new NotFoundException(`Visitor #${visitorId} not found`);

    const lastRecord = await this.recordRepo.findOne({
      where: { visitorId },
      order: { timestamp: 'DESC' },
    });

    const permission = await this.permissionRepo.findOne({
      where: { visitorId, status: AccessPermissionStatus.ACTIVE },
    });

    return {
      visitor,
      lastAccessPoint: lastRecord
        ? { floor: lastRecord.floor, gate: lastRecord.gate, time: lastRecord.timestamp, direction: lastRecord.direction }
        : null,
      permission: permission || null,
    };
  }

  async handleOverstay(visitorId: number, dto: HandleOverstayDto): Promise<OverstayRecord> {
    const visitor = await this.visitorRepo.findOne({ where: { id: visitorId } });
    if (!visitor) throw new NotFoundException(`Visitor #${visitorId} not found`);

    const lastRecord = await this.recordRepo.findOne({
      where: { visitorId },
      order: { timestamp: 'DESC' },
    });

    const overstayRecord = this.overstayRecordRepo.create({
      visitorId,
      visitorName: visitor.name,
      lastFloor: lastRecord?.floor || null,
      lastGate: lastRecord?.gate || null,
      lastAccessTime: lastRecord?.timestamp || null,
      result: dto.result,
      note: dto.note || null,
      handledBy: dto.handledBy,
      handledAt: new Date(),
      handled: true,
    });

    const saved = await this.overstayRecordRepo.save(overstayRecord);

    if (dto.result === OverstayResult.FORGOT_BADGE || dto.result === OverstayResult.ABNORMAL) {
      await this.visitorRepo.update({ id: visitorId }, { status: VisitorStatus.LEFT });
      await this.permissionRepo.update(
        { visitorId, status: AccessPermissionStatus.ACTIVE },
        { status: AccessPermissionStatus.REVOKED },
      );
    }

    if (dto.result === OverstayResult.NORMAL_DELAY) {
      const permission = await this.permissionRepo.findOne({
        where: { visitorId, status: AccessPermissionStatus.ACTIVE },
      });
      if (permission) {
        const extendedUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
        permission.validUntil = extendedUntil;
        await this.permissionRepo.save(permission);
      }
    }

    const overstayAlerts = await this.alertRepo.find({
      where: { visitorId, type: AlertType.OVERSTAY, handled: false },
    });
    for (const alert of overstayAlerts) {
      alert.handled = true;
      alert.handledBy = dto.handledBy;
      alert.handledAt = new Date();
      await this.alertRepo.save(alert);
    }

    return saved;
  }

  async findAllOverstayRecords(): Promise<OverstayRecord[]> {
    return this.overstayRecordRepo.find({ order: { createdAt: 'DESC' } });
  }
}
