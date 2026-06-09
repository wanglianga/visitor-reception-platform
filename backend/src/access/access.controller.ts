import { Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { AccessService } from './access.service';
import { CreateAccessPermissionDto, UpdateAccessPermissionDto, CreateAccessRecordDto } from './access.dto';
import { AccessPermissionStatus } from '../common/enums';

@Controller('access')
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  @Post('permissions')
  createPermission(@Body() dto: CreateAccessPermissionDto) {
    return this.accessService.createPermission(dto);
  }

  @Get('permissions')
  findAllPermissions(@Query('status') status?: AccessPermissionStatus) {
    return this.accessService.findAllPermissions(status);
  }

  @Patch('permissions/:id')
  updatePermission(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAccessPermissionDto) {
    return this.accessService.updatePermission(id, dto);
  }

  @Post('records')
  createRecord(@Body() dto: CreateAccessRecordDto) {
    return this.accessService.createRecord(dto);
  }

  @Get('records')
  findAllRecords() {
    return this.accessService.findAllRecords();
  }

  @Get('overstay')
  getOverstayed() {
    return this.accessService.getOverstayed();
  }
}
