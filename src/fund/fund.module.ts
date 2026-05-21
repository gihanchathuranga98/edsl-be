import { Module } from '@nestjs/common';
import { FundController } from './fund.controller';
import { FundService } from './fund.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Fund } from 'src/entities/fund.entity';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Fund]), UserModule],
  controllers: [FundController],
  providers: [FundService],
})
export class FundModule {}
