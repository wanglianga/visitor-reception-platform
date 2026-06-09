import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { AccessPermissionStatus } from '../common/enums';

@Entity('access_permissions')
export class AccessPermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  visitorId: number;

  @Column()
  visitorName: string;

  @Column({ default: 0 })
  accompanyCount: number;

  @Column()
  allowedFloors: string;

  @Column({ default: true })
  gateEnabled: boolean;

  @Column({ type: 'datetime' })
  validFrom: Date;

  @Column({ type: 'datetime' })
  validUntil: Date;

  @Column({ type: 'simple-enum', enum: AccessPermissionStatus, default: AccessPermissionStatus.ACTIVE })
  status: AccessPermissionStatus;

  @CreateDateColumn()
  createdAt: Date;
}
