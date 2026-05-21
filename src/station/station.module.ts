import { Module } from '@nestjs/common';
import { StationController } from './station.controller';
import { StationService } from './station.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Station } from 'src/entities/station.entity';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Station]), UserModule],
  controllers: [StationController],
  providers: [StationService],
})
export class StationModule {}
