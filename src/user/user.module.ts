import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Permission } from 'src/entities/permission.entity';
import { AuthGuard } from 'src/guards/authGuard';
import { PermissionGuard } from 'src/guards/permissionGuard';
import { Designation } from 'src/entities/designation.entity';
import { Station } from 'src/entities/station.entity';
import { OfficerStationAssignment } from 'src/entities/officerStationAssignment.entity';
import { Officer } from 'src/entities/officer.entity';
import { PasswordRecoveryRequest } from 'src/entities/passwordRecoveryRequest.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Permission,
      Designation,
      Station,
      OfficerStationAssignment,
      Officer,
      PasswordRecoveryRequest,
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [UserController],
  providers: [UserService, AuthGuard, PermissionGuard],
  exports: [JwtModule, AuthGuard, PermissionGuard],
})
export class UserModule {}
