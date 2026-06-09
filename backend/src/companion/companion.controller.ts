import { Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { CompanionService } from './companion.service';
import { RegisterCompanionDto, ConfirmCompanionDto, RejectCompanionDto } from './companion.dto';
import { CompanionStatus } from '../common/enums';

@Controller('companions')
export class CompanionController {
  constructor(private readonly companionService: CompanionService) {}

  @Post()
  register(@Body() dto: RegisterCompanionDto) {
    return this.companionService.register(dto);
  }

  @Get()
  findAll(@Query('status') status?: CompanionStatus) {
    return this.companionService.findAll(status);
  }

  @Get('visitor/:visitorId')
  findByVisitor(@Param('visitorId', ParseIntPipe) visitorId: number) {
    return this.companionService.findByVisitor(visitorId);
  }

  @Patch(':id/confirm')
  confirm(@Param('id', ParseIntPipe) id: number, @Body() dto: ConfirmCompanionDto) {
    return this.companionService.confirm(id, dto);
  }

  @Patch(':id/reject')
  reject(@Param('id', ParseIntPipe) id: number, @Body() dto: RejectCompanionDto) {
    return this.companionService.reject(id, dto);
  }
}
