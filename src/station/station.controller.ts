import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/authGuard';
import { PermissionGuard } from 'src/guards/permissionGuard';
import { StationService } from './station.service';
import { RequirePermission } from 'src/decorators/requirePermission.decorator';
import { Permission } from 'src/enums/permissions.enum';

@Controller('api/v1/station')
@UseGuards(AuthGuard, PermissionGuard)
export class StationController {
  constructor(private readonly stationService: StationService) {}

  @Post('create')
  @RequirePermission(Permission.CREATE_STATIONS)
  async createNewStation(@Body() body: any, @Req() request: any) {
    return await this.stationService.createNewStation(body, request?.user?.id);
  }

  @Get('all')
  @RequirePermission()
  async getAllStations() {
    return await this.stationService.getAllStations();
  }

  @Delete('remove/:id')
  @RequirePermission(Permission.DELETE_USER)
  async removeStation(@Param('id') stationId: string) {
    return await this.stationService.removeStation(stationId);
  }

  @Put('update/:id')
  @RequirePermission(Permission.CREATE_STATIONS)
  async updateStation(@Param('id') stationId: string, @Body() body: any) {
    return await this.stationService.updateStation(stationId, body);
  }
}
