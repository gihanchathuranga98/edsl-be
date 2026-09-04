import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { RequirePermission } from 'src/decorators/requirePermission.decorator';
import { Permission } from 'src/enums/permissions.enum';
import { AuthGuard } from 'src/guards/authGuard';
import { PermissionGuard } from 'src/guards/permissionGuard';
import { ReportService } from './report.service';

@Controller('api/v1/report')
@UseGuards(AuthGuard, PermissionGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('officer-handling-type-summary')
  @RequirePermission(Permission.VIEW_TCR)
  async getOfficerHandlingTypeSummary(
    @Body() payload: { startDate: string; endDate: string },
  ) {
    return await this.reportService.getOfficerHandlingTypeSummary(payload);
  }

  @Post('total-tcr-summary')
  @RequirePermission(Permission.VIEW_TCR)
  async getTotalTcrSummary(
    @Body() payload: { startDate: string; endDate: string },
  ) {
    return await this.reportService.getTotalTcrSummary(payload);
  }

  @Post('all-tcrs')
  @RequirePermission(Permission.VIEW_TCR)
  async getAllTcrsReport(
    @Body() payload: { startDate: string; endDate: string },
  ) {
    return await this.reportService.getAllTcrsReport(payload);
  }
}
