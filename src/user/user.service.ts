import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { In, IsNull, Repository } from 'typeorm';
import { CreateUserDto } from './dtos/createUser.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { Permission as PermissionEntity } from 'src/entities/permission.entity';
import { Permission as PermissionEnum } from 'src/enums/permissions.enum';
import { UserLoginDto } from './dtos/userLogin.dto';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';
import { CreateDesignationDto } from './dtos/createDesignation.dto';
import { Designation } from 'src/entities/designation.entity';
import { Officer } from 'src/entities/officer.entity';
import { OfficerStationAssignment } from 'src/entities/officerStationAssignment.entity';
import { CreateOfficerDto } from './dtos/createOfficer.dto';
import { Station } from 'src/entities/station.entity';
import { PasswordRecoveryRequest } from 'src/entities/passwordRecoveryRequest.entity';
import { PasswordRecoveryRequestEnum } from 'src/enums/passwordRecoveryRequestStatus.enum';

@Injectable()
export class UserService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Designation)
    private readonly designationRepo: Repository<Designation>,
    @InjectRepository(Officer)
    private readonly officerRepo: Repository<Officer>,
    @InjectRepository(PasswordRecoveryRequest)
    private readonly passwordRecoveryRequestRepo: Repository<PasswordRecoveryRequest>,
    private readonly jwtService: JwtService,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepo.findOne({
      where: { email },
      select: ['id', 'email', 'password'],
    });
  }

  async createNewUser(
    payload: CreateUserDto,
    createdBy: string,
  ): Promise<{ status: string; message: string }> {
    if (!payload.email || !payload.password) {
      throw new UnprocessableEntityException({
        code: 2001,
        message: 'Email and password are required',
      });
    }

    const newUser: User = new User();

    const hashedPassword = await bcrypt.hash(
      payload.password.trim(),
      this.configService.get<number>('SALT_ROUNDS') || 10,
    );

    const permissions = payload.permissions.map((perm: string) => {
      const permissionEntity = new PermissionEntity();
      permissionEntity.name = perm as PermissionEnum;
      return permissionEntity;
    });

    newUser.email = payload.email.trim();
    newUser.password = hashedPassword;
    newUser.createdBy = createdBy;
    newUser.permissions = permissions;

    await this.userRepo.save(newUser);

    return { status: 'success', message: 'User created successfully' };
  }

  async userLogin(payload: UserLoginDto, response: Response) {
    if (!payload.email || !payload.password) {
      throw new UnprocessableEntityException({
        code: 2001,
        message: 'Email and password are required',
      });
    }

    const user = await this.userRepo.findOne({
      where: { email: payload.email },
      select: ['id', 'email', 'password', 'name'],
      relations: ['permissions'],
    });

    console.log('user data', user);

    if (!user) {
      throw new NotFoundException({
        code: 2002,
        message: 'User not found',
      });
    }

    const isMatch = await bcrypt.compare(payload.password, user.password);

    if (!isMatch) {
      throw new UnprocessableEntityException({
        code: 2003,
        message: 'Invalid username or password',
      });
    }

    const jwtToken = await this.jwtService.signAsync(
      {
        ...user,
        permissions: user.permissions.map((p) => {
          return p.name;
        }),
      },
      { secret: this.configService.get('JWT_SECRET'), expiresIn: '15m' },
    );

    const newRefreshToken = randomBytes(64).toString('hex');

    await this.userRepo.update(
      { id: user.id },
      { refreshToken: newRefreshToken, refreshTokenCreatedAt: new Date() },
    );

    response.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    response.cookie('accessToken', `Bearer ${jwtToken}`, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 17 * 60 * 1000,
      path: '/',
    });

    return {
      name: user.name,
      id: user.id,
      email: user.email,
      permissions: user.permissions.map((p) => {
        return p.name;
      }),
    };
  }

  async refreshTocken(response: Response, request: any) {
    const userData: User | null = await this.userRepo.findOne({
      where: { refreshToken: request.cookies?.refreshToken },
      select: ['refreshToken', 'id', 'name', 'email'],
      relations: { permissions: true },
    });

    if (!userData) {
      throw new UnauthorizedException('User is not active');
    }

    const jwtToken = await this.jwtService.signAsync(
      {
        ...userData,
        permissions: userData.permissions.map((p) => {
          return p.name;
        }),
      },
      { secret: this.configService.get('JWT_SECRET'), expiresIn: '15m' },
    );

    response.cookie('accessToken', `Bearer ${jwtToken}`, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 16 * 60 * 1000,
      path: '/',
    });

    return {
      name: userData.name,
      id: userData.id,
      email: userData.email,
      permissions: userData.permissions.map((p) => {
        return p.name;
      }),
    };
  }

  async fetchAllSystemUsers() {
    return await this.userRepo.find({
      select: ['id', 'name', 'email'],
      relations: ['permissions'],
      order: { createdAt: 'DESC' },
    });
  }

  async removeSystemUser(userId: string, currentUserId: string) {
    if (userId === currentUserId) {
      throw new UnprocessableEntityException({
        code: 2004,
        message: 'You cannot delete your own account',
      });
    }

    return await this.userRepo.softDelete({ id: userId });
  }

  async createNewDesignation(body: CreateDesignationDto, userId: string) {
    const newDesignation = new Designation();
    newDesignation.designation = body.designation.trim();
    newDesignation.fundShare = body.fundShare;
    newDesignation.createdBy = userId;

    return await this.designationRepo.save(newDesignation);
  }

  async fetchAllDesignations() {
    return await this.designationRepo.find({
      select: ['id', 'designation', 'fundShare'],
      order: { createdAt: 'DESC' },
    });
  }

  async createOfficer(payload: CreateOfficerDto, userId: string) {
    const officerStationAssignment = new OfficerStationAssignment();
    officerStationAssignment.station = { id: payload.stationId } as Station;

    const newOfficer = this.officerRepo.create({
      name: payload.name,
      code: payload.code,
      designation: { id: payload.designationId } as Designation,
      stations: [officerStationAssignment],
      createdBy: userId,
    });

    return await this.officerRepo.save(newOfficer);
  }

  async getAllOfficers() {
    return await this.officerRepo.find({
      relations: ['designation', 'stations', 'stations.station'],
      order: { createdAt: 'DESC' },
    });
  }

  async recoverPassword(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    const prevRequests = await this.passwordRecoveryRequestRepo.find({
      where: { email, status: PasswordRecoveryRequestEnum.PENDING },
    });

    if (prevRequests.length > 0) {
      throw new UnprocessableEntityException({
        code: 2005,
        message:
          'A password recovery request is already pending for this email',
      });
    }

    const passwordRecoveryRequestObj = new PasswordRecoveryRequest();

    passwordRecoveryRequestObj.email = email;
    passwordRecoveryRequestObj.userId = user.id;
    passwordRecoveryRequestObj.status = PasswordRecoveryRequestEnum.PENDING;

    await this.passwordRecoveryRequestRepo.save(passwordRecoveryRequestObj);
    return {
      status: 'success',
      message: 'Password recovery request has been sent',
    };
  }

  async getRecoveryRequests() {
    const pwRecoverReq = await this.passwordRecoveryRequestRepo.find({
      where: { status: PasswordRecoveryRequestEnum.PENDING },
      order: { createdAt: 'DESC' },
    });

    if (pwRecoverReq.length === 0) {
      return [];
    }

    const users = await this.userRepo.find({
      where: { id: In(pwRecoverReq.map((req) => req.userId)) },
      select: ['name', 'email', 'id'],
    });

    // map request ids to the users ids and return
    return pwRecoverReq.map((req) => {
      const user = users.find((u) => u.id === req.userId);
      return {
        createdAt: req.createdAt,
        requestId: req.id,
        userId: req.userId,
        userName: user?.name,
        userEmail: user?.email,
      };
    });
  }
}
