import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppointmentModule } from './appointment/appointment.module';
import { VisitorModule } from './visitor/visitor.module';
import { AccessModule } from './access/access.module';
import { MeetingModule } from './meeting/meeting.module';
import { AlertModule } from './alert/alert.module';
import { CompanionModule } from './companion/companion.module';
import { SeedModule } from './seed/seed.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DB_PATH || 'visitor_reception.db',
      autoLoadEntities: true,
      synchronize: true,
    }),
    ScheduleModule.forRoot(),
    AppointmentModule,
    VisitorModule,
    AccessModule,
    MeetingModule,
    AlertModule,
    CompanionModule,
    SeedModule,
    DashboardModule,
  ],
})
export class AppModule {}
