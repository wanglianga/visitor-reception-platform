import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './appointment.entity';
import { CreateAppointmentDto, UpdateAppointmentDto } from './appointment.dto';
import { AppointmentStatus } from '../common/enums';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
  ) {}

  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    const appointment = this.appointmentRepo.create({
      ...dto,
      expectedTime: new Date(dto.expectedTime),
    });
    return this.appointmentRepo.save(appointment);
  }

  async findAll(status?: AppointmentStatus): Promise<Appointment[]> {
    const where: any = {};
    if (status) where.status = status;
    return this.appointmentRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<Appointment> {
    const appointment = await this.appointmentRepo.findOne({ where: { id } });
    if (!appointment) throw new NotFoundException(`Appointment #${id} not found`);
    return appointment;
  }

  async update(id: number, dto: UpdateAppointmentDto): Promise<Appointment> {
    const appointment = await this.findOne(id);
    Object.assign(appointment, dto);
    return this.appointmentRepo.save(appointment);
  }

  async findPendingForEmployee(employeeId: number): Promise<Appointment[]> {
    return this.appointmentRepo.find({
      where: { employeeId, status: AppointmentStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
  }
}
