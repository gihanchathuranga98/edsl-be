import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { FundService } from './fund.service';
import { AuthGuard } from 'src/guards/authGuard';
import { PermissionGuard } from 'src/guards/permissionGuard';
import { RequirePermission } from 'src/decorators/requirePermission.decorator';
import { Permission } from 'src/enums/permissions.enum';
import { FundTypesEnum } from 'src/enums/fundType.enum';

@Controller('api/v1/fund')
@UseGuards(AuthGuard, PermissionGuard)
export class FundController {
  constructor(private readonly fundService: FundService) {}

  @Post('create')
  @RequirePermission(Permission.CREATE_FUNDS)
  async createFund(
    @Body() payload: { fundType: FundTypesEnum; fundShare: number },
    @Req() request: any,
  ) {
    return await this.fundService.createFund(payload, request?.user?.id);
  }

  @Get('all')
//   @RequirePermission(Permission.READ_ALL_FUNDS)
  async getAllFunds() {
    return await this.fundService.getAllFunds();
  }
}
