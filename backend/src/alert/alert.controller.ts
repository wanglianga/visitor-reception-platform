import { Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { AlertService } from './alert.service';
import { CreateAlertDto, HandleAlertDto } from './alert.dto';
import { AlertType } from '../common/enums';

@Controller('alerts')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Get()
  findAll(@Query('type') type?: AlertType, @Query('handled') handled?: string) {
    const handledBool = handled === 'true' ? true : handled === 'false' ? false : undefined;
    return this.alertService.findAll(type, handledBool);
  }

  @Post()
  create(@Body() dto: CreateAlertDto) {
    return this.alertService.create(dto);
  }

  @Patch(':id/handle')
  handle(@Param('id', ParseIntPipe) id: number, @Body() dto: HandleAlertDto) {
    return this.alertService.handle(id, dto);
  }
}
