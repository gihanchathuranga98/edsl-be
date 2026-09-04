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
import { RequirePermission } from 'src/decorators/requirePermission.decorator';
import { Permission } from 'src/enums/permissions.enum';
import { AuthGuard } from 'src/guards/authGuard';
import { PermissionGuard } from 'src/guards/permissionGuard';
import { TcrService } from './tcr.service';
import { TcrStatus } from 'src/enums/tcrStatus.enum';
import type { CreateTcrDto } from './dtos/createTcr.dto';

@Controller('api/v1/tcr')
@UseGuards(AuthGuard, PermissionGuard)
export class TcrController {
  constructor(private readonly tcrService: TcrService) {}

  @Post('create')
  @RequirePermission(Permission.CREATE_TCR)
  async createTcr(@Body() payload: CreateTcrDto, @Req() request: any) {
    return await this.tcrService.createTcr(payload, request.user.id);
  }

  @Get('all')
//   @RequirePermission(Permission.)
  async getAllTcrDetails() {
    return await this.tcrService.getAllTcrDetails();
  }

  @Get('get/:tcr')
  async getTcrDetails(@Param('tcr') tcrId: string) {
    return await this.tcrService.getTcrDetails(tcrId);
  }

  @Post('review/:tcr/:type')
  @RequirePermission(Permission.APPROVE_TCR)
  async approveTcr(
    @Param('tcr') tcrId: string,
    @Param('type') type: TcrStatus,
    @Req() request: any,
  ) {
    return await this.tcrService.approveTcr(tcrId, type, request.user.id);
  }

  @Delete(':tcr')
  @RequirePermission(Permission.CREATE_TCR)
  async deleteTcr(@Param('tcr') tcrId: string) {
    return await this.tcrService.deleteTcr(tcrId);
  }

  @Put('/update/:tcr')
  @RequirePermission(Permission.CREATE_TCR)
  async updateTcr(@Param('tcr') tcrId: string, @Body() payload: CreateTcrDto) {
    return await this.tcrService.updateTcr(tcrId, payload);
  }
}
