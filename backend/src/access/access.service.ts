import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AccessPermission } from './access-permission.entity';
import { AccessRecord } from './access-record.entity';
import { Visitor } from '../visitor/visitor.entity';
import { Alert } from '../alert/alert.entity';
import { CreateAccessPermissionDto, UpdateAccessPermissionDto, CreateAccessRecordDto } from './access.dto';
import { AccessPermissionStatus, VisitorStatus, AccessDirection, AlertType, AlertSeverity } from '../common/enums';

@Injectable()
export class AccessService {
  private readonly logger = new Logger(AccessService.name);

  constructor(
    @InjectRepository(AccessPermission)
    private permissionRepo: Repository<AccessPermission>,
    @InjectRepository(AccessRecord)
    private recordRepo: Repository<AccessRecord>,
    @InjectRepository(Visitor)
    private visitorRepo: Repository<Visitor>,
    @InjectRepository(Alert)
    private alertRepo: Repository<Alert>,
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
}
