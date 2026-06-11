import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { SensitiveAreaService } from './sensitive-area.service';
import {
  CreateSensitiveAreaDto,
  UpdateSensitiveAreaDto,
  RequestSensitiveAccessDto,
  HandleSensitiveApprovalDto,
} from './sensitive-area.dto';
import { SensitiveAreaApprovalStatus } from '../common/enums';

@Controller('sensitive-areas')
export class SensitiveAreaController {
  constructor(private readonly sensitiveAreaService: SensitiveAreaService) {}

  @Get()
  findAllAreas() {
    return this.sensitiveAreaService.findAllAreas();
  }

  @Post()
  createArea(@Body() dto: CreateSensitiveAreaDto) {
    return this.sensitiveAreaService.createArea(dto);
  }

  @Patch(':id')
  updateArea(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSensitiveAreaDto) {
    return this.sensitiveAreaService.updateArea(id, dto);
  }

  @Delete(':id')
  deleteArea(@Param('id', ParseIntPipe) id: number) {
    return this.sensitiveAreaService.deleteArea(id);
  }

  @Get('approvals')
  findAllApprovals(@Query('status') status?: SensitiveAreaApprovalStatus) {
    return this.sensitiveAreaService.findAllApprovals(status);
  }

  @Get('approvals/visitor/:visitorId')
  findApprovalsByVisitor(@Param('visitorId', ParseIntPipe) visitorId: number) {
    return this.sensitiveAreaService.findApprovalsByVisitor(visitorId);
  }

  @Post('request-access')
  requestAccess(@Body() dto: RequestSensitiveAccessDto) {
    return this.sensitiveAreaService.requestAccess(dto);
  }

  @Patch('approvals/:id/handle')
  handleApproval(@Param('id', ParseIntPipe) id: number, @Body() dto: HandleSensitiveApprovalDto) {
    return this.sensitiveAreaService.handleApproval(id, dto);
  }

  @Get('check-access')
  checkAccess(@Query('visitorId', ParseIntPipe) visitorId: number, @Query('floor') floor: string) {
    return this.sensitiveAreaService.isAccessAllowed(visitorId, floor);
  }
}
