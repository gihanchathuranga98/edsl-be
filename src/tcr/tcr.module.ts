import { Module } from '@nestjs/common';
import { TcrController } from './tcr.controller';
import { TcrService } from './tcr.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { User } from 'src/entities/user.entity';
import { Fund } from 'src/entities/fund.entity';
import { Tcr } from 'src/entities/tcr.entity';
import { Station } from 'src/entities/station.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Fund, Tcr, Station]), UserModule],
  controllers: [TcrController],
  providers: [TcrService],
})
export class TcrModule {}
