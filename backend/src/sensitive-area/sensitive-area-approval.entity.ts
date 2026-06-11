import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { SensitiveAreaApprovalStatus } from '../common/enums';

@Entity('sensitive_area_approvals')
export class SensitiveAreaApproval {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  visitorId: number;

  @Column()
  visitorName: string;

  @Column()
  sensitiveAreaId: number;

  @Column()
  sensitiveAreaName: string;

  @Column()
  floor: string;

  @Column({ type: 'datetime' })
  validFrom: Date;

  @Column({ type: 'datetime' })
  validUntil: Date;

  @Column({ type: 'simple-enum', enum: SensitiveAreaApprovalStatus, default: SensitiveAreaApprovalStatus.PENDING })
  status: SensitiveAreaApprovalStatus;

  @Column({ nullable: true })
  reason: string;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ type: 'datetime', nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  rejectedReason: string;

  @Column({ nullable: true })
  permissionId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
