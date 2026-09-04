import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TcrOfficerAllocation } from 'src/entities/tcrOfficerAllocation.entity';
import { Station } from 'src/entities/station.entity';
import { UserModule } from 'src/user/user.module';
import { Tcr } from 'src/entities/tcr.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TcrOfficerAllocation, Station, Tcr]),
    UserModule,
  ],
  providers: [ReportService],
  controllers: [ReportController],
})
export class ReportModule {}
