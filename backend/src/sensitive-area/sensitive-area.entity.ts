import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { SensitiveAreaType } from '../common/enums';

@Entity('sensitive_areas')
export class SensitiveArea {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'simple-enum', enum: SensitiveAreaType })
  type: SensitiveAreaType;

  @Column()
  floor: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  departmentHead: string;

  @Column({ default: true })
  requireApproval: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
