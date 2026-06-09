import { Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { VisitorService } from './visitor.service';
import { RegisterVisitorDto, UpdateVisitorDto } from './visitor.dto';
import { VisitorStatus } from '../common/enums';

@Controller('visitors')
export class VisitorController {
  constructor(private readonly visitorService: VisitorService) {}

  @Post('register')
  register(@Body() dto: RegisterVisitorDto) {
    return this.visitorService.register(dto);
  }

  @Get()
  findAll(@Query('status') status?: VisitorStatus) {
    return this.visitorService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.visitorService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVisitorDto) {
    return this.visitorService.update(id, dto);
  }

  @Post(':id/checkout')
  checkout(@Param('id', ParseIntPipe) id: number) {
    return this.visitorService.checkout(id);
  }
}
