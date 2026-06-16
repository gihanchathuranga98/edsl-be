import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from 'src/guards/authGuard';
import { PermissionGuard } from 'src/guards/permissionGuard';
import { RequirePermission } from 'src/decorators/requirePermission.decorator';
import { Permission } from 'src/enums/permissions.enum';
import { UserLoginDto } from './dtos/userLogin.dto';
import { CreateUserDto } from './dtos/createUser.dto';
import express from 'express';
import { CreateDesignationDto } from './dtos/createDesignation.dto';

@Controller('api/v1/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('login')
  async login(
    @Body() body: UserLoginDto,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    return await this.userService.userLogin(body, response);
  }

  @Post('recover-password')
  async recoverPassword(@Body() payload: { email: string }) {
    return await this.userService.recoverPassword(payload.email);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Get('recovery-requests')
  @RequirePermission(Permission.RECOVER_USER_PASSWORD)
  async getRecoveryRequests() {
    return await this.userService.getRecoveryRequests();
  }

  @Post('refresh-token')
  async refreshToken(
    @Res({ passthrough: true }) response: express.Response,
    @Req() request: any,
  ) {
    return await this.userService.refreshTocken(response, request);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission(Permission.CREATE_USER)
  @Post('create-user')
  async createUser(@Body() payload: CreateUserDto, @Req() request: any) {
    return await this.userService.createNewUser(payload, request?.user?.id);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission(Permission.READ_ALL_SYSTEM_USERS)
  @Get('all')
  async fetchAllSystemUsers() {
    return await this.userService.fetchAllSystemUsers();
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission(Permission.DELETE_USER)
  @Delete('remove/:id')
  async removeSystemUser(@Param('id') userId: string, @Req() request: any) {
    return await this.userService.removeSystemUser(userId, request?.user?.id);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission(Permission.CREATE_DESIGNATION)
  @Post('designation')
  async createNewDesignation(
    @Body() body: CreateDesignationDto,
    @Req() request: any,
  ) {
    return await this.userService.createNewDesignation(body, request?.user?.id);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission(Permission.READ_DESIGNATIONS)
  @Get('designations')
  async fetchAllDesignations() {
    return await this.userService.fetchAllDesignations();
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission(Permission.CREATE_OFFICER)
  @Post('officer')
  async createOfficer(@Body() payload, @Req() request: any) {
    return await this.userService.createOfficer(payload, request?.user?.id);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission(Permission.READ_ALL_OFFICERS)
  @Get('officers')
  async getAllOfficers() {
    return await this.userService.getAllOfficers();
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission(Permission.CREATE_OFFICER)
  @Post('assign-station')
  async assignStationToOfficer(
    @Body() payload: { stationId: string; officerId: string },
    @Req() request: any,
  ) {
    return await this.userService.assignStationToOfficer(
      payload,
      request?.user?.id,
    );
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @Post('/change-password')
  async changePassword(
    @Req() request: any,
    @Body() payload: { oldPassword: string; newPassword: string },
  ) {
    return await this.userService.changePassword(request?.user?.id, payload);
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission(Permission.RECOVER_USER_PASSWORD)
  @Post('/reset-password')
  async resetPassword(
    @Body() payload: { requestId: string; newPwd: string },
    @Req() request: any,
  ) {
    return await this.userService.resetPassword(payload, request?.user?.id);
  }
}
